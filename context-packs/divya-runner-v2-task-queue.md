# Context Pack: DIVYA Agent Runner v2 Task Queue

## Goal

Add minimal task queue and status tracking to Agent Runner.

## Scope

- Track task files in a simple state file
- List tasks
- Mark one task as in-progress
- Mark one task as done

## Features

- `tasks.json` as source of truth
- CLI support for:
  - list tasks
  - start task
  - complete task

## Non-goals

- No automation loop
- No auto task execution
- No priority scoring
- No dependency resolver
- No UI
- No database

## Constraints

- Minimal implementation
- File-based only
- Human-in-the-loop
- Preserve Agent Runner v1 behavior
