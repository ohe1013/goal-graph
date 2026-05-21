#!/usr/bin/env node
import { copyFile, mkdir } from "node:fs/promises";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
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
  nowTimestamp,
  pathExists,
  parseQuestionDirective,
  questionDirectives,
  readDirectionHistory,
  readMentalContext,
  readMentalModel,
  readQuestionLog,
  readQuestionMode,
  type QuestionDirective,
  writeContextCapsule,
  writeMentalModel,
  writeMindmapGraph,
  writeQuestionMode
} from "@goal-graph/core";
import { createMindmapGraph } from "@goal-graph/visualization";
import { prepareCodexTask, runCodexCli } from "./codex-runner.js";
import { findProjectRoot } from "./project-root.js";
import { buildCodexPrompt } from "./prompt-builder.js";
import { openWorkspace, syncWorkspace } from "./workspace.js";

export interface AskThroughWrapperInput {
  text: string;
  projectRoot?: string;
  timestamp?: string;
}

export interface AskThroughWrapperResult {
  question_id: string;
  impact_type: string;
  directive: string;
  directive_source: string;
  affected_nodes: string[];
  prompt: string;
}

export interface SetQuestionModeInput {
  projectRoot?: string;
  directive: QuestionDirective;
  sourceQuestionId?: string;
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
  const questionMode = await readQuestionMode(projectRoot);
  const parsedQuestion = parseQuestionDirective(input.text, questionMode.default_directive);
  const question = await appendQuestionEvent({
    projectRoot,
    text: input.text,
    normalizedText: parsedQuestion.normalizedText,
    directive: parsedQuestion.directive,
    directiveSource: parsedQuestion.directiveSource,
    tags: [`directive:${parsedQuestion.directive}`],
    timestamp: input.timestamp
  });
  const analysis = analyzeImpact({ question, mentalModel: modelBefore, defaultDirective: questionMode.default_directive });
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
      task: parsedQuestion.normalizedText || input.text,
      contextCapsule: capsule,
      impactAnalysis: analysis,
      relevantNodes
    })
  );

  return {
    question_id: question.id,
    impact_type: analysis.impact_type,
    directive: analysis.directive ?? parsedQuestion.directive,
    directive_source: analysis.directive_source ?? parsedQuestion.directiveSource,
    affected_nodes: analysis.affected_nodes,
    prompt: prepared.prompt
  };
}

export async function setQuestionMode(input: SetQuestionModeInput) {
  const projectRoot = input.projectRoot ?? (await findProjectRoot());
  if (!questionDirectives.includes(input.directive)) {
    throw new Error(`Unknown question mode: ${input.directive}`);
  }

  const config = {
    version: 1 as const,
    default_directive: input.directive,
    updated_at: nowTimestamp(),
    source_question_id: input.sourceQuestionId
  };
  await writeQuestionMode(projectRoot, config);
  return config;
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
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "session") {
    const sessionArgs = command === "session" ? args.slice(1) : args;
    await handleSessionCommand(sessionArgs);
    return;
  }

  if (command === "open") {
    const openArgs = command === "open" ? args.slice(1) : args;
    await handleOpenCommand(openArgs);
    return;
  }

  if (command === "sync") {
    const targetPath = resolveCliPath(firstPathArgument(args.slice(1)) ?? ".");
    const result = await syncWorkspace({ projectRoot: targetPath });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "run") {
    await handleRunCommand(args.slice(1));
    return;
  }

  if (command === "mode") {
    const directive = args[1] as QuestionDirective | undefined;
    const projectRoot = await findProjectRoot();
    if (!directive) {
      const current = await readQuestionMode(projectRoot);
      console.log(JSON.stringify(current, null, 2));
      return;
    }
    if (!questionDirectives.includes(directive)) {
      console.error(`Usage: mental mode <${questionDirectives.join("|")}>`);
      process.exitCode = 1;
      return;
    }
    const config = await setQuestionMode({ projectRoot, directive });
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  const text = (command === "ask" ? args.slice(1) : args).join(" ").trim();
  if (!text) {
    console.error("Usage: goal-graph");
    console.error("       goal-graph open . --yes");
    console.error('       goal-graph ask "#none project question"');
    console.error("       goal-graph sync");
    console.error(`       mental mode <${questionDirectives.join("|")}>`);
    process.exitCode = 1;
    return;
  }

  const result = await askThroughWrapper({ text });
  console.log(
    JSON.stringify(
      {
        question_id: result.question_id,
        impact_type: result.impact_type,
        directive: result.directive,
        directive_source: result.directive_source,
        affected_nodes: result.affected_nodes
      },
      null,
      2
    )
  );
  console.log("\n--- Codex Prompt ---\n");
  console.log(result.prompt);
}

async function handleSessionCommand(args: string[]): Promise<void> {
  const projectRoot = resolveCliPath(firstPathArgument(args) ?? ".");
  const consentFlag = args.includes("--yes") || args.includes("-y");
  let result = await openWorkspace({ projectRoot, consent: consentFlag });

  if (result.status === "needs_consent") {
    const agreed = await askForConsent(projectRoot);
    if (!agreed) {
      console.log("Canceled. No .mental files were initialized.");
      return;
    }
    result = await openWorkspace({ projectRoot, consent: true });
  }

  console.log(`Opened ${result.projectRoot}`);
  if (result.analysisSummary) {
    console.log(`Analysis: ${result.analysisSummary}`);
  }
  console.log("Type a question, .sync, .mode <directive>, .help, or .exit.");

  const readline = createInterface({ input, output });
  try {
    while (true) {
      const line = (await readline.question("goal-graph> ")).trim();
      if (!line) {
        continue;
      }
      if (line === ".exit" || line === "exit" || line === "quit") {
        break;
      }
      if (line === ".help") {
        console.log("Commands: .sync, .mode <auto|none|weak|strong|boundary|conflict|drift|evidence>, .exit");
        console.log('Questions can use directives, for example: #none fix a local bug');
        continue;
      }
      if (line === ".sync") {
        const syncResult = await syncWorkspace({ projectRoot: result.projectRoot });
        console.log(JSON.stringify(syncResult, null, 2));
        continue;
      }
      if (line.startsWith(".mode")) {
        const [, directive] = line.split(/\s+/);
        if (!questionDirectives.includes(directive as QuestionDirective)) {
          console.log(`Usage: .mode <${questionDirectives.join("|")}>`);
          continue;
        }
        const config = await setQuestionMode({ projectRoot: result.projectRoot, directive: directive as QuestionDirective });
        console.log(JSON.stringify(config, null, 2));
        continue;
      }
      if (line.startsWith(".run ")) {
        const runText = line.slice(".run ".length).trim();
        if (!runText) {
          console.log('Usage: .run "#none question"');
          continue;
        }
        const askResult = await askThroughWrapper({ projectRoot: result.projectRoot, text: runText });
        const runResult = await runCodexCli({
          mode: "interactive",
          projectRoot: result.projectRoot,
          prompt: askResult.prompt
        });
        console.log(JSON.stringify(runResult, null, 2));
        continue;
      }

      const askResult = await askThroughWrapper({ projectRoot: result.projectRoot, text: line });
      console.log(
        JSON.stringify(
          {
            question_id: askResult.question_id,
            impact_type: askResult.impact_type,
            directive: askResult.directive,
            directive_source: askResult.directive_source,
            affected_nodes: askResult.affected_nodes
          },
          null,
          2
        )
      );
      console.log("Codex prompt prepared in .mental/context-capsule.md");
    }
  } finally {
    readline.close();
  }
}

async function handleRunCommand(args: string[]): Promise<void> {
  const execMode = args.includes("--exec");
  const targetPath = resolveCliPath(".");
  const text = args.filter((arg) => arg !== "--exec").join(" ").trim();
  if (!text) {
    console.error('Usage: goal-graph run [--exec] "#none project question"');
    process.exitCode = 1;
    return;
  }
  const askResult = await askThroughWrapper({ projectRoot: targetPath, text });
  const runResult = await runCodexCli({
    mode: execMode ? "exec" : "interactive",
    projectRoot: targetPath,
    prompt: askResult.prompt
  });
  console.log(JSON.stringify(runResult, null, 2));
}

async function handleOpenCommand(args: string[]): Promise<void> {
  const projectRoot = resolveCliPath(firstPathArgument(args) ?? ".");
  const consentFlag = args.includes("--yes") || args.includes("-y");
  let result = await openWorkspace({ projectRoot, consent: consentFlag });

  if (result.status === "needs_consent") {
    const agreed = await askForConsent(projectRoot);
    if (!agreed) {
      console.log("Canceled. No .mental files were initialized.");
      return;
    }
    result = await openWorkspace({ projectRoot, consent: true });
  }

  console.log(JSON.stringify(result, null, 2));
}

async function askForConsent(projectRoot: string): Promise<boolean> {
  const readline = createInterface({ input, output });
  try {
    const answer = await readline.question(
      `No .mental store exists in ${projectRoot}. Analyze and initialize this project? [y/N] `
    );
    return answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes";
  } finally {
    readline.close();
  }
}

function firstPathArgument(args: string[]): string | undefined {
  return args.find((arg) => !arg.startsWith("-"));
}

function resolveCliPath(targetPath: string): string {
  const baseDirectory = process.env.INIT_CWD ? path.resolve(process.env.INIT_CWD) : process.cwd();
  return path.resolve(baseDirectory, targetPath);
}

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
