# Selected Task

## Task

agent-studio-v7-api-docs

## Status

done

## Objective

- Document how to start and use the Agent Studio local API service.

## Context Pack

- `context-packs/agent-studio-v7-service-layer.md`

## Scope

- document the server start command
- document supported endpoints
- add example `curl` requests
- document current limitations
- keep the work release-doc focused

## Out of Scope

- no code changes
- no UI docs
- no deployment guide
- no auth docs

## Acceptance Criteria

- docs explain how to start the server
- docs include:
  - `GET /agents`
  - `POST /runs`
  - `GET /runs/:id`
  - `GET /logs/:id`
- docs include example requests
- docs state:
  - local-only
  - no auth
  - no database
  - no background jobs
  - no UI
- existing behavior remains unchanged

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v7-api-docs.md
```

## Dev Handoff

- Inspect:
  - `tasks/agent-studio-v7-api-docs.md`
  - `context-packs/agent-studio-v7-service-layer.md`
  - `package.json`
  - `releases/`
- Keep follow-up work documentation-only unless a later selected task explicitly requests server or CLI changes.
