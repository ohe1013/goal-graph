# MVP Scope

## Product Direction

This project is a direction-preserving Codex wrapper. It is not a generic chatbot archive, static wiki, or graph-only visualization.

## Build Order

1. Local `.mental/` store.
2. Question event logging.
3. Impact analysis schema and deterministic update flow.
4. Mental model update logic.
5. Context capsule generation.
6. Mindmap graph export.
7. CLI wrapper.
8. Minimal web UI.
9. Codex execution integration.

## Storage Boundary

The MVP uses local Markdown, JSON, and JSONL files. SQLite, PostgreSQL, and graph databases are future options after the file-based loop works.

