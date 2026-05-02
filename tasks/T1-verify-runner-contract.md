# Selected Task

## Task ID
- `T1-verify-runner-contract`

## Title
- Verify Runner Contract

## Goal
- Verify that `run-agent <context-pack-file>` remains the primary Agent Runner v1 contract.

## Dependencies
- current CLI entrypoint
- current runner implementation
- current repo source-of-truth docs

## In Scope
- inspect `bin/run-agent.js`
- inspect `src/agent-runner.js`
- inspect `AGENTS.md`
- inspect `system/agent-runner.md`
- inspect `context-packs/divya-runner-v1.md`
- confirm the context pack path is required
- confirm the context pack is the required runtime input
- confirm `idea.md` is not required
- confirm `AGENTS.md` and `system/agent-runner.md` are loaded
- run `node ./bin/run-agent.js context-packs/divya-runner-v1.md --execute`

## Acceptance Criteria
- CLI contract remains `run-agent <context-pack-file>`
- context pack is required at runtime
- `idea.md` is optional supporting material only
- `AGENTS.md` and `system/agent-runner.md` are loaded
- verification notes are recorded
- no code changes unless a mismatch is found

## Out Of Scope
- adding new features
- changing chain behavior
- adding UI, API, or async behavior
- refactoring unrelated runner logic

## Verification Commands
- `node ./bin/run-agent.js context-packs/divya-runner-v1.md --execute`
