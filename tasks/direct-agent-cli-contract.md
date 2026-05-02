# Selected Task

## Task

direct-agent-cli-contract

## Status

done

## Objective

- Define the direct-agent CLI contract clearly for the current Agent Runner system without changing CLI behavior.

## Context Pack

- `context-packs/divya-runner-v6-direct-agent-interaction.md`

## Scope

- document how `--agent` works today
- show direct-agent examples for PM, Architect, Task Planner, QA, and Dev
- clarify that direct-agent execution stays single-agent and human-in-the-loop
- clarify that Dev should be run with `--task <task-file>` so it receives exactly one selected task
- keep wording consistent with the current runner, context builder, tool router, and MCP model

## Out of Scope

- no new flags
- no CLI behavior changes
- no agent chaining changes
- no automation
- no UI
- no async or background execution

## Acceptance Criteria

- The direct-agent contract is documented in repo source-of-truth files.
- Docs state that `run-agent <context-pack-file>` remains the primary contract.
- Docs state that `--agent <role>` is the direct single-agent path.
- Docs clarify that Dev should be run with `--task <task-file>`.
- Docs include concrete examples for direct-agent usage.
- No CLI logic or agent execution behavior changes are introduced.

## Verification

- `node ./bin/run-agent.js task validate tasks/direct-agent-cli-contract.md`
- `node ./bin/run-agent.js --help`
- `node ./bin/run-agent.js context-packs/divya-runner-v1.md --agent architect`
- `node ./bin/run-agent.js context-packs/divya-runner-v1.md --agent dev --task tasks/T1-verify-runner-contract.md`

## Dev Handoff

- Inspect:
  - `system/agent-runner.md`
  - `AGENTS.md`
  - `SYSTEM_STATUS.md`
  - `bin/run-agent.js`
  - `prompts/dev.md`
- Keep this work documentation-only unless the selected task explicitly expands scope later.
