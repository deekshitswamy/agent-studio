# Selected Task

## Task

agent-studio-v7-api-server-skeleton

## Status

done

## Objective

- Create the smallest local API server entry point needed to expose Agent Studio over local HTTP without changing existing CLI behavior.

## Context Pack

- `context-packs/agent-studio-v7-service-layer.md`

## Scope

- create a local API server entrypoint
- server should start and respond locally
- no business logic yet
- no agent execution yet

## Out of Scope

- no `/runs` implementation
- no `/agents` implementation
- no database
- no background jobs
- no UI
- no auth

## Acceptance Criteria

- API server file exists at `server/agent-service.js`
- server starts locally
- server responds to a basic request such as `GET /` and `GET /health`
- CLI runner remains unchanged
- no agent logic is implemented yet

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v7-api-server-skeleton.md
node ./bin/run-agent.js --help
node server/agent-service.js
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/
```

## Dev Handoff

- Inspect:
  - `context-packs/agent-studio-v7-service-layer.md`
  - `tasks/agent-studio-v7-api-server-skeleton.md`
  - `package.json`
  - `bin/run-agent.js`
- Keep this work limited to the local API server skeleton unless a later selected task explicitly adds routes or runner integration.
