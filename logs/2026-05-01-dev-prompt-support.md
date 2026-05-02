# Dev Prompt Support

## Objective
- Add a direct-agent Dev prompt that converts one selected task into a safe Codex-ready implementation prompt.

## Changes
- Added `prompts/dev.md`.

## Notes
- No runner code changes were required because direct-agent execution already resolves roles from `prompts/<agent>.md`.
- Dev remains direct-agent only.
- No chain changes were added.

## Verification
- Run `node ./bin/run-agent.js context-packs/divya-runner-v1.md --agent dev --llm`
- Confirm the runner resolves `prompts/dev.md` and returns structured Dev output.
