# Task: Invalid Dev Write Artifact Rejection

## Task

- `agent-studio-v19-invalid-write-artifact`

## Status

- `pending`

## Objective

- Verify that invalid structured write artifact paths are rejected safely.

## Context Pack

- `context-packs/agent-studio-v10-run-dev-from-task.md`

## Scope

- Emit one invalid structured write artifact path.
- Confirm the API rejects the write safely.

## Out of Scope

- Valid file writes
- Non-project behavior

## Acceptance Criteria

- Invalid path is rejected.
- No file is created outside the selected project workspace.

## Verification

- `POST /runs` with `agent: "dev"` and `project: "agent-studio"`

## Dev Handoff

- Use the explicit invalid structured write artifact below for deterministic verification.

## Write Artifact

```json
{
  "version": 1,
  "writes": [
    {
      "path": "../outside.txt",
      "content": "This write must be rejected.\n"
    }
  ]
}
```
