# AGENTS.md

## Project: Goal-Anchored Mental Model Wrapper for Codex

This repository builds a **Goal-Anchored Mental Model Wrapper for Codex**.

The product is not a generic chatbot, not a simple LLM wiki, and not merely an ontology generator. It is a project-direction memory layer that wraps Codex work so that every meaningful project question is compared against the original goal, the first baseline structure, and the current mental model.

The core purpose is:

> Preserve the original project goal while allowing the user's thinking to evolve. Track how ongoing small questions strengthen, refine, modify, conflict with, or redirect the project's structure. Visualize that evolving structure as a mindmap with source questions attached to each major node.

Answer the user in Korean by default unless they request another language. Use English for code, schemas, filenames, and commit-style labels when that improves precision.

---

## Non-Negotiable Product Thesis

Always treat this project as a **direction-preserving Codex wrapper**.

The system must do four things:

1. Store the user's original project goal as a stable **Goal Anchor**.
2. Store the first structural summary as a **Baseline Mental Model**.
3. Capture later project questions and analyze how they affect the current model.
4. Feed the updated model back into Codex context so the project does not drift without awareness.

Do not reduce the product to any of the following:

- A plain Q&A history viewer.
- A generic RAG knowledge base.
- A static wiki of Codex conversations.
- A mindmap without source-question traceability.
- An ontology graph that ignores the initial goal and direction changes.
- A coding assistant that answers local tasks without checking project direction.

---

## Primary User Problem

The user starts with an initial goal and asks Codex to create a first structure. During implementation, the user asks many smaller questions. Each small question may appear tactical, but over time those questions can alter the original direction.

The user eventually forgets:

- What the original goal was.
- What the first structure was.
- Which decisions changed the structure.
- Whether the current task still matches the original goal.
- Why the project moved from one concept to another.

This project solves that by maintaining a project mental model that shows:

- The central thesis.
- The initial goal.
- The first structure.
- Current branches of thought.
- Direction changes over time.
- Source questions behind each node.
- Whether the current request preserves, refines, modifies, conflicts with, or redirects the project.

---

## Core Mental Model Vocabulary

Use these concepts consistently across code, docs, schemas, UI labels, and tests.

### Goal Anchor

The original project objective. This is the stable reference point for all later work.

Example:

```text
Codex 안에서 이루어지는 프로젝트 질문들을 추적하여, 사용자가 초기 목표와 구조를 잊지 않도록 하고, 진행 중 질문들이 방향성에 미치는 영향을 시각적으로 보여주는 시스템을 만든다.
```

### Baseline Structure

The first coherent structure created from the initial goal. It is not frozen forever, but all future structural changes should be compared against it.

### Question Event

A user question or instruction that occurs during project work. Every meaningful Question Event must be logged with an id, timestamp, raw text, and optional derived metadata.

### Impact Analysis

The classification of how a Question Event affects the current mental model.

Allowed impact types:

- `tactical`: Local implementation detail. Little or no direction change.
- `structural_refinement`: Adds specificity to an existing branch.
- `direction_update`: Changes how the project should be understood or built.
- `goal_drift`: Moves away from the Goal Anchor, intentionally or unintentionally.
- `conflict`: Contradicts a prior decision, assumption, or model node.
- `boundary_clarification`: Clarifies what the project is not.
- `source_evidence`: Adds evidence or rationale for an existing node.

### Mental Model Node

A node in the evolving mindmap. Every important node must have source-question traceability.

### Mental Model Delta

The small update produced after a new question, answer, implementation decision, or code change. Do not repeatedly rewrite the entire model when a delta is enough.

### Context Capsule

A compact block of context injected into Codex before task execution. It should include the Goal Anchor, current thesis, relevant model nodes, recent direction changes, and task-specific guidance.

---

## Required Repository Memory Files

The repository should contain a `.mental/` directory. If it does not exist, create it before implementing core features.

Expected files:

```text
.mental/
  goal.md
  baseline-structure.md
  current-mental-model.json
  question-log.jsonl
  decision-log.jsonl
  direction-history.jsonl
  context-capsule.md
  mindmap.graph.json
```

### `.mental/goal.md`

Stores the Goal Anchor. This file should be short, durable, and human-readable.

Required sections:

```md
# Goal Anchor

## Original Goal

## Why This Exists

## Non-Goals

## First Principles
```

### `.mental/baseline-structure.md`

Stores the first structure created from the original goal.

Required sections:

```md
# Baseline Structure

## Initial Summary

## Initial Components

## Initial Workflow

## Initial Open Questions
```

### `.mental/current-mental-model.json`

Stores the current model used by the wrapper and UI.

Minimum schema:

```json
{
  "version": 1,
  "central_thesis": "",
  "goal_anchor_id": "goal_001",
  "updated_at": "",
  "nodes": [],
  "edges": [],
  "open_questions": [],
  "active_decisions": [],
  "risks": []
}
```

Each node should follow this shape:

```json
{
  "id": "node_001",
  "label": "Codex Wrapper",
  "type": "system_component",
  "summary": "Wraps Codex interactions so project questions are checked against the Goal Anchor.",
  "status": "active",
  "confidence": 0.8,
  "source_question_ids": ["q_001", "q_008"],
  "created_at": "",
  "updated_at": ""
}
```

Each edge should follow this shape:

```json
{
  "id": "edge_001",
  "from": "node_goal_anchor",
  "to": "node_codex_wrapper",
  "type": "requires",
  "summary": "The goal requires wrapping Codex because the project questions happen inside Codex work.",
  "source_question_ids": ["q_004"],
  "confidence": 0.8
}
```

### `.mental/question-log.jsonl`

Append-only event log for user questions and meaningful instructions.

Shape:

```json
{"id":"q_001","timestamp":"2026-05-20T00:00:00+09:00","text":"...","source":"user","related_files":[],"tags":[]}
```

Rules:

- Do not delete question events.
- Do not rewrite raw user text except to fix encoding errors.
- Add derived metadata separately.
- Keep ids stable.

### `.mental/direction-history.jsonl`

Append-only log of direction changes.

Shape:

```json
{"id":"delta_001","timestamp":"2026-05-20T00:00:00+09:00","question_id":"q_001","impact_type":"direction_update","affected_nodes":["node_codex_wrapper"],"summary":"Codex wrapper became a core requirement rather than an optional integration.","before":"Question ontology tool","after":"Goal-anchored Codex mental model wrapper"}
```

### `.mental/context-capsule.md`

The compact context that should be prepended or injected into Codex tasks.

Required sections:

```md
# Project Mental Model Context

## Original Goal

## Current Thesis

## Current Structure

## Recent Direction Changes

## Relevant Source Questions

## Task Guidance
```

### `.mental/mindmap.graph.json`

UI-ready graph export. It can mirror `current-mental-model.json`, but should be optimized for rendering.

Minimum shape:

```json
{
  "central_node_id": "node_current_thesis",
  "nodes": [],
  "edges": [],
  "layout": {
    "type": "mindmap"
  }
}
```

---

## Required Working Loop

Before answering a project-design question or modifying code, follow this loop.

### 1. Load Direction Context

Read, when present:

```text
AGENTS.md
.mental/goal.md
.mental/baseline-structure.md
.mental/current-mental-model.json
.mental/direction-history.jsonl
.mental/question-log.jsonl
```

Use recent entries from `question-log.jsonl` and `direction-history.jsonl` when the full files are too large.

### 2. Classify the Current Request

Classify the request as one or more of:

```text
tactical
structural_refinement
direction_update
goal_drift
conflict
boundary_clarification
source_evidence
```

### 3. Identify Affected Model Nodes

Determine which mental model nodes are affected. If the relevant node does not exist, propose or create one.

### 4. Decide Whether a Delta Is Needed

A Mental Model Delta is required when the request:

- Changes the project definition.
- Changes the architecture.
- Adds or removes a major feature.
- Clarifies what the product is not.
- Reveals a conflict with previous assumptions.
- Adds a concept that should appear in the mindmap.
- Changes how Codex should be wrapped or used.

A delta is optional for small implementation-only changes.

### 5. Build or Update the Context Capsule

For Codex-facing tasks, update `.mental/context-capsule.md` with the relevant Goal Anchor, current thesis, affected nodes, recent deltas, and task guidance.

### 6. Execute the Task

Implement the requested change. Prefer minimal, reversible changes unless the user explicitly asks for a larger rewrite.

### 7. Verify the Work

Run the smallest relevant checks. If the repo has known commands, use them. If commands are unknown, inspect `package.json`, lockfiles, Makefiles, or project docs.

### 8. Report the Mental Model Delta

When relevant, include a compact delta in the final response:

```md
## Mental Model Delta

- Impact type:
- Affected nodes:
- What changed:
- Source question:
- Files updated:
- Verification:
```

---

## Agent Roles

These are working roles, not necessarily separate processes. Use them as mental lenses. If Codex subagents are available and the user explicitly requests multi-agent work, these roles can be split across agents.

### 1. Goal Anchor Agent

Responsibilities:

- Preserve the original project goal.
- Detect when the user is drifting from the Goal Anchor.
- Distinguish intentional pivots from accidental drift.
- Maintain `.mental/goal.md`.

Do not:

- Rewrite the original goal silently.
- Treat a small implementation question as a goal change without evidence.
- Block intentional user pivots; instead, record them as deltas.

### 2. Baseline Structure Agent

Responsibilities:

- Maintain the first project structure.
- Compare current architecture against the baseline.
- Track which branches were added, merged, removed, or reinterpreted.
- Maintain `.mental/baseline-structure.md`.

Do not:

- Overwrite the baseline with the current model.
- Hide the difference between original structure and current structure.

### 3. Question Intake Agent

Responsibilities:

- Capture user questions and meaningful instructions as Question Events.
- Assign stable ids.
- Append to `.mental/question-log.jsonl`.
- Preserve raw question text.

Do not:

- Drop small questions just because they look tactical.
- Summarize away source-question traceability.

### 4. Impact Analyzer Agent

Responsibilities:

- Classify how each meaningful question affects the project.
- Identify affected nodes and edges.
- Detect conflicts, boundary clarifications, and goal drift.
- Produce a structured Mental Model Delta.

Required output shape:

```json
{
  "question_id": "q_001",
  "impact_type": "structural_refinement",
  "affected_nodes": [],
  "strengthened": [],
  "weakened": [],
  "added": [],
  "removed": [],
  "conflicts": [],
  "summary": ""
}
```

### 5. Mental Model Updater Agent

Responsibilities:

- Update `.mental/current-mental-model.json`.
- Maintain node and edge source-question ids.
- Append direction changes to `.mental/direction-history.jsonl`.
- Keep model changes small and explainable.

Do not:

- Create duplicate nodes for the same concept.
- Remove source-question ids.
- Convert the model into a generic knowledge graph detached from the Goal Anchor.

### 6. Context Capsule Agent

Responsibilities:

- Generate `.mental/context-capsule.md`.
- Keep it compact enough to inject into Codex tasks.
- Include only relevant model context for the current task.
- Make Codex aware of direction, constraints, and recent pivots.

Do not:

- Inject the full question history into every task.
- Omit the Goal Anchor when the task may affect direction.

### 7. Mindmap UI Agent

Responsibilities:

- Render the current mental model as a mindmap or graph.
- Show the central thesis prominently.
- Allow each node to reveal its source questions.
- Highlight recent deltas and direction changes.
- Export or consume `.mental/mindmap.graph.json`.

UI requirements:

- Center node: current project thesis.
- Primary branches: Goal Anchor, Baseline Structure, Codex Wrapper, Question Flow, Mental Model Delta, Mindmap Visualization, LLM Wiki Contrast, Open Decisions.
- Node detail panel must show source question ids and summaries.
- Recent changes should be visible without opening raw logs.

### 8. Codex Wrapper Agent

Responsibilities:

- Act as the gateway before Codex execution.
- Convert the user request into a Codex-ready prompt with context.
- Ensure the Goal Anchor and relevant current model are included.
- Capture Codex outcomes and update the mental model if needed.

Required wrapper flow:

```text
user question
  -> log question event
  -> load goal/current model
  -> analyze impact
  -> build context capsule
  -> call or prepare Codex task
  -> capture outcome
  -> update model and direction history
  -> refresh mindmap graph
```

### 9. Implementation Agent

Responsibilities:

- Build features according to the current model.
- Prefer existing project conventions.
- Keep changes scoped.
- Add tests for core logic.
- Avoid speculative frameworks unless needed.

### 10. Verification Agent

Responsibilities:

- Run tests, linting, type checks, or build checks.
- Verify mental model files are valid JSON/JSONL/Markdown.
- Verify source-question traceability on important model nodes.
- Report what was checked and what could not be checked.

---

## Expected Architecture

If the repository is already initialized, follow the existing architecture. If the repository is empty or nearly empty, use this default architecture unless the user says otherwise.

```text
apps/
  web/
    src/
      app/
      components/
      features/
        mindmap/
        question-log/
        direction-summary/

packages/
  core/
    src/
      goal-anchor/
      question-log/
      impact-analyzer/
      mental-model/
      context-capsule/
      schemas/

  codex-wrapper/
    src/
      ask.ts
      codex-runner.ts
      prompt-builder.ts

  visualization/
    src/
      mindmap-graph.ts
      graph-layout.ts

.mental/
  goal.md
  baseline-structure.md
  current-mental-model.json
  question-log.jsonl
  decision-log.jsonl
  direction-history.jsonl
  context-capsule.md
  mindmap.graph.json

docs/
  product/
  architecture/
  decisions/

tests/
```

Preferred initial stack for an empty repo:

```text
Language: TypeScript
Runtime: Node.js
Frontend: Next.js or Vite + React
Mindmap/graph UI: React Flow or Cytoscape.js
Storage for MVP: local Markdown, JSON, and JSONL files under .mental/
Future storage: PostgreSQL, SQLite, or graph DB only after the file-based model works
```

Do not introduce a database before the file-based mental model is working unless the user explicitly requests it.

---

## Build, Test, and Run Commands

Always inspect the repository before assuming commands.

Use this order of detection:

1. Check `package.json` scripts.
2. Check lockfiles: `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `bun.lockb`.
3. Check `Makefile`, `justfile`, `Taskfile.yml`, or project docs.
4. If no commands exist, explain what is missing and propose minimal scripts.

Common commands when using the default TypeScript stack:

```bash
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

If the repo uses npm:

```bash
npm install
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
```

If the repo uses yarn:

```bash
yarn install
yarn dev
yarn test
yarn lint
yarn typecheck
yarn build
```

If a command is missing, do not pretend it ran. State that the command was unavailable and what should be added.

---

## Coding Conventions

General:

- Prefer TypeScript for application and core logic.
- Keep functions small and testable.
- Use explicit domain names: `GoalAnchor`, `QuestionEvent`, `ImpactAnalysis`, `MentalModelDelta`, `ContextCapsule`.
- Keep IO boundaries separate from pure model logic.
- Use schemas or validators for external data and `.mental` files.
- Preserve append-only logs unless the user explicitly asks for migration or cleanup.

Data handling:

- Validate JSON before writing.
- Validate JSONL line by line.
- Use stable ids for questions, nodes, edges, and deltas.
- Do not remove historical entries from logs.
- If migration is needed, write a migration note in `docs/decisions/` or `.mental/decision-log.jsonl`.

UI:

- The mental model UI must prioritize clarity over visual complexity.
- The central thesis should be visible at all times.
- Source questions should be accessible from each important node.
- Recent deltas should be highlighted.
- Avoid decorative graphs that do not explain direction changes.

CLI/wrapper:

- The wrapper must log the question before sending the task onward.
- The wrapper must generate or refresh the context capsule before Codex execution.
- The wrapper must capture outcome summaries after task completion when possible.

---

## Product Rules

### Rule 1: Direction first, storage second

Do not implement this as a storage tool first. Storage exists to preserve direction, explain changes, and provide source traceability.

### Rule 2: Source questions are mandatory

Major claims in the mental model need source question ids. A node without source questions is weaker and should be marked as inferred.

### Rule 3: Deltas beat full rewrites

When a new question comes in, update the model through a delta. Do not regenerate the whole model unless the model is corrupted, too stale, or the user asks for a full reframe.

### Rule 4: Distinguish wiki from wrapper

An LLM wiki stores and retrieves information. This project tracks how project direction evolves and injects that direction back into Codex work.

### Rule 5: Make drift visible

Goal drift is not automatically bad. But it must be visible. If the user's request changes direction, record it clearly.

### Rule 6: Keep the first structure visible

The baseline structure should remain available even after the current model evolves.

### Rule 7: Do not over-ontology the product

Ontology can be used as an internal representation, but the user-facing experience is a project mental model/mindmap, not an academic ontology editor.

---

## Required Feature Behavior

### Initialize Project Mental Model

When the user asks to initialize the project:

1. Create `.mental/` directory.
2. Create `goal.md` from the user's original goal.
3. Create `baseline-structure.md` from the first agreed structure.
4. Create a minimal `current-mental-model.json`.
5. Create empty JSONL logs.
6. Create `context-capsule.md`.
7. Create `mindmap.graph.json`.

### Ask Through Wrapper

When the user asks a project question through the wrapper:

1. Append the question to `question-log.jsonl`.
2. Analyze impact against the Goal Anchor and current model.
3. Update `direction-history.jsonl` if needed.
4. Update `current-mental-model.json` if needed.
5. Refresh `context-capsule.md`.
6. Refresh `mindmap.graph.json`.
7. Prepare or call Codex with the context capsule.

### Render Mindmap

The mindmap must show:

- Central thesis.
- Goal Anchor.
- Baseline Structure.
- Current structure.
- Direction changes.
- Recent questions.
- Open decisions.
- Source question references.

### Explain Current Direction

When asked "지금 방향성이 뭐야?" or similar, answer with:

```text
1. 현재 핵심 요지
2. 초기 목표와의 관계
3. 최근 질문들이 바꾼 부분
4. 아직 결정되지 않은 것
5. 다음 추천 액션
```

---

## Prompting Rules for Codex Work

When preparing a Codex task, use this structure:

```md
# Task

<user request>

# Project Mental Model Context

## Original Goal
<from .mental/goal.md>

## Current Thesis
<from .mental/current-mental-model.json>

## Relevant Model Nodes
<only relevant nodes>

## Recent Direction Changes
<recent relevant deltas>

## Instruction
Before modifying code, state whether this task is tactical, structural_refinement, direction_update, goal_drift, conflict, boundary_clarification, or source_evidence. Keep the implementation aligned with the Goal Anchor unless the user explicitly requests a pivot.
```

Keep context compact. Do not paste all history unless required.

---

## Definition of Done

A task is complete only when the relevant items below are satisfied.

For code tasks:

- The requested behavior is implemented.
- Existing conventions are followed.
- Relevant tests, type checks, lint checks, or builds were run where available.
- Any unavailable verification command is reported honestly.

For mental model tasks:

- The question was logged if it was meaningful.
- The impact type was identified.
- Affected nodes were identified or created.
- Source-question traceability was preserved.
- Any direction change was appended to `direction-history.jsonl`.
- The context capsule was refreshed if Codex work depends on the change.
- The mindmap graph was refreshed if the visible model changed.

For architecture tasks:

- The change is compared against the Goal Anchor.
- The baseline/current distinction is preserved.
- Tradeoffs are documented.
- Any intentional pivot is recorded as a direction delta.

---

## Response Format

For most user-facing responses in this project, use Korean and keep the answer practical.

When a task affects direction, include:

```md
## 방향성 영향

- 분류:
- 영향받은 노드:
- 바뀐 점:
- 유지해야 할 점:
```

When code/files changed, include:

```md
## 변경 사항

- 파일:
- 내용:

## 검증

- 실행한 명령:
- 결과:
- 실행하지 못한 것:
```

Do not include long philosophical summaries after every small implementation task. Keep deltas compact.

---

## Safety and Integrity Rules

- Do not fabricate test results.
- Do not claim Codex was run if it was not actually run.
- Do not claim files were updated if they were not updated.
- Do not silently delete user history, question logs, or direction logs.
- Do not store secrets in `.mental/` files.
- Do not add external dependencies unless they are justified and consistent with the repo.
- Do not convert the product into a generic note-taking app.
- Do not hide uncertainty when the model impact is ambiguous.

---

## Initial MVP Build Order

If asked to build the MVP from scratch, implement in this order:

1. File-based `.mental/` memory store.
2. Question event logging.
3. Impact analysis schema and deterministic update flow.
4. Current mental model JSON update logic.
5. Context capsule generation.
6. Mindmap graph export.
7. Simple CLI command such as `mental ask "..."`.
8. Minimal web UI for mindmap and source questions.
9. Codex execution integration.
10. Tests and validation around JSON/JSONL updates.

Do not start with an advanced graph database, complex ontology editor, or elaborate visualization before the mental model update loop works.

---

## Current Conceptual Baseline

Use this as the initial interpretation of the project until the user changes it.

```text
이 프로젝트는 Codex의 답변을 저장하는 도구가 아니라, Codex와 대화하며 프로젝트를 진행하는 동안 사용자의 질문들이 초기 목표와 현재 구조에 어떤 영향을 주는지 추적하고, 그 변화된 멘탈모델을 다시 Codex의 작업 맥락에 주입하는 방향성 유지 레이어다.
```

Initial primary branches:

```text
Central Thesis
  ├─ Goal Anchor
  ├─ Baseline Structure
  ├─ Codex Wrapper
  ├─ Question Log
  ├─ Impact Analyzer
  ├─ Mental Model Delta
  ├─ Context Capsule
  ├─ Mindmap Visualization
  ├─ LLM Wiki Contrast
  └─ Open Decisions
```

Initial open decisions:

```text
1. Wrapper interface: CLI, IDE extension, desktop app, or web app?
2. Initial storage: local files only, SQLite, PostgreSQL, or graph DB?
3. Mindmap renderer: React Flow, Cytoscape.js, Mermaid, or custom canvas?
4. Codex integration depth: context injection only, CLI execution, MCP integration, or full orchestration?
5. How often should the model be compacted or re-summarized?
```

