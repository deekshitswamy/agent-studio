# Add Minimal Agent Runner Task Queue

## Execution
- Title: Add Minimal Agent Runner Task Queue
- Date: 2026-05-01
- Primary Agent: Dev

## Goal
- Add a minimal file-based queue state layer using `tasks.json` plus explicit CLI commands to list tasks, start one task, and complete one task, while preserving existing Agent Runner v1 behavior.

## Changes Made
- Added repo-root `tasks.json` with minimal task records using `id`, `file`, and `status`.
- Added `src/task-queue.js` for synchronous queue read/write and validation.
- Added explicit `run-agent queue list|start|complete` handling in `bin/run-agent.js`.
- Filled the selected task file `tasks/add-minimal-agent-runner-task-queue.md` from the Task Planner output.
- Added a short v2 queue note to `system/agent-runner.md`.

## Files Changed
- `bin/run-agent.js`
- `src/task-queue.js`
- `tasks.json`
- `tasks/add-minimal-agent-runner-task-queue.md`
- `system/agent-runner.md`

## Verification
- `node ./bin/run-agent.js queue list`
- `node ./bin/run-agent.js queue start add-minimal-agent-runner-task-queue`
- `node ./bin/run-agent.js queue complete add-minimal-agent-runner-task-queue`
- `node ./bin/run-agent.js context-packs/divya-runner-v1.md --execute`

## Open Questions
- Should future v2 work keep queue commands as a subcommand form only, or also support flags later?

## Next Suggested Execution
- If v2 queue behavior is accepted, create a follow-up task to tighten queue documentation and decide whether queue state should stay separate from task file selection forever.
