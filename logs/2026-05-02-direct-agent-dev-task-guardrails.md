# Direct Agent Dev Task Guardrails

## Execution
- Title: Direct Dev task guardrails documentation
- Date: 2026-05-02
- Primary Agent: Dev

## Goal
- Tighten the direct Dev task-selection guardrails in docs and prompts without changing runner behavior.

## Changes Made
- Updated the selected task file to the current validated task format and marked it done.
- Clarified in `system/agent-runner.md` that Dev should not auto-pick from `tasks/` or `tasks.json`.
- Clarified in `prompts/dev.md` that missing-task runs should stop and surface the guardrail unless intentionally bounded as a non-coding check.
- Added a short status note in `SYSTEM_STATUS.md`.

## Files Changed
- `tasks/direct-agent-dev-task-guardrails.md`
- `system/agent-runner.md`
- `prompts/dev.md`
- `SYSTEM_STATUS.md`
- `logs/2026-05-02-direct-agent-dev-task-guardrails.md`

## Verification
- `node ./bin/run-agent.js task validate tasks/direct-agent-dev-task-guardrails.md`

## Open Questions
- Whether a future selected task should convert the existing Dev missing-task warning into stronger CLI enforcement.

## Next Suggested Execution
- Keep any next direct-agent Dev improvement bounded to docs/prompt clarity unless a future selected task explicitly requests CLI behavior changes.
