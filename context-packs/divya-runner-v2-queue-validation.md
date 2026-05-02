# Context Pack: DIVYA Agent Runner v2 Queue Validation

## Goal

Add read-only validation for the task queue.

## Scope

- Validate `tasks.json`
- Check task file references
- Detect duplicate IDs
- Detect invalid statuses

## Feature

- CLI command:
  - `node ./bin/run-agent.js queue validate`

## Non-goals

- No auto-fix
- No task execution
- No automation loop
- No dependency resolution
- No priority system
- No UI
- No database

## Constraints

- Read-only validation
- File-based only
- Human-in-the-loop
- Preserve v1 and v2 behavior
