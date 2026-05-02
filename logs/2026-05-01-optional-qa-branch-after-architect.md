# Optional QA Branch After Architect

## Objective
- Add an explicit bounded QA branch so chain step 4 can be either `Task Planner` or `QA`.

## Changes
- Added CLI support for `--qa` as an explicit chain-4 selector.
- Kept default `--chain 4` behavior as `Orchestrator -> PM -> Architect -> Task Planner`.
- Added alternate `--chain 4 --qa` behavior as `Orchestrator -> PM -> Architect -> QA`.
- Passed the Architect artifact into the QA branch as supporting context.
- Updated workflow and state docs to record QA as an alternate bounded step 4, not a fifth chained role.

## Files Changed
- `bin/run-agent.js`
- `src/agent-runner.js`
- `system/agent-runner.md`
- `state/divya-runner-v1.md`

## Verification
- Run default chain 4 and confirm final step is `task-planner`.
- Run QA chain 4 and confirm final step is `qa`.
- Confirm neither path executes `QA -> Task Planner` in the same run.

## Notes
- Direct QA execution with `--agent qa` remains unchanged.
- `--qa` is only valid with `--execute --chain 4`.
