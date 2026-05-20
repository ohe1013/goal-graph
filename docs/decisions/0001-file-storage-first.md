# Decision 0001: File Storage First

## Status

Accepted

## Decision

Start with local Markdown, JSON, and JSONL files under `.mental/`.

## Rationale

The product thesis is direction preservation. A file-based store keeps the mental model visible, inspectable, and easy to diff while the update loop is still evolving.

## Consequences

- The MVP can run without external services.
- Logs remain append-only.
- Future database storage must preserve Goal Anchor, baseline/current distinction, and source-question traceability.

