# Selected Task

## Task

direct-agent-dev-task-guardrails

## Status

done

## Objective

- Document that direct Dev execution must stay tied to exactly one explicit human-selected task file.

## Context Pack

- `context-packs/divya-runner-v6-direct-agent-interaction.md`

## Scope

- document Dev direct execution guardrails
- clarify that Dev should use `--task <task-file>`
- clarify that Dev should not pick tasks automatically from `tasks/` or `tasks.json`
- clarify that Dev should not bundle multiple tasks into one run
- keep changes limited to docs and prompts

## Out of Scope

- no auto task selection
- no queue automation
- no chain changes
- no CLI behavior changes unless already present
- no UI
- no background jobs

## Acceptance Criteria

- Docs clearly say Dev should be run with exactly one selected task file.
- Dev flow preserves:
  - human task selection
  - one task per Dev run
  - no automatic task pickup
  - no multi-task bundling
- Missing-task guidance is clear in docs or prompt guardrails.
- Existing runner behavior remains unchanged.

## Verification

- `node ./bin/run-agent.js task validate tasks/direct-agent-dev-task-guardrails.md`

## Dev Handoff

- Inspect:
  - `system/agent-runner.md`
  - `prompts/dev.md`
  - `SYSTEM_STATUS.md`
- Keep this work documentation/prompt-only unless a future selected task explicitly calls for CLI enforcement changes.
