#!/usr/bin/env node
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  analyzeImpact,
  appendDirectionDelta,
  appendQuestionEvent,
  applyImpactAnalysis,
  createDirectionDelta,
  generateContextCapsule,
  initializeProjectMentalModel,
  mentalFiles,
  mentalPath,
  nextStableId,
  pathExists,
  readDirectionHistory,
  readMentalContext,
  readMentalModel,
  readQuestionLog,
  writeContextCapsule,
  writeMentalModel,
  writeMindmapGraph
} from "@goal-graph/core";
import { createMindmapGraph } from "@goal-graph/visualization";
import { prepareCodexTask } from "./codex-runner.js";
import { findProjectRoot } from "./project-root.js";
import { buildCodexPrompt } from "./prompt-builder.js";

export interface AskThroughWrapperInput {
  text: string;
  projectRoot?: string;
  timestamp?: string;
}

export interface AskThroughWrapperResult {
  question_id: string;
  impact_type: string;
  affected_nodes: string[];
  prompt: string;
}

export async function askThroughWrapper(input: AskThroughWrapperInput): Promise<AskThroughWrapperResult> {
  const projectRoot = input.projectRoot ?? (await findProjectRoot());

  if (!(await pathExists(mentalPath(projectRoot, mentalFiles.model)))) {
    await initializeProjectMentalModel({
      projectRoot,
      initialQuestionText: "Initialize project mental model",
      timestamp: input.timestamp
    });
  }

  const modelBefore = await readMentalModel(projectRoot);
  const question = await appendQuestionEvent({
    projectRoot,
    text: input.text,
    timestamp: input.timestamp
  });
  const analysis = analyzeImpact({ question, mentalModel: modelBefore });
  const timestamp = question.timestamp;
  const updatedModel = applyImpactAnalysis(modelBefore, analysis, timestamp);
  await writeMentalModel(projectRoot, updatedModel);

  let directions = await readDirectionHistory(projectRoot);
  if (analysis.impact_type !== "tactical") {
    const delta = createDirectionDelta({
      id: nextStableId(directions, "delta"),
      timestamp,
      analysis,
      before: modelBefore.central_thesis,
      after: updatedModel.central_thesis
    });
    await appendDirectionDelta(projectRoot, delta);
    directions = [...directions, delta];
  }

  const questions = await readQuestionLog(projectRoot);
  const capsule = generateContextCapsule({
    goalMarkdown: (await readMentalContext(projectRoot)).goalMarkdown,
    model: updatedModel,
    questions,
    directions,
    relevantNodeIds: analysis.affected_nodes,
    taskGuidance:
      "Before modifying code, classify the task impact. Keep implementation aligned with the Goal Anchor unless the user explicitly requests a pivot. Preserve source-question traceability."
  });
  await writeContextCapsule(projectRoot, capsule);

  const graph = createMindmapGraph(updatedModel);
  await writeMindmapGraph(projectRoot, graph);
  await syncWebGraphIfPresent(projectRoot);

  const relevantNodes = updatedModel.nodes.filter((node) => analysis.affected_nodes.includes(node.id));
  const prepared = prepareCodexTask(
    buildCodexPrompt({
      task: input.text,
      contextCapsule: capsule,
      impactAnalysis: analysis,
      relevantNodes
    })
  );

  return {
    question_id: question.id,
    impact_type: analysis.impact_type,
    affected_nodes: analysis.affected_nodes,
    prompt: prepared.prompt
  };
}

async function syncWebGraphIfPresent(projectRoot: string): Promise<void> {
  const webRoot = path.join(projectRoot, "apps", "web");
  if (!(await pathExists(webRoot))) {
    return;
  }
  const publicDir = path.join(webRoot, "public");
  await mkdir(publicDir, { recursive: true });
  const files = [mentalFiles.graph, mentalFiles.questions, mentalFiles.directions];
  await Promise.all(
    files.map((file) => copyFile(mentalPath(projectRoot, file), path.join(publicDir, file)))
  );
}

async function main(): Promise<void> {
  const text = process.argv.slice(2).join(" ").trim();
  if (!text) {
    console.error('Usage: mental ask "project question"');
    process.exitCode = 1;
    return;
  }

  const result = await askThroughWrapper({ text });
  console.log(
    JSON.stringify(
      {
        question_id: result.question_id,
        impact_type: result.impact_type,
        affected_nodes: result.affected_nodes
      },
      null,
      2
    )
  );
  console.log("\n--- Codex Prompt ---\n");
  console.log(result.prompt);
}

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
