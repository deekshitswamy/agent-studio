# Add Task Validate Command

## Execution
- Title: Add Task Validate Command
- Date: 2026-05-02
- Primary Agent: Dev

## Goal
- Add a read-only task file validation command before Dev execution.

## Changes Made
- Added `task validate` support to the CLI.
- Added task file validation logic for:
  - file existence
  - required sections
  - non-empty required sections
- Kept validation read-only.
- Added a short workflow note for task validation.

## Files Changed
- `bin/run-agent.js`
- `src/task-file.js`
- `system/agent-runner.md`

## Verification
- `shasum tasks/T1-verify-runner-contract.md`
- `shasum tasks.json`
- `node ./bin/run-agent.js task validate tasks/T1-verify-runner-contract.md`
- `shasum tasks/T1-verify-runner-contract.md`
- `shasum tasks.json`
- `node ./bin/run-agent.js queue list`
- `node ./bin/run-agent.js context-packs/divya-runner-v1.md --execute`

## Open Questions
- Should future task validation warn on unexpected section names or task files that still use older formats?

## Next Suggested Execution
- If v3 lifecycle work continues, update the task template so new task files pass `task validate` by default.
