# Context Pack: DIVYA Agent Runner v3 Task Quality Checks

## Goal

Add lightweight validation for task files before Dev execution.

## Scope

- Validate task markdown structure
- Check required task sections
- Warn on empty sections
- Keep validation read-only

## Feature

- CLI command:
  - `node ./bin/run-agent.js task validate <task-file>`

## Required Sections

- Task
- Status
- Objective
- Context Pack
- Scope
- Out of Scope
- Acceptance Criteria
- Verification
- Dev Handoff

## Non-goals

- No auto-fix
- No task execution
- No queue mutation
- No dependency resolution
- No priority scoring
- No UI
- No database

## Constraints

- Read-only validation
- File-based only
- Human-in-the-loop
- Preserve v1, v2, and v3 behavior
