# Baseline Structure

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

```text
user question
  -> log question event
  -> load goal and current model
  -> analyze impact
  -> update mental model and direction history
  -> refresh context capsule
  -> refresh mindmap graph
  -> prepare Codex task with project direction context
```

## Initial Open Questions

1. Wrapper interface: CLI, IDE extension, desktop app, or web app?
2. Initial storage: local files only, SQLite, PostgreSQL, or graph DB?
3. Mindmap renderer: React Flow, Cytoscape.js, Mermaid, or custom canvas?
4. Codex integration depth: context injection only, CLI execution, MCP integration, or full orchestration?
5. How often should the model be compacted or re-summarized?

