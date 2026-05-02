# Task: Non-Project Dev Write Artifact Ignore Check

## Task

- `agent-studio-v19-nonproject-ignore`

## Status

- `pending`

## Objective

- Verify that structured Dev write artifacts are not applied when no project is selected.

## Context Pack

- `context-packs/agent-studio-v10-run-dev-from-task.md`

## Scope

- Emit one structured write artifact.
- Execute the Dev run without a selected project.
- Confirm no file is created.

## Out of Scope

- Project-scoped writes
- UI changes

## Acceptance Criteria

- The non-project Dev run completes without applying file writes.
- The target file does not appear on disk.

## Verification

- `POST /runs` with `agent: "dev"` and no `project`

## Dev Handoff

- Use the explicit structured write artifact below for deterministic verification.

## Write Artifact

```json
{
  "version": 1,
  "writes": [
    {
      "path": "projects/agent-studio/docs/nonproject-write-should-not-exist.md",
      "content": "# Non-Project Write Should Not Exist\n"
    }
  ]
}
```
