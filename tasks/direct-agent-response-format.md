# Selected Task

## Task

direct-agent-response-format

## Status

done

## Objective

- Define a consistent, minimal, markdown-first response format for all direct agent executions without changing runner behavior.

## Context Pack

- `context-packs/divya-runner-v6-direct-agent-interaction.md`

## Scope

- document one shared direct-agent response structure
- keep the format markdown-first and human-readable
- allow light role-specific detail inside the shared structure
- add concise examples for PM, Architect, Task Planner, Dev, and QA
- keep changes limited to repo docs/process artifacts

## Out of Scope

- no JSON response protocol
- no strict machine schema
- no runner execution changes
- no CLI changes
- no chaining or orchestration changes
- no UI
- no automation

## Acceptance Criteria

- A shared direct-agent response format is documented.
- The format includes:
  - `Summary`
  - `Output`
  - `Next Action`
  - optional `Warnings`
- Role-specific examples exist for:
  - PM
  - Architect
  - Task Planner
  - Dev
  - QA
- Docs clearly state this does not introduce CLI, runner, chaining, or automation changes.

## Verification

- `node ./bin/run-agent.js task validate tasks/direct-agent-response-format.md`
- inspect `system/agent-runner.md` for the shared response format and examples
- inspect `SYSTEM_STATUS.md` for the top-level direct-agent status note

## Dev Handoff

- Inspect:
  - `system/agent-runner.md`
  - `SYSTEM_STATUS.md`
  - `prompts/pm.md`
  - `prompts/architect.md`
  - `prompts/task-planner.md`
  - `prompts/dev.md`
  - `prompts/qa.md`
- Keep this work documentation-only unless a future selected task explicitly expands scope.
