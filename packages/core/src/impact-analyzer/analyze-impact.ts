import type { ImpactAnalysis, ImpactType, MentalModel, QuestionDirective, QuestionEvent } from "../schemas/types.js";
import { impactTypeForDirective, parseQuestionDirective } from "../question-log/question-directive.js";

export interface AnalyzeImpactInput {
  question: QuestionEvent;
  mentalModel?: MentalModel;
  defaultDirective?: QuestionDirective;
}

const defaultInitialNodes = [
  "node_goal_anchor",
  "node_baseline_structure",
  "node_codex_wrapper",
  "node_question_log",
  "node_impact_analyzer",
  "node_mental_model_delta",
  "node_context_capsule",
  "node_mindmap_visualization"
];

export function analyzeImpact(input: AnalyzeImpactInput): ImpactAnalysis {
  const parsed = parseQuestionDirective(
    input.question.normalized_text ?? input.question.text,
    input.question.directive ?? input.defaultDirective ?? "auto"
  );
  const text = parsed.normalizedText.toLowerCase();
  const heuristicImpactType = classifyImpact(text);
  const impactType = impactTypeForDirective(parsed.directive, heuristicImpactType);
  const affectedNodes = inferAffectedNodes(text, impactType, input.mentalModel);

  return {
    question_id: input.question.id,
    impact_type: impactType,
    directive: parsed.directive,
    directive_source: input.question.directive_source ?? parsed.directiveSource,
    affected_nodes: affectedNodes,
    strengthened: impactType === "source_evidence" ? affectedNodes : [],
    weakened: impactType === "goal_drift" ? ["node_goal_anchor"] : [],
    added: impactType === "direction_update" || impactType === "structural_refinement" ? affectedNodes : [],
    removed: [],
    conflicts: impactType === "conflict" ? affectedNodes : [],
    summary: summarizeImpact(impactType, affectedNodes)
  };
}

function classifyImpact(text: string): ImpactType {
  if (containsAny(text, ["충돌", "모순", "conflict", "contradict"])) {
    return "conflict";
  }
  if (containsAny(text, ["하지 말", "아니", "non-goal", "not a", "boundary", "범위"])) {
    return "boundary_clarification";
  }
  if (containsAny(text, ["드리프트", "벗어나", "다른 방향", "pivot", "전환"])) {
    return "goal_drift";
  }
  if (containsAny(text, ["근거", "증거", "source evidence", "evidence", "왜냐하면"])) {
    return "source_evidence";
  }
  if (containsAny(text, ["생성", "초기화", "프로젝트", "아키텍처", "architecture", "mvp", "wrapper", "codex"])) {
    return "direction_update";
  }
  if (containsAny(text, ["추가", "구조", "기능", "마인드맵", "context capsule", "impact", "delta"])) {
    return "structural_refinement";
  }
  return "tactical";
}

function inferAffectedNodes(text: string, impactType: ImpactType, mentalModel?: MentalModel): string[] {
  const matches = new Set<string>();

  if (impactType === "direction_update" && containsAny(text, ["생성", "초기화", "프로젝트"])) {
    for (const nodeId of defaultInitialNodes) {
      matches.add(nodeId);
    }
  }
  if (containsAny(text, ["goal", "목표", "anchor"])) {
    matches.add("node_goal_anchor");
  }
  if (containsAny(text, ["baseline", "처음 구조", "초기 구조"])) {
    matches.add("node_baseline_structure");
  }
  if (containsAny(text, ["wrapper", "codex", "래퍼"])) {
    matches.add("node_codex_wrapper");
  }
  if (containsAny(text, ["질문", "question", "log"])) {
    matches.add("node_question_log");
  }
  if (containsAny(text, ["impact", "영향", "분류", "analyze"])) {
    matches.add("node_impact_analyzer");
  }
  if (containsAny(text, ["delta", "변화", "방향", "direction"])) {
    matches.add("node_mental_model_delta");
  }
  if (containsAny(text, ["context", "capsule", "맥락"])) {
    matches.add("node_context_capsule");
  }
  if (containsAny(text, ["mindmap", "마인드맵", "graph", "시각"])) {
    matches.add("node_mindmap_visualization");
  }

  if (matches.size === 0 && mentalModel?.nodes.length) {
    matches.add(mentalModel.nodes[0].id);
  }

  return [...matches];
}

function summarizeImpact(impactType: ImpactType, affectedNodes: string[]): string {
  const target = affectedNodes.length > 0 ? affectedNodes.join(", ") : "no specific node";
  switch (impactType) {
    case "direction_update":
      return `Updates the project direction or initial architecture around ${target}.`;
    case "structural_refinement":
      return `Refines existing model structure around ${target}.`;
    case "goal_drift":
      return `May move the work away from the Goal Anchor around ${target}.`;
    case "conflict":
      return `May conflict with an existing decision or model node around ${target}.`;
    case "boundary_clarification":
      return `Clarifies a product boundary around ${target}.`;
    case "source_evidence":
      return `Adds evidence or rationale for ${target}.`;
    case "tactical":
      return `Local implementation work with limited model impact around ${target}.`;
  }
}

function containsAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}
