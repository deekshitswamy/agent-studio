# Title

Inspect existing UI, API, and task-file boundaries for task draft implementation

## Goal

Identify the smallest existing UI and server/API surfaces needed to implement Agent Studio v9 task drafts without changing Agent Runner execution behavior.

## Dependencies

- Context Pack: Agent Studio v9 Task Drafts

## Acceptance Criteria

- Confirm where the UI currently displays agent run output.
- Confirm whether Task Planner role/run metadata is available.
- Confirm how the UI communicates with the local API.
- Confirm whether task listing or write behavior exists.
- Confirm structure of valid task file.
- Record findings in logs.

## Out of Scope

- No implementation
- No parser
- No UI changes
- No task saving
