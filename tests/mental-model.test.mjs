import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  analyzeImpact,
  initializeProjectMentalModel,
  mentalFiles,
  mentalPath,
  parseQuestionDirective,
  readDirectionHistory,
  readMentalContext,
  readQuestionLog
} from "../packages/core/dist/index.js";
import { askThroughWrapper, setQuestionMode } from "../packages/codex-wrapper/dist/ask.js";
import { buildCodexCliArgs } from "../packages/codex-wrapper/dist/codex-runner.js";
import { openWorkspace, syncWorkspace } from "../packages/codex-wrapper/dist/workspace.js";

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

test("parses inline question direction directives", () => {
  assert.deepEqual(parseQuestionDirective("#none 포트만 바꿔", "auto"), {
    rawText: "#none 포트만 바꿔",
    normalizedText: "포트만 바꿔",
    directive: "none",
    directiveSource: "inline"
  });

  assert.deepEqual(parseQuestionDirective("일반 질문", "strong"), {
    rawText: "일반 질문",
    normalizedText: "일반 질문",
    directive: "strong",
    directiveSource: "default"
  });
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

test("#none logs the question without appending a direction delta", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "goal-graph-none-"));
  try {
    await initializeProjectMentalModel({
      projectRoot,
      initialQuestionText: "프로젝트 생성하자",
      timestamp: "2026-05-20T16:04:39+09:00"
    });

    const before = await readDirectionHistory(projectRoot);
    const result = await askThroughWrapper({
      projectRoot,
      text: "#none 버튼 색상만 바꿔",
      timestamp: "2026-05-20T16:10:00+09:00"
    });
    const after = await readDirectionHistory(projectRoot);
    const questions = await readQuestionLog(projectRoot);

    assert.equal(result.directive, "none");
    assert.equal(result.impact_type, "tactical");
    assert.equal(after.length, before.length);
    assert.equal(questions.at(-1).text, "#none 버튼 색상만 바꿔");
    assert.equal(questions.at(-1).normalized_text, "버튼 색상만 바꿔");
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("#strong forces a direction delta and default mode can be configured", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "goal-graph-strong-"));
  try {
    await initializeProjectMentalModel({
      projectRoot,
      initialQuestionText: "프로젝트 생성하자",
      timestamp: "2026-05-20T16:04:39+09:00"
    });

    await setQuestionMode({ projectRoot, directive: "none" });
    const tactical = await askThroughWrapper({
      projectRoot,
      text: "이건 기본 모드 때문에 방향성 없음",
      timestamp: "2026-05-20T16:11:00+09:00"
    });
    assert.equal(tactical.directive, "none");
    assert.equal(tactical.directive_source, "default");
    assert.equal(tactical.impact_type, "tactical");

    const strong = await askThroughWrapper({
      projectRoot,
      text: "#strong 이제 질문 종류 prefix를 제품 계약으로 둔다",
      timestamp: "2026-05-20T16:12:00+09:00"
    });
    assert.equal(strong.directive, "strong");
    assert.equal(strong.directive_source, "inline");
    assert.equal(strong.impact_type, "direction_update");

    const directions = await readDirectionHistory(projectRoot);
    assert.equal(directions.at(-1).question_id, strong.question_id);
    assert.equal(directions.at(-1).impact_type, "direction_update");
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("open workspace requires consent, analyzes project, and writes sync state", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "goal-graph-open-"));
  try {
    await mkdir(path.join(projectRoot, "src"), { recursive: true });
    await writeFile(
      path.join(projectRoot, "package.json"),
      JSON.stringify(
        {
          name: "sample-project",
          type: "module",
          scripts: {
            build: "tsc",
            dev: "vite"
          },
          dependencies: {
            react: "^19.0.0"
          },
          devDependencies: {
            vite: "^6.0.0",
            typescript: "^5.0.0"
          }
        },
        null,
        2
      )
    );
    await writeFile(path.join(projectRoot, "README.md"), "# Sample Project\n");
    await writeFile(path.join(projectRoot, "src", "index.ts"), "export const value = 1;\n");

    const denied = await openWorkspace({ projectRoot, consent: false });
    assert.equal(denied.status, "needs_consent");

    const opened = await openWorkspace({
      projectRoot,
      consent: true,
      timestamp: "2026-05-21T15:00:00+09:00"
    });
    assert.equal(opened.status, "opened");
    assert.equal(opened.initialized, true);
    assert.match(opened.analysisSummary, /sample-project/);

    const analysis = JSON.parse(await readFile(path.join(projectRoot, ".mental", "project-analysis.json"), "utf8"));
    assert.equal(analysis.project_name, "sample-project");
    assert.ok(analysis.inferred_stack.includes("TypeScript"));
    assert.ok(analysis.inferred_stack.includes("React"));

    const model = JSON.parse(await readFile(path.join(projectRoot, ".mental", "current-mental-model.json"), "utf8"));
    assert.ok(model.nodes.some((node) => node.id === "node_project_workspace_analysis"));

    const sync = await syncWorkspace({
      projectRoot,
      timestamp: "2026-05-21T15:01:00+09:00"
    });
    assert.ok(sync.refreshedFiles.includes(".mental/mindmap.graph.json"));

    const syncState = JSON.parse(await readFile(path.join(projectRoot, ".mental", "sync-state.json"), "utf8"));
    assert.equal(syncState.project_root, projectRoot);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("builds Codex CLI args for interactive and exec modes", () => {
  assert.deepEqual(buildCodexCliArgs({ mode: "interactive", projectRoot: "C:\\repo", prompt: "hello" }), [
    "--cd",
    "C:\\repo",
    "hello"
  ]);
  assert.deepEqual(buildCodexCliArgs({ mode: "exec", projectRoot: "C:\\repo", prompt: "hello" }), [
    "exec",
    "--cd",
    "C:\\repo",
    "hello"
  ]);
});
