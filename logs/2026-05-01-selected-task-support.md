# Selected Task Support

## Objective
- Allow direct Dev execution to receive exactly one selected task file.

## Changes
- Added CLI flag support for `--task <task-file>`.
- Added Dev-only task file loading in the runner.
- Included task content under `Selected Task` in the direct Dev LLM payload.
- Added clear CLI warning when `--agent dev` is used without `--task`.
- Added an example task file at `tasks/example-task.md`.

## Files Changed
- `bin/run-agent.js`
- `src/agent-runner.js`
- `tasks/example-task.md`

## Verification
- Run `node ./bin/run-agent.js context-packs/divya-runner-v1.md --agent dev --llm --task tasks/example-task.md`
- Confirm the Dev run resolves `prompts/dev.md`, records `task_file`, and reasons only from the selected task plus repo context.
