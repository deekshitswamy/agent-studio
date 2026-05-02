# Task: Project-Scoped Dev Write Artifact Smoke Test

## Task

- `agent-studio-v19-write-artifact-smoke`

## Status

- `pending`

## Objective

- Verify that a project-scoped Dev run can emit a structured write artifact that safely creates one file inside the selected project workspace.

## Context Pack

- `context-packs/agent-studio-v10-run-dev-from-task.md`

## Scope

- Emit one structured write artifact.
- Create one file under `projects/agent-studio/docs/`.
- Keep the verification deterministic and project-scoped only.

## Out of Scope

- Non-project writes
- Patch editing
- Delete or rename behavior

## Acceptance Criteria

- A project-scoped Dev run applies the structured write artifact.
- The created file matches the requested content exactly.

## Verification

- `node ./bin/run-agent.js task validate tasks/agent-studio-v19-dev-write-artifacts.md`
- `POST /runs` with `agent: "dev"` and `project: "agent-studio"`

## Dev Handoff

- Use the explicit structured write artifact below for deterministic verification.

## Write Artifact

```json
{
  "version": 1,
  "writes": [
    {
      "path": "projects/agent-studio/docs/dev-write-artifact-example.md",
      "content": "# Dev Write Artifact Example\n\nThis file was created by the project-scoped Dev write artifact verification flow.\n"
    }
  ]
}
```
