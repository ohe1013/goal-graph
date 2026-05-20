import type { MentalModel } from "../schemas/types.js";

export function assertMentalModel(value: unknown): asserts value is MentalModel {
  if (!value || typeof value !== "object") {
    throw new Error("Mental model must be an object.");
  }

  const model = value as Partial<MentalModel>;
  if (model.version !== 1) {
    throw new Error("Mental model version must be 1.");
  }
  if (typeof model.central_thesis !== "string" || model.central_thesis.length === 0) {
    throw new Error("Mental model central_thesis is required.");
  }
  if (!Array.isArray(model.nodes)) {
    throw new Error("Mental model nodes must be an array.");
  }
  if (!Array.isArray(model.edges)) {
    throw new Error("Mental model edges must be an array.");
  }

  for (const node of model.nodes) {
    if (!node.id || !node.label || !Array.isArray(node.source_question_ids)) {
      throw new Error(`Invalid mental model node: ${JSON.stringify(node)}`);
    }
  }

  for (const edge of model.edges) {
    if (!edge.id || !edge.from || !edge.to || !Array.isArray(edge.source_question_ids)) {
      throw new Error(`Invalid mental model edge: ${JSON.stringify(edge)}`);
    }
  }
}

export function parseJsonl<T>(content: string, fileName: string): T[] {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return [];
  }

  return trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0).map((line, index) => {
    try {
      return JSON.parse(line) as T;
    } catch (error) {
      throw new Error(`${fileName}:${index + 1} is not valid JSONL: ${(error as Error).message}`);
    }
  });
}
