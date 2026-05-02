# Task: Add UI-visible listing of existing task markdown files

## Task

- `agent-studio-v9-add-task-file-listing`

## Status

done

## Objective

Show existing saved task files from `tasks/*.md` in the Agent Studio UI.

## Context Pack

context-packs/agent-studio-v9-task-drafts.md

## Scope

- Add read-only API endpoint to list task markdown files
- Add UI panel to display saved task files
- Keep saved tasks separate from future unsaved drafts

## Out of Scope

- No draft extraction
- No task file saving
- No task editing
- No Dev auto-run
- No task validation changes
- No database

## Acceptance Criteria

- Existing markdown files under `tasks/` are listed in the UI
- Missing or empty `tasks/` directory is handled gracefully
- API is read-only
- UI clearly labels these as saved task files
- No task is auto-selected or auto-executed

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v9-add-task-file-listing.md
```

## Dev Handoff

- Confirm `GET /tasks` returns a read-only list of markdown files under `tasks/`.
- Confirm the UI labels them as saved task files and does not auto-select or auto-run them.
- Keep draft parsing and task saving out of scope.
