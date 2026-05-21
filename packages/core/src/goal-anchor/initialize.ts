import type { MindmapGraph } from "../schemas/types.js";
import { nowTimestamp } from "../time.js";
import {
  mentalFiles,
  readMentalContext,
  writeJsonFileIfMissing,
  writeTextFileIfMissing
} from "../storage/mental-store.js";

export interface InitializeProjectMentalModelInput {
  projectRoot: string;
  initialQuestionText?: string;
  timestamp?: string;
}

export async function initializeProjectMentalModel(input: InitializeProjectMentalModelInput) {
  const timestamp = input.timestamp ?? nowTimestamp();
  const questionText = input.initialQuestionText ?? "프로젝트 생성하자";
  const questionId = "q_001";

  await writeTextFileIfMissing(input.projectRoot, mentalFiles.goal, goalMarkdown());
  await writeTextFileIfMissing(input.projectRoot, mentalFiles.baseline, baselineMarkdown());
  await writeJsonFileIfMissing(input.projectRoot, mentalFiles.model, initialMentalModel(timestamp, questionId));
  await writeTextFileIfMissing(
    input.projectRoot,
    mentalFiles.questions,
    `${JSON.stringify({
      id: questionId,
      timestamp,
      text: questionText,
      source: "user",
      related_files: [],
      tags: ["initialization", "project_creation"]
    })}\n`
  );
  await writeTextFileIfMissing(
    input.projectRoot,
    mentalFiles.decisions,
    `${JSON.stringify({
      id: "decision_001",
      timestamp,
      question_id: questionId,
      summary: "Initialize with local file-based mental model storage before database-backed or full orchestration features.",
      status: "accepted",
      related_files: [".mental/goal.md", ".mental/current-mental-model.json"]
    })}\n`
  );
  await writeTextFileIfMissing(
    input.projectRoot,
    mentalFiles.directions,
    `${JSON.stringify({
      id: "delta_001",
      timestamp,
      question_id: questionId,
      impact_type: "direction_update",
      affected_nodes: ["node_goal_anchor", "node_baseline_structure", "node_codex_wrapper"],
      summary: "The project is initialized as a goal-anchored Codex mental model wrapper.",
      before: "Conceptual project thesis.",
      after: "File-based project structure with source-question traceability."
    })}\n`
  );
  await writeTextFileIfMissing(input.projectRoot, mentalFiles.capsule, contextCapsuleMarkdown());
  await writeJsonFileIfMissing(input.projectRoot, mentalFiles.graph, initialMindmapGraph());
  await writeJsonFileIfMissing(input.projectRoot, mentalFiles.questionMode, {
    version: 1,
    default_directive: "auto",
    updated_at: timestamp,
    source_question_id: questionId
  });

  return readMentalContext(input.projectRoot);
}

function goalMarkdown(): string {
  return `# Goal Anchor

## Original Goal

Codex 안에서 이루어지는 프로젝트 질문들을 추적하여, 사용자가 초기 목표와 구조를 잊지 않도록 하고, 진행 중 질문들이 방향성에 미치는 영향을 시각적으로 보여주는 시스템을 만든다.

## Why This Exists

사용자는 프로젝트를 진행하면서 작은 질문을 계속 던지고, 그 질문들이 누적되면 처음 목표와 현재 구조가 달라질 수 있다.

## Non-Goals

- 단순 Q&A 히스토리 뷰어가 아니다.
- 일반 RAG 지식베이스가 아니다.
- 정적 LLM 위키가 아니다.
- 출처 질문 없는 장식용 마인드맵이 아니다.

## First Principles

- Goal Anchor는 안정적인 기준점으로 유지한다.
- Baseline Structure와 Current Mental Model은 구분한다.
- 의미 있는 노드는 source question id를 가져야 한다.
- 작은 변화는 delta로 기록한다.
`;
}

function baselineMarkdown(): string {
  return `# Baseline Structure

## Initial Summary

이 프로젝트는 Codex의 답변을 저장하는 도구가 아니라, Codex와 대화하며 프로젝트를 진행하는 동안 사용자의 질문들이 초기 목표와 현재 구조에 어떤 영향을 주는지 추적하고, 그 변화된 멘탈모델을 다시 Codex의 작업 맥락에 주입하는 방향성 유지 레이어다.

## Initial Components

- Goal Anchor
- Baseline Structure
- Codex Wrapper
- Question Log
- Impact Analyzer
- Mental Model Delta
- Context Capsule
- Mindmap Visualization
- LLM Wiki Contrast
- Open Decisions

## Initial Workflow

user question -> log question event -> analyze impact -> update model -> refresh context capsule -> refresh mindmap graph

## Initial Open Questions

1. Wrapper interface: CLI, IDE extension, desktop app, or web app?
2. Initial storage: local files only, SQLite, PostgreSQL, or graph DB?
3. Mindmap renderer: React Flow, Cytoscape.js, Mermaid, or custom canvas?
4. Codex integration depth: context injection only, CLI execution, MCP integration, or full orchestration?
5. How often should the model be compacted or re-summarized?
`;
}

function initialMentalModel(timestamp: string, questionId: string) {
  const nodes = [
    ["node_current_thesis", "Central Thesis", "central_thesis"],
    ["node_goal_anchor", "Goal Anchor", "goal_anchor"],
    ["node_baseline_structure", "Baseline Structure", "baseline_structure"],
    ["node_codex_wrapper", "Codex Wrapper", "system_component"],
    ["node_question_log", "Question Log", "system_component"],
    ["node_impact_analyzer", "Impact Analyzer", "system_component"],
    ["node_mental_model_delta", "Mental Model Delta", "system_component"],
    ["node_context_capsule", "Context Capsule", "system_component"],
    ["node_mindmap_visualization", "Mindmap Visualization", "system_component"],
    ["node_llm_wiki_contrast", "LLM Wiki Contrast", "boundary"],
    ["node_open_decisions", "Open Decisions", "decision_area"]
  ].map(([id, label, type]) => ({
    id,
    label,
    type,
    summary: `${label} is part of the initial goal-anchored Codex wrapper structure.`,
    status: "active",
    confidence: 0.8,
    source_question_ids: [questionId],
    created_at: timestamp,
    updated_at: timestamp
  }));

  return {
    version: 1,
    central_thesis:
      "Codex 작업 중 발생하는 프로젝트 질문을 Goal Anchor와 Baseline Structure에 비추어 분석하고, 변화된 멘탈모델을 다시 Codex 맥락에 주입하는 방향성 유지 레이어.",
    goal_anchor_id: "goal_001",
    updated_at: timestamp,
    nodes,
    edges: [
      {
        id: "edge_current_to_goal",
        from: "node_current_thesis",
        to: "node_goal_anchor",
        type: "anchors",
        summary: "The current thesis must stay comparable to the original Goal Anchor.",
        source_question_ids: [questionId],
        confidence: 0.9
      }
    ],
    open_questions: [
      "Wrapper interface: CLI, IDE extension, desktop app, or web app?",
      "Initial storage: local files only, SQLite, PostgreSQL, or graph DB?",
      "Mindmap renderer: React Flow, Cytoscape.js, Mermaid, or custom canvas?",
      "Codex integration depth: context injection only, CLI execution, MCP integration, or full orchestration?",
      "How often should the model be compacted or re-summarized?"
    ],
    active_decisions: ["Use local file storage for the MVP before introducing a database."],
    risks: ["The wrapper may degrade into a generic history viewer if impact analysis is weak."]
  };
}

function contextCapsuleMarkdown(): string {
  return `# Project Mental Model Context

## Original Goal

Codex 안에서 이루어지는 프로젝트 질문들을 추적하여, 사용자가 초기 목표와 구조를 잊지 않도록 하고, 진행 중 질문들이 방향성에 미치는 영향을 시각적으로 보여주는 시스템을 만든다.

## Current Thesis

Codex 작업 중 발생하는 프로젝트 질문을 Goal Anchor와 Baseline Structure에 비추어 분석하고, 변화된 멘탈모델을 다시 Codex 맥락에 주입하는 방향성 유지 레이어.

## Current Structure

- Goal Anchor
- Baseline Structure
- Question Log
- Impact Analyzer
- Mental Model Delta
- Context Capsule
- Mindmap Visualization

## Recent Direction Changes

- Initial project creation.

## Relevant Source Questions

- q_001: 프로젝트 생성하자

## Task Guidance

Before modifying code, classify the task impact. Keep implementation aligned with the Goal Anchor unless the user explicitly requests a pivot.
`;
}

function initialMindmapGraph(): MindmapGraph {
  return {
    central_node_id: "node_current_thesis",
    nodes: [
      {
        id: "node_current_thesis",
        label: "Central Thesis",
        type: "central_thesis",
        summary: "Goal-anchored Codex mental model wrapper.",
        status: "active",
        source_question_ids: ["q_001"]
      },
      {
        id: "node_goal_anchor",
        label: "Goal Anchor",
        type: "goal_anchor",
        summary: "Stable original objective.",
        status: "active",
        source_question_ids: ["q_001"]
      }
    ],
    edges: [
      {
        id: "edge_current_to_goal",
        from: "node_current_thesis",
        to: "node_goal_anchor",
        type: "anchors",
        summary: "The current thesis is anchored to the original goal.",
        source_question_ids: ["q_001"]
      }
    ],
    layout: {
      type: "mindmap"
    }
  };
}
