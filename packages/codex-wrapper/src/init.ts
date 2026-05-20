#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeProjectMentalModel } from "@goal-graph/core";
import { findProjectRoot } from "./project-root.js";

async function main(): Promise<void> {
  const projectRoot = await findProjectRoot();
  await initializeProjectMentalModel({
    projectRoot,
    initialQuestionText: "프로젝트 생성하자"
  });
  console.log(`Initialized mental model at ${path.join(projectRoot, ".mental")}`);
}

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

