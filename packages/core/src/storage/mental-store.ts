import { appendFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  DirectionDelta,
  MentalContext,
  MentalModel,
  MindmapGraph,
  QuestionEvent
} from "../schemas/types.js";
import { assertMentalModel, parseJsonl } from "./validation.js";

export const mentalFiles = {
  goal: "goal.md",
  baseline: "baseline-structure.md",
  model: "current-mental-model.json",
  questions: "question-log.jsonl",
  decisions: "decision-log.jsonl",
  directions: "direction-history.jsonl",
  capsule: "context-capsule.md",
  graph: "mindmap.graph.json"
} as const;

export function mentalDirectory(projectRoot: string): string {
  return path.join(projectRoot, ".mental");
}

export function mentalPath(projectRoot: string, fileName: string): string {
  return path.join(mentalDirectory(projectRoot), fileName);
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

export async function ensureMentalDirectory(projectRoot: string): Promise<void> {
  await mkdir(mentalDirectory(projectRoot), { recursive: true });
}

export async function readTextFile(projectRoot: string, fileName: string): Promise<string> {
  return readFile(mentalPath(projectRoot, fileName), "utf8");
}

export async function writeTextFile(projectRoot: string, fileName: string, content: string): Promise<void> {
  await ensureMentalDirectory(projectRoot);
  await writeFile(mentalPath(projectRoot, fileName), content, "utf8");
}

export async function writeTextFileIfMissing(
  projectRoot: string,
  fileName: string,
  content: string
): Promise<boolean> {
  const filePath = mentalPath(projectRoot, fileName);
  if (await pathExists(filePath)) {
    return false;
  }
  await writeTextFile(projectRoot, fileName, content);
  return true;
}

export async function readJsonFile<T>(projectRoot: string, fileName: string): Promise<T> {
  const content = await readTextFile(projectRoot, fileName);
  return JSON.parse(content) as T;
}

export async function writeJsonFile(projectRoot: string, fileName: string, value: unknown): Promise<void> {
  await writeTextFile(projectRoot, fileName, `${JSON.stringify(value, null, 2)}\n`);
}

export async function writeJsonFileIfMissing(
  projectRoot: string,
  fileName: string,
  value: unknown
): Promise<boolean> {
  const filePath = mentalPath(projectRoot, fileName);
  if (await pathExists(filePath)) {
    return false;
  }
  await writeJsonFile(projectRoot, fileName, value);
  return true;
}

export async function readJsonlFile<T>(projectRoot: string, fileName: string): Promise<T[]> {
  const filePath = mentalPath(projectRoot, fileName);
  if (!(await pathExists(filePath))) {
    return [];
  }
  const content = await readFile(filePath, "utf8");
  return parseJsonl<T>(content, fileName);
}

export async function appendJsonlFile(projectRoot: string, fileName: string, value: unknown): Promise<void> {
  await ensureMentalDirectory(projectRoot);
  await appendFile(mentalPath(projectRoot, fileName), `${JSON.stringify(value)}\n`, "utf8");
}

export function nextStableId(records: Array<{ id: string }>, prefix: string): string {
  const pattern = new RegExp(`^${prefix}_(\\d+)$`);
  const max = records.reduce((highest, record) => {
    const match = pattern.exec(record.id);
    if (!match) {
      return highest;
    }
    return Math.max(highest, Number(match[1]));
  }, 0);
  return `${prefix}_${String(max + 1).padStart(3, "0")}`;
}

export async function readMentalModel(projectRoot: string): Promise<MentalModel> {
  const model = await readJsonFile<MentalModel>(projectRoot, mentalFiles.model);
  assertMentalModel(model);
  return model;
}

export async function writeMentalModel(projectRoot: string, model: MentalModel): Promise<void> {
  assertMentalModel(model);
  await writeJsonFile(projectRoot, mentalFiles.model, model);
}

export async function readQuestionLog(projectRoot: string): Promise<QuestionEvent[]> {
  return readJsonlFile<QuestionEvent>(projectRoot, mentalFiles.questions);
}

export async function readDirectionHistory(projectRoot: string): Promise<DirectionDelta[]> {
  return readJsonlFile<DirectionDelta>(projectRoot, mentalFiles.directions);
}

export async function appendDirectionDelta(projectRoot: string, delta: DirectionDelta): Promise<void> {
  await appendJsonlFile(projectRoot, mentalFiles.directions, delta);
}

export async function writeContextCapsule(projectRoot: string, content: string): Promise<void> {
  await writeTextFile(projectRoot, mentalFiles.capsule, content);
}

export async function writeMindmapGraph(projectRoot: string, graph: MindmapGraph): Promise<void> {
  await writeJsonFile(projectRoot, mentalFiles.graph, graph);
}

export async function readMentalContext(projectRoot: string): Promise<MentalContext> {
  return {
    goalMarkdown: await readTextFile(projectRoot, mentalFiles.goal),
    baselineMarkdown: await readTextFile(projectRoot, mentalFiles.baseline),
    model: await readMentalModel(projectRoot),
    questions: await readQuestionLog(projectRoot),
    directions: await readDirectionHistory(projectRoot)
  };
}

