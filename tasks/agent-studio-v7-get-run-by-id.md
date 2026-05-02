# Selected Task

## Task

agent-studio-v7-get-run-by-id

## Status

done

## Objective

- Return metadata for a previously started local API run.

## Context Pack

- `context-packs/agent-studio-v7-service-layer.md`

## Scope

- add `GET /runs/:id`
- read metadata from `.local/runs/<id>.json`
- return JSON metadata
- return `404` for unknown run IDs

## Out of Scope

- no database
- no search or list runs
- no retry behavior
- no background polling
- no log output here

## Acceptance Criteria

- known run ID returns metadata JSON
- unknown run ID returns `404`
- endpoint reads only `.local/runs/<id>.json`
- existing endpoints still work
- existing CLI behavior remains unchanged

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v7-get-run-by-id.md
node -c server/agent-service.js
node server/agent-service.js
curl http://127.0.0.1:3000/runs/<id>
curl -i http://127.0.0.1:3000/runs/<missing-id>
```

## Dev Handoff

- Inspect:
  - `context-packs/agent-studio-v7-service-layer.md`
  - `tasks/agent-studio-v7-get-run-by-id.md`
  - `server/agent-service.js`
- Keep the next API task bounded to one explicit read endpoint or one explicit write endpoint.
