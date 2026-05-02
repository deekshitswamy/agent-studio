# Task: Verify Task Draft Workflow

## Task

- `agent-studio-v9-final-qa-doc-check`

## Status

- `done`

## Objective

Verify and document the Agent Studio v9 task draft workflow.

## Context Pack

context-packs/agent-studio-v9-task-drafts.md

## Scope

- Verify saved tasks list
- Verify Task Planner source detection
- Verify draft extraction
- Verify reviewed draft saving
- Document v9 workflow

## Out of Scope

- No new features
- No UI redesign
- No auto Dev execution
- No queue insertion
- No database
- No background jobs

## Acceptance Criteria

- Existing `tasks/*.md` files are visible in UI
- Task Planner output can become unsaved editable drafts
- Human can save reviewed draft to `tasks/<task-id>.md`
- Existing task files are not overwritten accidentally
- No Dev task is auto-selected or auto-executed
- Release note exists for v9

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v9-final-qa-doc-check.md
```

## Dev Handoff

- Verify the v9 task-draft workflow end-to-end without changing UI or server behavior.
- Create the v9 release note and record the QA/documentation check in a dev log.
