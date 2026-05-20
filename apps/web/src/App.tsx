import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node
} from "@xyflow/react";
import { RefreshCw } from "lucide-react";
import { createRadialMindmapLayout } from "@goal-graph/visualization";

type MindmapGraphNode = {
  id: string;
  label: string;
  type: string;
  summary: string;
  status?: string;
  source_question_ids: string[];
};

type MindmapGraphEdge = {
  id: string;
  from: string;
  to: string;
  type: string;
  summary: string;
  source_question_ids: string[];
};

type MindmapGraph = {
  central_node_id: string;
  nodes: MindmapGraphNode[];
  edges: MindmapGraphEdge[];
  layout: {
    type: "mindmap";
  };
};

type QuestionEvent = {
  id: string;
  timestamp: string;
  text: string;
  source: string;
  related_files: string[];
  tags: string[];
};

type DirectionDelta = {
  id: string;
  timestamp: string;
  question_id: string;
  impact_type: string;
  affected_nodes: string[];
  summary: string;
  before?: string;
  after?: string;
};

const fallbackGraph: MindmapGraph = {
  central_node_id: "node_current_thesis",
  nodes: [
    {
      id: "node_current_thesis",
      label: "Central Thesis",
      type: "central_thesis",
      summary: "Goal-anchored Codex mental model wrapper.",
      status: "active",
      source_question_ids: ["q_001"]
    }
  ],
  edges: [],
  layout: {
    type: "mindmap"
  }
};

export function App() {
  const [graph, setGraph] = useState<MindmapGraph>(fallbackGraph);
  const [questions, setQuestions] = useState<QuestionEvent[]>([]);
  const [directions, setDirections] = useState<DirectionDelta[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(fallbackGraph.central_node_id);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">("idle");

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const [nextGraph, nextQuestions, nextDirections] = await Promise.all([
        fetchJson<MindmapGraph>("/mindmap.graph.json"),
        fetchJsonl<QuestionEvent>("/question-log.jsonl"),
        fetchJsonl<DirectionDelta>("/direction-history.jsonl")
      ]);
      setGraph(nextGraph);
      setQuestions(nextQuestions);
      setDirections(nextDirections);
      setSelectedNodeId((previous) =>
        nextGraph.nodes.some((node) => node.id === previous) ? previous : nextGraph.central_node_id
      );
      setLoadState("idle");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const questionById = useMemo(() => {
    return new Map(questions.map((question) => [question.id, question]));
  }, [questions]);

  const selectedNode = useMemo(() => {
    return graph.nodes.find((node) => node.id === selectedNodeId) ?? graph.nodes[0];
  }, [graph.nodes, selectedNodeId]);

  const flow = useMemo(() => {
    const positioned = createRadialMindmapLayout(graph, {
      centerX: 480,
      centerY: 340,
      radius: 300
    });

    const nodes: Node[] = positioned.nodes.map((node) => ({
      id: node.id,
      position: node.position,
      data: {
        label: (
          <div className="map-node">
            <span className="map-node__type">{node.type}</span>
            <strong>{node.label}</strong>
          </div>
        )
      },
      style: nodeStyle(node, graph.central_node_id)
    }));

    const edges: Edge[] = graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      label: edge.type,
      type: "smoothstep",
      animated: edge.type === "refreshes" || edge.type === "produces",
      style: {
        stroke: "#64748b",
        strokeWidth: 1.5
      },
      labelStyle: {
        fill: "#334155",
        fontSize: 11,
        fontWeight: 600
      }
    }));

    return { nodes, edges };
  }, [graph]);

  return (
    <main className="shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Goal Graph</p>
          <h1>{graph.nodes.find((node) => node.id === graph.central_node_id)?.label ?? "Central Thesis"}</h1>
        </div>
        <button className="icon-button" type="button" onClick={() => void load()} title="Refresh graph">
          <RefreshCw aria-hidden="true" size={18} />
        </button>
      </section>

      <section className="workspace">
        <div className="graph-surface">
          <ReactFlow
            nodes={flow.nodes}
            edges={flow.edges}
            fitView
            minZoom={0.4}
            maxZoom={1.4}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          >
            <Background color="#d6dee8" gap={24} />
            <Controls position="bottom-left" />
            <MiniMap pannable zoomable position="bottom-right" nodeColor="#2563eb" />
          </ReactFlow>
        </div>

        <aside className="side-panel">
          <div className="panel-section">
            <div className="panel-heading">
              <span>Selected Node</span>
              <small>{loadState === "error" ? "load error" : selectedNode?.status ?? "active"}</small>
            </div>
            {selectedNode ? (
              <div className="node-detail">
                <h2>{selectedNode.label}</h2>
                <p>{selectedNode.summary}</p>
                <dl>
                  <div>
                    <dt>Type</dt>
                    <dd>{selectedNode.type}</dd>
                  </div>
                  <div>
                    <dt>Sources</dt>
                    <dd>{selectedNode.source_question_ids.join(", ")}</dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </div>

          <div className="panel-section">
            <div className="panel-heading">
              <span>Source Questions</span>
              <small>{selectedNode?.source_question_ids.length ?? 0}</small>
            </div>
            <div className="stack">
              {(selectedNode?.source_question_ids ?? []).map((questionId) => {
                const question = questionById.get(questionId);
                return (
                  <article className="list-item" key={questionId}>
                    <span>{questionId}</span>
                    <p>{question?.text ?? "Question text unavailable"}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-heading">
              <span>Recent Deltas</span>
              <small>{directions.length}</small>
            </div>
            <div className="stack">
              {directions
                .slice(-5)
                .reverse()
                .map((delta) => (
                  <article className="list-item" key={delta.id}>
                    <span>
                      {delta.id} · {delta.impact_type}
                    </span>
                    <p>{delta.summary}</p>
                  </article>
                ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return (await response.json()) as T;
}

async function fetchJsonl<T>(url: string): Promise<T[]> {
  const response = await fetch(url, {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  const content = await response.text();
  const trimmed = content.trim();
  if (!trimmed) {
    return [];
  }
  return trimmed
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as T);
}

function nodeStyle(node: MindmapGraphNode, centralNodeId: string) {
  const isCentral = node.id === centralNodeId;
  return {
    width: isCentral ? 220 : 170,
    minHeight: isCentral ? 86 : 72,
    borderRadius: 8,
    border: isCentral ? "2px solid #1d4ed8" : "1px solid #cbd5e1",
    background: isCentral ? "#eff6ff" : "#ffffff",
    color: "#0f172a",
    boxShadow: isCentral ? "0 14px 30px rgba(37, 99, 235, 0.18)" : "0 10px 20px rgba(15, 23, 42, 0.08)"
  };
}
