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

export const questionDirectives = [
  "auto",
  "none",
  "weak",
  "strong",
  "boundary",
  "conflict",
  "drift",
  "evidence"
] as const;

export type QuestionDirective = (typeof questionDirectives)[number];

export type QuestionDirectiveSource = "inline" | "default";

export type QuestionSource = "user" | "assistant" | "system";

export interface QuestionEvent {
  id: string;
  timestamp: string;
  text: string;
  normalized_text?: string;
  source: QuestionSource;
  related_files: string[];
  tags: string[];
  directive?: QuestionDirective;
  directive_source?: QuestionDirectiveSource;
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
  directive?: QuestionDirective;
  directive_source?: QuestionDirectiveSource;
  affected_nodes: string[];
  strengthened: string[];
  weakened: string[];
  added: string[];
  removed: string[];
  conflicts: string[];
  summary: string;
}

export interface QuestionModeConfig {
  version: 1;
  default_directive: QuestionDirective;
  updated_at: string;
  source_question_id?: string;
}

export interface ProjectAnalysis {
  version: 1;
  analyzed_at: string;
  project_root: string;
  project_name: string;
  package_manager?: string;
  package_name?: string;
  package_scripts: string[];
  workspaces: string[];
  lockfiles: string[];
  top_level_directories: string[];
  docs: string[];
  source_directories: string[];
  file_extension_counts: Record<string, number>;
  inferred_stack: string[];
  summary: string;
}

export interface SyncState {
  version: 1;
  synced_at: string;
  project_root: string;
  refreshed_files: string[];
  copied_targets: string[];
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
