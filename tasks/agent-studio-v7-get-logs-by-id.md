# Selected Task

## Task

agent-studio-v7-get-logs-by-id

## Status

done

## Objective

- Return captured output logs for a known local API run.

## Context Pack

- `context-packs/agent-studio-v7-service-layer.md`

## Scope

- add `GET /logs/:id`
- read `.local/runs/<id>.log`
- return log content
- return `404` for unknown log IDs

## Out of Scope

- no log streaming
- no log search
- no external logging
- no database
- no UI

## Acceptance Criteria

- known log ID returns log content
- unknown log ID returns `404`
- endpoint reads only `.local/runs/<id>.log`
- existing endpoints still work
- existing CLI behavior remains unchanged

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v7-get-logs-by-id.md
node -c server/agent-service.js
node server/agent-service.js
curl http://127.0.0.1:3000/logs/<id>
curl -i http://127.0.0.1:3000/logs/<missing-id>
```

## Dev Handoff

- Inspect:
  - `context-packs/agent-studio-v7-service-layer.md`
  - `tasks/agent-studio-v7-get-logs-by-id.md`
  - `server/agent-service.js`
- Keep the next API task bounded to one explicit endpoint without adding search, listing, or streaming.
