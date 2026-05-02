# Add Queue Validate Command

## Execution
- Title: Add Queue Validate Command
- Date: 2026-05-02
- Primary Agent: Dev

## Goal
- Add a read-only queue validation command for `tasks.json` without changing existing queue behavior or task execution behavior.

## Changes Made
- Added `queue validate` support to the CLI.
- Added queue validation logic for:
  - `tasks.json` existence
  - root `tasks` array
  - required `id`, `file`, `status`
  - allowed statuses
  - duplicate task IDs
  - referenced task file existence
- Kept validation read-only.
- Added a short workflow note for queue validation.

## Files Changed
- `bin/run-agent.js`
- `src/task-queue.js`
- `system/agent-runner.md`

## Verification
- `shasum tasks.json`
- `node ./bin/run-agent.js queue validate`
- `shasum tasks.json`
- `node ./bin/run-agent.js queue list`
- `node ./bin/run-agent.js context-packs/divya-runner-v1.md --execute`

## Open Questions
- Should future queue validation also report task files that exist but are empty as warnings?

## Next Suggested Execution
- If v2 queue work continues, consider documenting queue validation in the v2 release note and deciding whether warnings should cover empty task files.
