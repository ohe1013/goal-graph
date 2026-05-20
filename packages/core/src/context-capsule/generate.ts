import type { DirectionDelta, MentalModel, QuestionEvent } from "../schemas/types.js";

export interface GenerateContextCapsuleInput {
  goalMarkdown: string;
  model: MentalModel;
  questions: QuestionEvent[];
  directions: DirectionDelta[];
  relevantNodeIds?: string[];
  taskGuidance?: string;
}

export function generateContextCapsule(input: GenerateContextCapsuleInput): string {
  const relevantNodes = selectRelevantNodes(input.model, input.relevantNodeIds);
  const recentDirections = input.directions.slice(-5);
  const recentQuestions = input.questions.slice(-5);

  return [
    "# Project Mental Model Context",
    "",
    "## Original Goal",
    "",
    extractSection(input.goalMarkdown, "Original Goal"),
    "",
    "## Current Thesis",
    "",
    input.model.central_thesis,
    "",
    "## Current Structure",
    "",
    ...relevantNodes.map((node) => `- ${node.label}: ${node.summary}`),
    "",
    "## Recent Direction Changes",
    "",
    ...formatDirections(recentDirections),
    "",
    "## Relevant Source Questions",
    "",
    ...formatQuestions(recentQuestions),
    "",
    "## Task Guidance",
    "",
    input.taskGuidance ??
      "Before modifying code, classify the task impact. Keep implementation aligned with the Goal Anchor unless the user explicitly requests a pivot."
  ].join("\n");
}

function selectRelevantNodes(model: MentalModel, ids?: string[]) {
  if (!ids || ids.length === 0) {
    return model.nodes.slice(0, 8);
  }
  const selected = new Set(ids);
  return model.nodes.filter((node) => selected.has(node.id));
}

function formatDirections(directions: DirectionDelta[]): string[] {
  if (directions.length === 0) {
    return ["- None yet."];
  }
  return directions.map((delta) => `- \`${delta.id}\` (${delta.impact_type}): ${delta.summary}`);
}

function formatQuestions(questions: QuestionEvent[]): string[] {
  if (questions.length === 0) {
    return ["- None yet."];
  }
  return questions.map((question) => `- \`${question.id}\`: ${question.text}`);
}

function extractSection(markdown: string, heading: string): string {
  const pattern = new RegExp(`## ${escapeRegExp(heading)}\\n\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = pattern.exec(markdown);
  return match?.[1]?.trim() ?? markdown.trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

