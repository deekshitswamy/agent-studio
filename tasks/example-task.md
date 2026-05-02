# Selected Task

## Title
- Verify the primary CLI contract for Agent Runner v1.

## Goal
- Confirm `run-agent <context-pack-file>` reads the provided context pack and does not require `idea.md`.

## In Scope
- inspect the current CLI entrypoint
- inspect the runner file-loading path
- verify the context pack is required
- verify `idea.md` remains optional supporting material only
- make only minimal fixes if a contract mismatch is found

## Out Of Scope
- adding new chain steps
- adding UI, API, or async behavior
- refactoring unrelated runner logic
- expanding Dev execution into multiple tasks

## Verification
- run `node ./bin/run-agent.js context-packs/divya-runner-v1.md --execute`
- confirm the run produces structured output
- confirm repo source-of-truth files are loaded
