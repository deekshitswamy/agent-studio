# Task: Add Project-Scoped Task Listing

## Task

- `agent-studio-v13-project-scoped-task-listing`

## Status

- `done`

## Objective

- Add lightweight project selection and project-scoped read-only task listing.

## Context Pack

- `context-packs/agent-studio-v10-run-dev-from-task.md`

## Scope

- Add support for `projects/<project-id>/tasks/`.
- Make `GET /tasks` optionally accept `project=<project-id>`.
- If no project is provided, keep current top-level `tasks/` behavior.
- Add a simple project input or select field in the UI.
- Make the Saved Tasks panel show tasks for the selected project.
- Keep the change read-only for task listing.
- Preserve current human-triggered workflow behavior.

## Out of Scope

- Database
- Auth
- Multi-user support
- Project creation flow
- Run or log scoping
- Task save scoping
- File migration
- Migration script
- Auto-detection of project
- Run behavior changes

## Acceptance Criteria

- `GET /tasks` still works as before when no project is provided.
- `GET /tasks?project=agent-studio` reads from `projects/agent-studio/tasks/`.
- The UI can enter or select a project id.
- The Saved Tasks panel refreshes based on the selected project.
- Legacy/default behavior is preserved when no project is selected.

## Verification

- `node ./bin/run-agent.js task validate tasks/agent-studio-v13-project-scoped-task-listing.md`
- `curl http://127.0.0.1:3000/tasks`
- `curl http://127.0.0.1:3000/tasks?project=agent-studio`
- Manually verify the UI Saved Tasks panel updates when the project id changes.

## Dev Handoff

- Inspect `server/agent-service.js` and `ui/index.html` first.
- Keep the first v13 step minimal and read-only.
- Do not change run behavior, task saving behavior, or migration state in this task.
