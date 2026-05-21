# Terminal Wrapper Workflow

## Target Behavior

The product should be usable from a terminal in the same style as Codex:

```bash
goal-graph
goal-graph session .
goal-graph open .
goal-graph ask "#none fix this local bug"
goal-graph run "#none fix this local bug"
goal-graph sync
```

The user enters an existing project directory, runs the command, consents to analysis, and the wrapper builds the first project mental model before normal Codex-like questions continue.

## First Run Flow

```text
user runs goal-graph in a project
  -> wrapper checks for .mental/
  -> if missing, ask for consent
  -> analyze project structure
  -> initialize .mental/ files
  -> write project-analysis.json
  -> inject analysis into current-mental-model.json
  -> refresh context-capsule.md
  -> refresh mindmap.graph.json
  -> user continues with wrapped questions
```

For non-interactive automation:

```bash
goal-graph open . --yes
```

## Interactive Session

Running `goal-graph` without a subcommand opens the current workspace and keeps a terminal session alive:

```text
goal-graph> #none fix a local implementation bug
goal-graph> #strong change the product direction
goal-graph> .run #none execute this through Codex
goal-graph> .sync
goal-graph> .mode none
goal-graph> .exit
```

The session keeps a wrapper boundary. Normal questions prepare context-rich Codex tasks and update `.mental`; `.run` sends the prepared prompt to the local Codex CLI.

## Codex CLI Adapter

`goal-graph run` prepares the context capsule first, logs the question, updates graph artifacts, then calls the local `codex` command:

```text
goal-graph run "#strong implement this direction"
  -> askThroughWrapper
  -> context-capsule.md
  -> codex --cd <workspace> <prepared prompt>
```

For non-interactive Codex execution:

```bash
goal-graph run --exec "#none fix this local issue"
```

## Project Analysis

The analysis step should detect enough structure to seed the model without pretending to understand the full product direction.

Current signals:

- `package.json` name, package manager, scripts, workspaces.
- Lockfiles.
- Root docs such as `README.md` and `AGENTS.md`.
- Top-level source directories.
- File extension counts.
- Inferred stack such as TypeScript, React, Vite, Electron, Node.js, Monorepo.

Generated output:

```text
.mental/project-analysis.json
```

## Sync Flow

The sync command refreshes generated mental model artifacts after project analysis or question handling:

```bash
goal-graph sync
```

It refreshes:

- `.mental/context-capsule.md`
- `.mental/mindmap.graph.json`
- `.mental/sync-state.json`

If the project contains `apps/web/public`, sync also copies graph and log files there for the current web UI.

## Boundary

Project analysis is evidence, not user intent. It may seed the mental model, but direction changes still require user questions, directives, decisions, or explicit consent.
