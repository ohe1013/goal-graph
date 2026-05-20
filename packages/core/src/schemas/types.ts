export const impactTypes = [
  "tactical",
  "structural_refinement",
  "direction_update",
  "goal_drift",
  "conflict",
  "boundary_clarification",
  "source_evidence"
] as const;

export type ImpactType = (typeof impactTypes)[number];

export type QuestionSource = "user" | "assistant" | "system";

export interface QuestionEvent {
  id: string;
  timestamp: string;
  text: string;
  source: QuestionSource;
  related_files: string[];
  tags: string[];
}

export interface DirectionDelta {
  id: string;
  timestamp: string;
  question_id: string;
  impact_type: ImpactType;
  affected_nodes: string[];
  summary: string;
  before?: string;
  after?: string;
}

export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  question_id?: string;
  summary: string;
  status: "proposed" | "accepted" | "rejected" | "superseded";
  related_files: string[];
}

export interface MentalModelNode {
  id: string;
  label: string;
  type: string;
  summary: string;
  status: "active" | "proposed" | "deprecated" | "resolved";
  confidence: number;
  source_question_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface MentalModelEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  summary: string;
  source_question_ids: string[];
  confidence: number;
}

export interface MentalModel {
  version: number;
  central_thesis: string;
  goal_anchor_id: string;
  updated_at: string;
  nodes: MentalModelNode[];
  edges: MentalModelEdge[];
  open_questions: string[];
  active_decisions: string[];
  risks: string[];
}

export interface ImpactAnalysis {
  question_id: string;
  impact_type: ImpactType;
  affected_nodes: string[];
  strengthened: string[];
  weakened: string[];
  added: string[];
  removed: string[];
  conflicts: string[];
  summary: string;
}

export interface MentalContext {
  goalMarkdown: string;
  baselineMarkdown: string;
  model: MentalModel;
  questions: QuestionEvent[];
  directions: DirectionDelta[];
}

export interface MindmapGraphNode {
  id: string;
  label: string;
  type: string;
  summary: string;
  status?: string;
  source_question_ids: string[];
}

export interface MindmapGraphEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  summary: string;
  source_question_ids: string[];
}

export interface MindmapGraph {
  central_node_id: string;
  nodes: MindmapGraphNode[];
  edges: MindmapGraphEdge[];
  layout: {
    type: "mindmap";
  };
}

