import type { ImpactType, QuestionDirective, QuestionDirectiveSource } from "../schemas/types.js";

export interface ParsedQuestionDirective {
  rawText: string;
  normalizedText: string;
  directive: QuestionDirective;
  directiveSource: QuestionDirectiveSource;
}

const aliases: Record<string, QuestionDirective> = {
  auto: "auto",
  none: "none",
  no: "none",
  tactical: "none",
  local: "none",
  weak: "weak",
  refine: "weak",
  refinement: "weak",
  strong: "strong",
  direction: "strong",
  structural: "strong",
  boundary: "boundary",
  non_goal: "boundary",
  nongoal: "boundary",
  conflict: "conflict",
  drift: "drift",
  evidence: "evidence",
  source: "evidence"
};

export function parseQuestionDirective(
  rawText: string,
  defaultDirective: QuestionDirective = "auto"
): ParsedQuestionDirective {
  const match = /^\s*#([A-Za-z_][A-Za-z0-9_-]*)(?:\s+|$)/.exec(rawText);
  if (!match) {
    return {
      rawText,
      normalizedText: rawText.trim(),
      directive: defaultDirective,
      directiveSource: "default"
    };
  }

  const key = match[1].replace(/-/g, "_").toLowerCase();
  const directive = aliases[key];
  if (!directive) {
    return {
      rawText,
      normalizedText: rawText.trim(),
      directive: defaultDirective,
      directiveSource: "default"
    };
  }

  return {
    rawText,
    normalizedText: rawText.slice(match[0].length).trim(),
    directive,
    directiveSource: "inline"
  };
}

export function impactTypeForDirective(
  directive: QuestionDirective,
  heuristicImpactType: ImpactType
): ImpactType {
  switch (directive) {
    case "none":
      return "tactical";
    case "weak":
      if (
        heuristicImpactType === "conflict" ||
        heuristicImpactType === "goal_drift" ||
        heuristicImpactType === "boundary_clarification" ||
        heuristicImpactType === "source_evidence"
      ) {
        return heuristicImpactType;
      }
      return "structural_refinement";
    case "strong":
      return "direction_update";
    case "boundary":
      return "boundary_clarification";
    case "conflict":
      return "conflict";
    case "drift":
      return "goal_drift";
    case "evidence":
      return "source_evidence";
    case "auto":
      return heuristicImpactType;
  }
}
