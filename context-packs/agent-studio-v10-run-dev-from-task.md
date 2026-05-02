# Context Pack: Agent Studio v10 Run Dev From Saved Task

## Goal

Allow a human to run Dev directly from a saved task in the Agent Studio UI.

## Scope

- Saved task list shows a Run Dev action
- User explicitly triggers Dev for one saved task
- UI sends POST /runs with:
  - agent: dev
  - task: selected task path
  - contextPack: chosen context pack
- Show run metadata and logs using existing v7/v8 behavior

## Non-goals

- No auto-run
- No queue automation
- No multi-task execution
- No background jobs
- No database
- No streaming
- No production deployment

## Constraints

- Human-in-the-loop
- One selected task per Dev run
- Reuse existing API
- Preserve Agent Runner behavior
