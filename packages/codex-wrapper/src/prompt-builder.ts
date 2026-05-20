import type { ImpactAnalysis, MentalModelNode } from "@goal-graph/core";

export interface BuildCodexPromptInput {
  task: string;
  contextCapsule: string;
  impactAnalysis: ImpactAnalysis;
  relevantNodes: MentalModelNode[];
}

export function buildCodexPrompt(input: BuildCodexPromptInput): string {
  return [
    "# Task",
    "",
    input.task,
    "",
    input.contextCapsule,
    "",
    "## Relevant Model Nodes",
    "",
    ...input.relevantNodes.map(
      (node) => `- ${node.id} (${node.label}): ${node.summary} [sources: ${node.source_question_ids.join(", ")}]`
    ),
    "",
    "## Instruction",
    "",
    `Before modifying code, state whether this task is ${input.impactAnalysis.impact_type}. Keep the implementation aligned with the Goal Anchor unless the user explicitly requests a pivot.`
  ].join("\n");
}

