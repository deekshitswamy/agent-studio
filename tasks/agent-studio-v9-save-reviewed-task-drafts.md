# Task: Save Reviewed Task Drafts

## Task

- `agent-studio-v9-save-reviewed-task-drafts`

## Status

done

## Objective

Allow a human to save reviewed task drafts to `tasks/<task-id>.md`.

## Context Pack

context-packs/agent-studio-v9-task-drafts.md

## Scope

- Add API route to save selected draft as task file
- Add UI save action for each unsaved draft
- Prevent accidental overwrite
- Refresh saved task list after save

## Out of Scope

- No auto-save
- No auto Dev run
- No queue insertion
- No automatic validation
- No database
- No background jobs

## Acceptance Criteria

- Human can save one reviewed draft to `tasks/<task-id>.md`
- Existing files are not overwritten accidentally
- Saved task appears in Saved Tasks list
- Draft remains human-controlled
- No Dev execution is triggered

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v9-save-reviewed-task-drafts.md
```

## Dev Handoff

- Saving must stay human-triggered only.
- Reject overwrite when `tasks/<task-id>.md` already exists.
- Refresh the saved task list after a successful save.
