# Context Pack: DIVYA Agent Runner v3 Task Lifecycle

## Goal

Standardize how tasks are created, selected, executed, verified, and closed.

## Scope

- Improve task file template
- Define task lifecycle
- Document queue + Dev handoff flow
- Add clear operator workflow

## Features

- Stronger task template
- Task lifecycle documentation
- Clear rules for:
  - pending
  - in-progress
  - done
- Human-in-the-loop Dev execution flow

## Non-goals

- No auto execution
- No background worker
- No dependency resolver
- No priority scoring
- No UI
- No database
- No chain beyond current limits

## Constraints

- Documentation/templates only unless a tiny helper is clearly needed
- Preserve v1 and v2 behavior
- File-based only

## Implementation Note

This version introduces:

- a standardized task template
- documented lifecycle flow

No runtime behavior changes are introduced.
