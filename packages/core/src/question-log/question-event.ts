import type { QuestionEvent } from "../schemas/types.js";
import { nowTimestamp } from "../time.js";
import {
  appendJsonlFile,
  mentalFiles,
  nextStableId,
  readQuestionLog
} from "../storage/mental-store.js";

export interface AppendQuestionEventInput {
  projectRoot: string;
  text: string;
  source?: QuestionEvent["source"];
  relatedFiles?: string[];
  tags?: string[];
  timestamp?: string;
}

export async function appendQuestionEvent(input: AppendQuestionEventInput): Promise<QuestionEvent> {
  const existing = await readQuestionLog(input.projectRoot);
  const event: QuestionEvent = {
    id: nextStableId(existing, "q"),
    timestamp: input.timestamp ?? nowTimestamp(),
    text: input.text,
    source: input.source ?? "user",
    related_files: input.relatedFiles ?? [],
    tags: input.tags ?? []
  };

  await appendJsonlFile(input.projectRoot, mentalFiles.questions, event);
  return event;
}

