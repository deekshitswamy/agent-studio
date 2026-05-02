# Task: Add Project-Scoped Runs And Logs

## Task

- `agent-studio-v13-project-scoped-runs-logs`

## Status

- `done`

## Objective

- Make run and log artifacts project-aware while preserving legacy global behavior.

## Context Pack

- `context-packs/agent-studio-v10-run-dev-from-task.md`

## Scope

- Make `POST /runs` optionally accept `project`.
- If `project` is provided, write run artifacts to `projects/<project-id>/.local/runs/`.
- If no project is provided, preserve existing `.local/runs/` behavior.
- Make `GET /runs/:id` optionally accept `?project=<project-id>`.
- Make `GET /logs/:id` optionally accept `?project=<project-id>`.
- Make the UI send the selected project in `POST /runs`.
- Make the UI send the selected project when fetching logs.
- Include `project` in returned run metadata when scoped.

## Out of Scope

- Migration
- Database
- Auth
- Multi-user support
- Run list endpoint
- Project creation flow
- Task Planner source scoping unless required by the implementation
- Background jobs
- Agent Runner behavior changes

## Acceptance Criteria

- Legacy run and log behavior still works without `project`.
- A project-scoped run writes artifacts to `projects/<project-id>/.local/runs/`.
- Project-scoped `GET /runs/:id` reads from the project run path.
- Project-scoped `GET /logs/:id` reads from the project run path.
- UI normal Run and Run Dev both use the selected project.
- Existing Agent Runner behavior remains unchanged.

## Verification

- `node ./bin/run-agent.js task validate tasks/agent-studio-v13-project-scoped-runs-logs.md`
- Start a run without `project` and confirm artifacts still write to `.local/runs/`.
- Start a run with `project=agent-studio` and confirm artifacts write to `projects/agent-studio/.local/runs/`.
- Verify `GET /runs/:id` and `GET /logs/:id` work in both global and project scopes.
- Verify the UI sends the selected project for both normal runs and Run Dev.

## Dev Handoff

- Inspect `server/agent-service.js` and `ui/index.html` first.
- Reuse the existing `Project ID` field added in v13.
- Keep the implementation limited to run/log artifact scoping and request propagation.
- Do not add migration, project creation, run listing, or background behavior in this task.
