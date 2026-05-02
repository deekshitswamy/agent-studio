# Direct Agent CLI Contract

## Execution
- Title: Direct agent CLI contract documentation
- Date: 2026-05-02
- Primary Agent: Dev

## Goal
- Document the current direct-agent CLI contract clearly without changing runner behavior.

## Changes Made
- Updated the selected task file to the current validated task format and marked it done.
- Added a direct-agent CLI contract section to `system/agent-runner.md`.
- Added a concise direct-agent summary to `SYSTEM_STATUS.md`.

## Files Changed
- `tasks/direct-agent-cli-contract.md`
- `system/agent-runner.md`
- `SYSTEM_STATUS.md`
- `logs/2026-05-02-direct-agent-cli-contract.md`

## Verification
- `node ./bin/run-agent.js task validate tasks/direct-agent-cli-contract.md`
- `node ./bin/run-agent.js --help`
- `node ./bin/run-agent.js context-packs/divya-runner-v1.md --agent architect`
- `node ./bin/run-agent.js context-packs/divya-runner-v1.md --agent dev --task tasks/T1-verify-runner-contract.md`

## Open Questions
- Whether a future v6 milestone should add a dedicated release note for direct-agent interaction, if the repo later treats it as a formal versioned capability.

## Next Suggested Execution
- Keep the next direct-agent improvement bounded to documentation or prompt clarity unless a human explicitly selects a code-facing task.
