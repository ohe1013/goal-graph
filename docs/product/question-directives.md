# Question Direction Directives

## Purpose

The wrapper should not treat every user question as a direction-changing event. The user must be able to mark the intended impact before the question reaches Codex.

Directive syntax:

```text
#directive question text
```

Examples:

```text
#none 버튼 색상만 바꿔
#weak 마인드맵 노드 detail panel을 조금 더 명확하게 하자
#strong 앞으로 설치형 Electron 앱을 핵심 제품으로 잡자
```

## Supported Directives

| Directive | Meaning | Result |
| --- | --- | --- |
| `#none` | Directionless local task | Forced `tactical`, no direction delta |
| `#auto` | Let analyzer infer impact | Existing heuristic behavior |
| `#weak` | Small direction or structure signal | Usually `structural_refinement` |
| `#strong` | Strong direction signal | Forced `direction_update` |
| `#boundary` | Clarifies what the product is not | Forced `boundary_clarification` |
| `#conflict` | Flags contradiction with current model | Forced `conflict` |
| `#drift` | Intentional or accidental goal drift | Forced `goal_drift` |
| `#evidence` | Adds supporting rationale/source | Forced `source_evidence` |

Aliases:

- `#tactical`, `#local`, `#no` -> `#none`
- `#refine`, `#refinement` -> `#weak`
- `#direction`, `#structural` -> `#strong`
- `#non_goal`, `#nongoal` -> `#boundary`
- `#source` -> `#evidence`

## Default Mode

The workspace can store a default directive in:

```text
.mental/question-mode.json
```

Default shape:

```json
{
  "version": 1,
  "default_directive": "auto",
  "updated_at": "2026-05-21T00:00:00+09:00"
}
```

CLI usage:

```bash
goal-graph mode none
goal-graph mode auto
goal-graph ask "#strong 새 제품 방향을 정하자"
```

Recommended default for real development is `auto` or `none`:

- Use `auto` while the product is learning user intent.
- Use `none` when most questions are local implementation tasks and the user wants explicit direction tagging.

## Logging Rule

The raw text must remain in `question-log.jsonl`. The stripped question goes into `normalized_text`, and the interpreted directive goes into `directive` / `directive_source`.

Example:

```json
{"id":"q_010","text":"#none 버튼 색상만 바꿔","normalized_text":"버튼 색상만 바꿔","directive":"none","directive_source":"inline"}
```

## Product Constraint

Question directives are part of the wrapper contract. They prevent the product from over-interpreting tactical Codex work as project direction.

