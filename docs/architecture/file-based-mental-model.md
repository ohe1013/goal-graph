# File-Based Mental Model Architecture

## Purpose

The file store exists to preserve project direction and source-question traceability. It is not a generic document database.

## Primary Files

- `.mental/goal.md`: stable Goal Anchor.
- `.mental/baseline-structure.md`: first project structure.
- `.mental/current-mental-model.json`: current graph model.
- `.mental/question-log.jsonl`: append-only user question events.
- `.mental/direction-history.jsonl`: append-only direction deltas.
- `.mental/context-capsule.md`: compact Codex context.
- `.mental/mindmap.graph.json`: UI-ready graph export.

## Update Loop

```text
question -> log event -> analyze impact -> update model -> refresh capsule -> refresh graph
```

