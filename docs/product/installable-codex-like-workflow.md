# Installable Codex-like Workflow

## Target Experience

The product should feel installable and runnable like Codex:

1. Install the wrapper once.
2. Run it in or against a project workspace.
3. The project mindmap opens first.
4. The user develops through the wrapped Codex flow.
5. Questions, decisions, Codex outcomes, and code-change summaries update the mindmap automatically.

## External Usage

The external user should not need to run a browser dev server manually.

Preferred commands:

```bash
goal-graph install
goal-graph open .
goal-graph ask "implement the next feature"
```

Expected behavior:

- `goal-graph open .` starts or attaches to the local runtime.
- If `.mental/` is missing, the app prompts for a Goal Anchor and initializes the workspace.
- The Electron shell opens the current mindmap.
- `goal-graph ask` logs the question, refreshes the context capsule, invokes the Codex execution adapter, captures the outcome, and refreshes the graph.

## Runtime Shape

```text
installed command
  -> workspace resolver
  -> local runtime / Electron main process
  -> .mental file store
  -> CodexExecutionAdapter
  -> outcome capture
  -> mindmap graph refresh
```

## Electron Role

Electron should host the always-on mindmap-first UI. It should not own domain logic directly.

Electron main process responsibilities:

- Workspace selection.
- File system access to `.mental/`.
- IPC handlers for question logging and graph loading.
- Starting or attaching to the local runtime.
- Calling the Codex execution adapter.

Renderer responsibilities:

- Show the current mindmap.
- Show source questions and recent deltas.
- Submit wrapped Codex tasks through IPC.

## Adapter Boundary

Codex integration must stay behind `CodexExecutionAdapter`.

The adapter should support these modes over time:

- `prepared_prompt`: build context-rich prompt only.
- `codex_cli`: run local Codex CLI as a child process.
- `api`: call an API-backed execution path if needed.
- `mcp`: expose the wrapper as a tool/runtime boundary later.

## Product Constraint

The user should not have to manually sync logs, copy context capsules, or open a separate browser tab to see the mindmap. If the mindmap does not update as development happens, the product is drifting back toward a static wiki or history viewer.

