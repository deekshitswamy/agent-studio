# Task: Add Dev Write Artifacts

## Task

- `agent-studio-v19-dev-write-artifacts`

## Status

- `done`

## Objective

- Allow project-scoped Dev runs to produce structured write artifacts that the API safely applies to the filesystem.

## Context Pack

- `context-packs/agent-studio-v10-run-dev-from-task.md`

## Scope

- Make Dev runs emit a structured write artifact such as `writes.json` or an equivalent structured file.
- Make the API detect and parse that write artifact after a Dev run completes.
- Require `project` to be present before any write artifact is applied.
- Validate all write targets so they remain under `projects/<project-id>/`.
- Reject any path containing traversal such as `..`.
- Apply writes as create-or-replace full file content only.
- Keep non-project runs read-only with respect to filesystem writes from this feature.
- Preserve existing run and log behavior.
- Keep the implementation project-scoped only.

## Out of Scope

- Patch editing
- Delete or rename operations
- UI visualization of writes
- Background jobs
- Database
- Multi-user support
- Arbitrary shell writes
- Parsing markdown logs into filesystem writes
- Agent Runner behavior changes outside the explicit Dev write-artifact path

## Acceptance Criteria

- A project-scoped Dev run produces at least one file under `projects/<project-id>/`.
- Written files match the expected content from the structured write artifact.
- Invalid paths are rejected.
- Non-project runs do not apply structured filesystem writes.
- Existing `GET /runs/:id` and `GET /logs/:id` behavior remains unchanged.

## Verification

- `node ./bin/run-agent.js task validate tasks/agent-studio-v19-dev-write-artifacts.md`
- Execute a project-scoped Dev run on a simple selected task and confirm at least one file is created or replaced under `projects/<project-id>/`.
- Confirm the resulting file content matches the expected structured artifact content.
- Confirm invalid write paths are rejected.
- Confirm a non-project Dev run does not apply structured writes.
- Verify the existing run and log endpoints still work after the write flow.

## Dev Handoff

- Inspect `server/agent-service.js`, `src/tool-router.js`, `src/mcp/safe-paths.js`, and `prompts/dev.md` first.
- Keep the write boundary explicit and project-scoped only.
- Prefer a structured artifact format over parsing markdown output.
- Preserve the current run API shape and the existing UI behavior for this first step.
- Do not add patch semantics, delete behavior, background jobs, or project creation behavior in this task.
