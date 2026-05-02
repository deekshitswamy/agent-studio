# Run Dev From Saved Task

## Task

Run Dev From Saved Task

## Status

pending

## Objective

Add a human-triggered Run Dev action for each saved task in the Agent Studio UI.

## Context Pack

context-packs/agent-studio-v10-run-dev-from-task.md

## Scope

- Add Run Dev button/action for each saved task
- Use existing POST /runs
- Send exactly one selected task path
- Include selected context pack

## Out of Scope

- No auto-run
- No queue automation
- No multi-task execution
- No background jobs
- No database
- No Agent Runner behavior changes

## Acceptance Criteria

- Saved task rows show Run Dev
- Clicking Run Dev sends agent=dev
- Clicking Run Dev sends exactly one task path
- Context pack is required
- Run metadata displays
- Logs can still be fetched

## Verification

Run task validation.
Manually test Run Dev from one saved task.

## Dev Handoff

Inspect ui/index.html and server/agent-service.js.
Reuse existing POST /runs.
Do not add new API endpoints.
