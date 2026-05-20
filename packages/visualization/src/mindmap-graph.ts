import type { MentalModel, MindmapGraph } from "@goal-graph/core";

export function createMindmapGraph(model: MentalModel): MindmapGraph {
  return {
    central_node_id: "node_current_thesis",
    nodes: model.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      summary: node.id === "node_current_thesis" ? model.central_thesis : node.summary,
      status: node.status,
      source_question_ids: node.source_question_ids
    })),
    edges: model.edges.map((edge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      type: edge.type,
      summary: edge.summary,
      source_question_ids: edge.source_question_ids
    })),
    layout: {
      type: "mindmap"
    }
  };
}

