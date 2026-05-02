# Dev Log

## Execution
- Title: Direct agent execution mode
- Date: 2026-05-01
- Primary Agent: Codex

## Goal
- Add a direct single-agent execution path so a specific prompt can run against a context pack without orchestrator-first behavior or multi-agent chaining.

## Changes Made
- Added `--agent <agent-name>` CLI parsing.
- Added a direct execution path that reads the context pack, `AGENTS.md`, `system/agent-runner.md`, and `/prompts/<agent>.md`.
- Kept mock execution as the default for direct-agent runs unless `--llm` is passed.
- Added a clearer missing-prompt error for unknown agent names.

## Files Changed
- `/Users/deekshitswamy/Documents/GitHub/Agent Runner/bin/run-agent.js`
- `/Users/deekshitswamy/Documents/GitHub/Agent Runner/src/agent-runner.js`
- `/Users/deekshitswamy/Documents/GitHub/Agent Runner/logs/2026-05-01-direct-agent-mode.md`

## Verification
- Run `node ./bin/run-agent.js context-packs/divya-runner-v1.md --agent architect`.
- Run `node ./bin/run-agent.js context-packs/divya-runner-v1.md --agent architect --llm`.
- Confirm the direct-agent path writes execution output and a combined run log without creating an orchestrator log.

## Open Questions
- Whether future versions should expose a deliberate `--agent pm` review flow before allowing `--agent architect` in normal operator usage.

## Next Suggested Execution
- Validate the direct Architect prompt with a real `OPENAI_API_KEY` visible to the current shell.
