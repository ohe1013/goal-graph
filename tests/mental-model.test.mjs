import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  analyzeImpact,
  initializeProjectMentalModel,
  mentalFiles,
  mentalPath,
  readDirectionHistory,
  readMentalContext,
  readQuestionLog
} from "../packages/core/dist/index.js";
import { askThroughWrapper } from "../packages/codex-wrapper/dist/ask.js";

test("initializes required .mental files with source-question traceability", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "goal-graph-init-"));
  try {
    const context = await initializeProjectMentalModel({
      projectRoot,
      initialQuestionText: "프로젝트 생성하자",
      timestamp: "2026-05-20T16:04:39+09:00"
    });

    assert.equal(context.model.version, 1);
    assert.equal(context.questions[0].id, "q_001");
    assert.ok(context.model.nodes.every((node) => node.source_question_ids.includes("q_001")));

    const capsule = await readFile(mentalPath(projectRoot, mentalFiles.capsule), "utf8");
    assert.match(capsule, /Goal Anchor/);
    assert.match(capsule, /q_001/);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("classifies project creation as direction_update", () => {
  const analysis = analyzeImpact({
    question: {
      id: "q_001",
      timestamp: "2026-05-20T16:04:39+09:00",
      text: "프로젝트 생성하자",
      source: "user",
      related_files: [],
      tags: []
    }
  });

  assert.equal(analysis.impact_type, "direction_update");
  assert.ok(analysis.affected_nodes.includes("node_goal_anchor"));
  assert.ok(analysis.affected_nodes.includes("node_codex_wrapper"));
});

test("wrapper logs a question, appends a delta, and refreshes capsule", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "goal-graph-ask-"));
  try {
    await initializeProjectMentalModel({
      projectRoot,
      initialQuestionText: "프로젝트 생성하자",
      timestamp: "2026-05-20T16:04:39+09:00"
    });

    const result = await askThroughWrapper({
      projectRoot,
      text: "마인드맵에서 최근 delta와 source question을 보이게 하자",
      timestamp: "2026-05-20T16:05:00+09:00"
    });

    assert.equal(result.question_id, "q_002");
    assert.equal(result.impact_type, "structural_refinement");

    const questions = await readQuestionLog(projectRoot);
    const directions = await readDirectionHistory(projectRoot);
    const context = await readMentalContext(projectRoot);

    assert.equal(questions.length, 2);
    assert.equal(directions.at(-1).question_id, "q_002");
    assert.match(context.goalMarkdown, /Goal Anchor/);

    const capsule = await readFile(mentalPath(projectRoot, mentalFiles.capsule), "utf8");
    assert.match(capsule, /q_002/);
    assert.match(capsule, /마인드맵/);

    const graph = JSON.parse(await readFile(mentalPath(projectRoot, mentalFiles.graph), "utf8"));
    const visualizationNode = graph.nodes.find((node) => node.id === "node_mindmap_visualization");
    assert.ok(visualizationNode.source_question_ids.includes("q_002"));
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

