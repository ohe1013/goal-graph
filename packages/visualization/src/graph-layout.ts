import type { MindmapGraph, MindmapGraphNode } from "@goal-graph/core";

export interface PositionedMindmapGraphNode extends MindmapGraphNode {
  position: {
    x: number;
    y: number;
  };
}

export interface PositionedMindmapGraph extends Omit<MindmapGraph, "nodes"> {
  nodes: PositionedMindmapGraphNode[];
}

export function createRadialMindmapLayout(
  graph: MindmapGraph,
  options: { radius?: number; centerX?: number; centerY?: number } = {}
): PositionedMindmapGraph {
  const radius = options.radius ?? 320;
  const centerX = options.centerX ?? 420;
  const centerY = options.centerY ?? 300;
  const center = graph.nodes.find((node) => node.id === graph.central_node_id);
  const branches = graph.nodes.filter((node) => node.id !== graph.central_node_id);

  const positioned: PositionedMindmapGraphNode[] = [];
  if (center) {
    positioned.push({
      ...center,
      position: {
        x: centerX,
        y: centerY
      }
    });
  }

  branches.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(branches.length, 1) - Math.PI / 2;
    positioned.push({
      ...node,
      position: {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      }
    });
  });

  return {
    ...graph,
    nodes: positioned
  };
}

