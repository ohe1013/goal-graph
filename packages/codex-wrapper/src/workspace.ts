import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  analyzeProject,
  appendDirectionDelta,
  appendQuestionEvent,
  generateContextCapsule,
  mentalFiles,
  mentalPath,
  nextStableId,
  nowTimestamp,
  pathExists,
  readDirectionHistory,
  readMentalContext,
  readMentalModel,
  readQuestionLog,
  writeContextCapsule,
  writeJsonFile,
  writeMentalModel,
  writeMindmapGraph
} from "@goal-graph/core";
import type { MentalModel, MentalModelEdge, MentalModelNode, SyncState } from "@goal-graph/core";
import { initializeProjectMentalModel } from "@goal-graph/core";
import { createMindmapGraph } from "@goal-graph/visualization";

export interface OpenWorkspaceInput {
  projectRoot?: string;
  consent?: boolean;
  timestamp?: string;
}

export interface OpenWorkspaceResult {
  status: "needs_consent" | "opened";
  projectRoot: string;
  initialized: boolean;
  analysisSummary?: string;
  questionId?: string;
  syncedTargets?: string[];
}

export interface SyncWorkspaceInput {
  projectRoot?: string;
  timestamp?: string;
}

export interface SyncWorkspaceResult {
  projectRoot: string;
  refreshedFiles: string[];
  copiedTargets: string[];
}

export async function openWorkspace(input: OpenWorkspaceInput = {}): Promise<OpenWorkspaceResult> {
  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  const timestamp = input.timestamp ?? nowTimestamp();
  const hasMentalModel = await pathExists(mentalPath(projectRoot, mentalFiles.model));

  if (!hasMentalModel && !input.consent) {
    return {
      status: "needs_consent",
      projectRoot,
      initialized: false
    };
  }

  let initialized = false;
  if (!hasMentalModel) {
    await initializeProjectMentalModel({
      projectRoot,
      initialQuestionText: "#strong Initialize workspace mental model from project analysis",
      timestamp
    });
    initialized = true;
  }

  const analysis = await analyzeProject(projectRoot, timestamp);
  await writeJsonFile(projectRoot, mentalFiles.projectAnalysis, analysis);

  const question = await appendQuestionEvent({
    projectRoot,
    text: "#strong Open workspace and analyze project",
    normalizedText: "Open workspace and analyze project",
    directive: "strong",
    directiveSource: "inline",
    tags: ["workspace_open", "project_analysis"],
    timestamp
  });

  const modelBefore = await readMentalModel(projectRoot);
  const modelAfter = upsertProjectAnalysisModel(modelBefore, {
    questionId: question.id,
    timestamp,
    analysisSummary: analysis.summary,
    projectName: analysis.project_name
  });
  await writeMentalModel(projectRoot, modelAfter);

  const directions = await readDirectionHistory(projectRoot);
  await appendDirectionDelta(projectRoot, {
    id: nextStableId(directions, "delta"),
    timestamp,
    question_id: question.id,
    impact_type: "direction_update",
    affected_nodes: ["node_project_workspace_analysis", "node_codex_wrapper", "node_context_capsule"],
    summary: "Workspace was opened through the terminal wrapper and project analysis was injected into the mental model.",
    before: "Questions could be asked against an existing or default mental model without a project analysis step.",
    after: "Opening a workspace records project structure evidence before wrapped Codex questions continue."
  });

  const syncResult = await syncWorkspace({ projectRoot, timestamp });
  return {
    status: "opened",
    projectRoot,
    initialized,
    analysisSummary: analysis.summary,
    questionId: question.id,
    syncedTargets: syncResult.copiedTargets
  };
}

export async function syncWorkspace(input: SyncWorkspaceInput = {}): Promise<SyncWorkspaceResult> {
  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  const timestamp = input.timestamp ?? nowTimestamp();
  const context = await readMentalContext(projectRoot);
  const capsule = generateContextCapsule({
    goalMarkdown: context.goalMarkdown,
    model: context.model,
    questions: context.questions,
    directions: context.directions,
    taskGuidance:
      "Respect the terminal wrapper flow: open workspace, analyze project, honor question directives, then run Codex-like tasks against the refreshed context capsule."
  });
  await writeContextCapsule(projectRoot, capsule);

  const graph = createMindmapGraph(context.model);
  await writeMindmapGraph(projectRoot, graph);

  const refreshedFiles = [
    `.mental/${mentalFiles.capsule}`,
    `.mental/${mentalFiles.graph}`,
    `.mental/${mentalFiles.questions}`,
    `.mental/${mentalFiles.directions}`
  ];
  const copiedTargets = await copyWebPublicFilesIfPresent(projectRoot);
  const syncState: SyncState = {
    version: 1,
    synced_at: timestamp,
    project_root: projectRoot,
    refreshed_files: refreshedFiles,
    copied_targets: copiedTargets
  };
  await writeJsonFile(projectRoot, mentalFiles.syncState, syncState);

  return {
    projectRoot,
    refreshedFiles,
    copiedTargets
  };
}

async function copyWebPublicFilesIfPresent(projectRoot: string): Promise<string[]> {
  const webRoot = path.join(projectRoot, "apps", "web");
  if (!(await pathExists(webRoot))) {
    return [];
  }
  const publicDir = path.join(webRoot, "public");
  await mkdir(publicDir, { recursive: true });
  const files = [mentalFiles.graph, mentalFiles.questions, mentalFiles.directions];
  const targets = files.map((file) => path.join(publicDir, file));
  await Promise.all(files.map((file, index) => copyFile(mentalPath(projectRoot, file), targets[index])));
  return targets;
}

function upsertProjectAnalysisModel(
  model: MentalModel,
  input: {
    questionId: string;
    timestamp: string;
    analysisSummary: string;
    projectName: string;
  }
): MentalModel {
  const node: MentalModelNode = {
    id: "node_project_workspace_analysis",
    label: "Project Workspace Analysis",
    type: "workspace_evidence",
    summary: input.analysisSummary,
    status: "active",
    confidence: 0.82,
    source_question_ids: [input.questionId],
    created_at: input.timestamp,
    updated_at: input.timestamp
  };
  const edge: MentalModelEdge = {
    id: "edge_workspace_analysis_to_context_capsule",
    from: "node_project_workspace_analysis",
    to: "node_context_capsule",
    type: "feeds",
    summary: "Project analysis is compacted into context before wrapped Codex work continues.",
    source_question_ids: [input.questionId],
    confidence: 0.8
  };

  const nodes = upsertNode(model.nodes, node, input.questionId, input.timestamp);
  const edges = upsertEdge(model.edges, edge, input.questionId);
  const activeDecisions = appendUnique(
    model.active_decisions,
    "Terminal open flow analyzes the current workspace before normal wrapped Codex questions."
  );
  const openQuestions = appendUnique(
    model.open_questions,
    "How much project analysis should run automatically before asking the user for more project intent?"
  );

  return {
    ...model,
    updated_at: input.timestamp,
    nodes: nodes.map((candidate) => {
      if (candidate.id === "node_codex_wrapper" || candidate.id === "node_context_capsule") {
        return {
          ...candidate,
          source_question_ids: appendUnique(candidate.source_question_ids, input.questionId),
          updated_at: input.timestamp
        };
      }
      return candidate;
    }),
    edges,
    active_decisions: activeDecisions,
    open_questions: openQuestions,
    risks: appendUnique(
      model.risks,
      "Project analysis can become noisy if generated evidence is treated as a user direction without consent."
    )
  };
}

function upsertNode(
  nodes: MentalModelNode[],
  node: MentalModelNode,
  questionId: string,
  timestamp: string
): MentalModelNode[] {
  const existing = nodes.find((candidate) => candidate.id === node.id);
  if (!existing) {
    return [...nodes, node];
  }
  return nodes.map((candidate) =>
    candidate.id === node.id
      ? {
          ...candidate,
          summary: node.summary,
          source_question_ids: appendUnique(candidate.source_question_ids, questionId),
          updated_at: timestamp
        }
      : candidate
  );
}

function upsertEdge(edges: MentalModelEdge[], edge: MentalModelEdge, questionId: string): MentalModelEdge[] {
  const existing = edges.find((candidate) => candidate.id === edge.id);
  if (!existing) {
    return [...edges, edge];
  }
  return edges.map((candidate) =>
    candidate.id === edge.id
      ? {
          ...candidate,
          summary: edge.summary,
          source_question_ids: appendUnique(candidate.source_question_ids, questionId)
        }
      : candidate
  );
}

function appendUnique(values: string[], value: string): string[] {
  return values.includes(value) ? values : [...values, value];
}

