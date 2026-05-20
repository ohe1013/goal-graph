# Project Mental Model Context

## Original Goal

Codex 안에서 이루어지는 프로젝트 질문들을 추적하여, 사용자가 초기 목표와 구조를 잊지 않도록 하고, 진행 중 질문들이 방향성에 미치는 영향을 시각적으로 보여주는 시스템을 만든다.

## Current Thesis

??? Codex-like wrapper? ???? ???? ????? ?? ??, Codex?? ???? ?? ??, ??, ?? ?? ??? Goal Anchor ???? ???? ????? ?? ???? ??? ?? ?? ??.

## Current Structure

- Mindmap Visualization: Renders the current mental model, source questions, and recent deltas as a graph.
- Electron Shell: Packages the mindmap UI and local wrapper service into a desktop app that can stay open without relying on a browser tab.
- Codex Execution Adapter: Defines how prepared context capsules are handed to Codex CLI/API and how outcomes return to the mental model logs.
- Installable Codex-like CLI: The product should be installable like Codex and expose a command that opens or attaches to a project workspace.
- Mindmap-first Launch: Running the installed wrapper should open the project mindmap first, making the current mental model the default surface before development continues.
- Development Activity Capture: Codex-like development actions should feed question logs, decisions, outcomes, and model deltas so the mindmap is drawn as work happens.

## Recent Direction Changes

- `delta_001` (direction_update): The repository is initialized as a goal-anchored Codex mental model wrapper with file-based memory, CLI wrapper, and mindmap UI as the MVP direction.
- `delta_002` (direction_update): External use and Electron always-on desktop operation become a proposed runtime direction while preserving the Codex wrapper boundary.
- `delta_003` (direction_update): External usage goal clarified as installable Codex-like wrapper where running the tool opens the mindmap and Codex-like development continuously draws the graph.

## Relevant Source Questions

- `q_001`: 프로젝트 생성하자
- `q_002`: 포트 변경해 5273으로
- `q_003`: ?? ?????? ???? ??? ???? ?? ??? ???? ??, ??? ?? ?????? ???? ???? ???? ???? ? ? ?? ??????
- `q_004`: ???? ???? ??? ?????? ? ??? ??? 1. codex?? ??? ??? 2. ???? ? ????? ?? 3. codex?? ??? ?? ? ????? ????.

## Task Guidance

Treat the installable Codex-like workflow as the primary product experience. Running the tool must show the mindmap first, and Codex-like development activity must feed model deltas automatically.