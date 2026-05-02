# Task: Add Project-Scoped Task Saving

## Task

- `agent-studio-v13-project-scoped-task-saving`

## Status

- `done`

## Objective

- Make `POST /tasks` project-aware so reviewed task drafts can be saved into `projects/<project-id>/tasks/` when a project is selected.

## Context Pack

- `context-packs/agent-studio-v10-run-dev-from-task.md`

## Scope

- Make `POST /tasks` optionally accept `project`.
- If `project` is provided, save to `projects/<project-id>/tasks/<task-id>.md`.
- If no project is provided, preserve current top-level `tasks/` behavior.
- Make the UI send the selected project when saving reviewed drafts.
- Refresh the saved task list in the selected project scope after save.
- Preserve existing overwrite protection in both legacy and project-scoped paths.

## Out of Scope

- Run or log scoping
- Project creation flow
- File migration
- Database
- Auth
- Multi-user support
- Auto-save
- Auto-run Dev
- Agent Runner behavior changes

## Acceptance Criteria

- Saving without `project` still works as before.
- Saving with `project` writes to `projects/<project-id>/tasks/`.
- Overwrite protection still works in both scopes.
- The UI shows the saved task in the selected project task list after save.
- Agent Runner behavior remains unchanged.

## Verification

- `node ./bin/run-agent.js task validate tasks/agent-studio-v13-project-scoped-task-saving.md`
- Save a reviewed draft without `project` and confirm top-level `tasks/` behavior still works.
- Save a reviewed draft with `project=agent-studio` and confirm it writes to `projects/agent-studio/tasks/`.
- Verify overwrite rejection in both legacy and project-scoped paths.
- Verify the Saved Tasks panel refreshes in the selected project scope after save.

## Dev Handoff

- Inspect `server/agent-service.js` and `ui/index.html` first.
- Reuse the existing project selection field added in the previous v13 step.
- Do not change run behavior, run storage, log storage, or project creation behavior in this task.
