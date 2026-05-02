# Context Pack: Agent Studio v9 Task Drafts

## Goal

Show Task Planner output as task drafts in the UI and allow human-reviewed saving to task files.

## Scope

- Detect Task Planner run output
- Extract proposed task blocks where possible
- Show task drafts in UI
- Let human save selected task draft to `tasks/<task-id>.md`
- Show existing task files in UI

## Non-goals

- No auto-execution
- No automatic Dev runs
- No background jobs
- No database
- No complex parser
- No task dependency management

## Constraints

- Human-in-the-loop
- File-based only
- Keep task validation available
- Preserve existing Agent Runner/API behavior
