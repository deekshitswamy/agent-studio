# Selected Task

## Task

agent-studio-v7-post-runs

## Status

done

## Objective

- Implement minimal `POST /runs` for the local Agent Studio API service by invoking the existing runner CLI.

## Context Pack

- `context-packs/agent-studio-v7-service-layer.md`

## Scope

- add `POST /runs`
- accept JSON body:
  - `contextPack`
  - `agent`
  - `llm`
  - `task`
  - `withArtifact`
- invoke existing runner CLI using child process
- capture stdout, stderr, and exit code
- write local run artifacts under `.local/runs/`
- return minimal run metadata

## Out of Scope

- no background jobs
- no async queue
- no database
- no auth
- no UI
- no chaining
- no rewriting Agent Studio internals

## Acceptance Criteria

- `POST /runs` requires `contextPack`
- `POST /runs` requires `agent`
- unsupported agents are rejected
- Dev runs require explicit `task`
- API invokes:
  - `node ./bin/run-agent.js <contextPack> --agent <agent>`
- `llm: true` adds `--llm`
- `task` adds `--task <task>`
- `withArtifact` adds `--with-artifact <artifact>`
- run metadata is saved as JSON under `.local/runs/`
- captured output is saved as `.log`
- response includes:
  - `id`
  - `agent`
  - `contextPack`
  - `status`
  - `exitCode`
  - `logId`
  - `startedAt`
  - `completedAt`
- existing CLI behavior remains unchanged

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v7-post-runs.md
node -c server/agent-service.js
node server/agent-service.js
curl -X POST http://127.0.0.1:3000/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v7-service-layer.md","agent":"pm"}'
curl -X POST http://127.0.0.1:3000/runs \
  -H "Content-Type: application/json" \
  -d '{"agent":"pm"}'
curl -X POST http://127.0.0.1:3000/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v7-service-layer.md"}'
curl -X POST http://127.0.0.1:3000/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v7-service-layer.md","agent":"dev"}'
```

## Dev Handoff

- Inspect:
  - `context-packs/agent-studio-v7-service-layer.md`
  - `tasks/agent-studio-v7-post-runs.md`
  - `server/agent-service.js`
  - `bin/run-agent.js`
- Keep the next API task bounded to one explicit route or one explicit runner-integration step.
