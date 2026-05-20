import type { DirectionDelta, ImpactAnalysis, MentalModel } from "../schemas/types.js";
import { nowTimestamp } from "../time.js";

export function applyImpactAnalysis(
  model: MentalModel,
  analysis: ImpactAnalysis,
  timestamp = nowTimestamp()
): MentalModel {
  const affected = new Set(analysis.affected_nodes);
  const nodes = model.nodes.map((node) => {
    if (!affected.has(node.id)) {
      return node;
    }
    return {
      ...node,
      source_question_ids: appendUnique(node.source_question_ids, analysis.question_id),
      updated_at: timestamp
    };
  });

  const edges = model.edges.map((edge) => {
    if (!affected.has(edge.from) && !affected.has(edge.to)) {
      return edge;
    }
    return {
      ...edge,
      source_question_ids: appendUnique(edge.source_question_ids, analysis.question_id)
    };
  });

  return {
    ...model,
    updated_at: timestamp,
    nodes,
    edges
  };
}

export interface CreateDirectionDeltaInput {
  id: string;
  timestamp?: string;
  analysis: ImpactAnalysis;
  before: string;
  after: string;
}

export function createDirectionDelta(input: CreateDirectionDeltaInput): DirectionDelta {
  return {
    id: input.id,
    timestamp: input.timestamp ?? nowTimestamp(),
    question_id: input.analysis.question_id,
    impact_type: input.analysis.impact_type,
    affected_nodes: input.analysis.affected_nodes,
    summary: input.analysis.summary,
    before: input.before,
    after: input.after
  };
}

export function appendUnique(values: string[], next: string): string[] {
  return values.includes(next) ? values : [...values, next];
}

