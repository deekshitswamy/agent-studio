# Task Selection Workflow Support

## Objective
- Standardize task-file handoff so humans can pick one Task Planner output file and run Dev directly.

## Changes
- Updated workflow docs to describe the human-in-the-loop task selection flow.
- Updated the Task Planner prompt to standardize `tasks/<task-id>.md`.
- Added an example selected task file:
  - `tasks/T1-verify-runner-contract.md`

## Human-In-The-Loop Flow
1. Run Task Planner.
2. Save or pick one task file under `tasks/<task-id>.md`.
3. Run Dev on that one task:
   - `node ./bin/run-agent.js <context-pack> --agent dev --llm --task <task-file>`

## Notes
- No automation loop was added.
- No task auto-execution was added.
- No runner code changes were required.
