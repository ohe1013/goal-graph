# Project Mental Model Context

## Original Goal

Codex 안에서 이루어지는 프로젝트 질문들을 추적하여, 사용자가 초기 목표와 구조를 잊지 않도록 하고, 진행 중 질문들이 방향성에 미치는 영향을 시각적으로 보여주는 시스템을 만든다.

## Current Thesis

??? Codex-like wrapper? ???? ???? ????? ?? ??, Codex?? ???? ?? ??, ??, ?? ?? ??? Goal Anchor ???? ???? ????? ?? ???? ??? ?? ?? ??.

## Current Structure

- Central Thesis: Project-direction memory layer that keeps Codex work aligned with the original goal while allowing visible evolution.
- Goal Anchor: Stores the stable original project objective used as the reference point for later questions.
- Baseline Structure: Preserves the first coherent project structure so future changes can be compared against it.
- Codex Wrapper: Acts as the gateway that logs a question, loads direction context, prepares Codex context, and records outcomes.
- Question Log: Append-only log of meaningful user questions with stable ids and raw text.
- Impact Analyzer: Classifies whether a question is tactical, structural, direction-changing, drifting, conflicting, clarifying, or evidential.
- Mental Model Delta: Small explainable updates that record how a new question changes or strengthens the current model.
- Context Capsule: Compact project-direction context injected into Codex-facing work.

## Recent Direction Changes

- `delta_003` (direction_update): External usage goal clarified as installable Codex-like wrapper where running the tool opens the mindmap and Codex-like development continuously draws the graph.
- `delta_004` (direction_update): Question impact must be controlled by explicit # directives or a workspace default mode so tactical Codex work does not automatically change project direction.
- `delta_005` (direction_update): Workspace was opened through the terminal wrapper and project analysis was injected into the mental model.
- `delta_006` (direction_update): The wrapper target now includes an interactive terminal session: run the command, consent to workspace analysis, seed the mental model, ask questions, and sync graph artifacts.
- `delta_007` (direction_update): Workspace was opened through the terminal wrapper and project analysis was injected into the mental model.

## Relevant Source Questions

- `q_004`: ???? ???? ??? ?????? ? ??? ??? 1. codex?? ??? ??? 2. ???? ? ????? ?? 3. codex?? ??? ?? ? ????? ????.
- `q_005`: 이게 기본적으론 codex를 래핑하는데 모든 질문이 방향성에 영향을 끼치면 안될 것 같아 그래서 질문전에 #으로 질문의 종류를 받는 형식으로 설계를 변경하고싶어, 이게 방향성을 정하진 않을땐 #none 다음에 스페이스바 해서 질문을 처리하거나 이 모드를 정할 수 있게 하고싶어 강한 방향성을 가질땐 #strong 이런식으로 이런 방향성에 대한 기능들을 너가 더 생각해보고 처리할 수 있게 생각해봐
- `q_006`: #strong Open workspace and analyze project
- `q_007`: 터미널에 띄어놓고 codex처럼 실행하면 해당 프로젝트 동의를 받고 먼저 분석해서 멘탈 모델 형식에 넣고, 이후 질문이 반영되며 동기화 기능도 생성한다.
- `q_008`: #strong Open workspace and analyze project

## Task Guidance

Respect the terminal wrapper flow: open workspace, analyze project, honor question directives, then run Codex-like tasks against the refreshed context capsule.