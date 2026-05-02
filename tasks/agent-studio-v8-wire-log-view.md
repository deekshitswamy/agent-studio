# Task: Wire Static Log View

## Task

- `agent-studio-v8-wire-log-view`

## Status

done

## Objective

Enable the UI to fetch and display static log content through the existing v7 API.

## Context Pack

context-packs/agent-studio-v8-ui.md

## Scope

- Wire log id input to `GET /logs/:id`
- Display plain text log content
- If run response includes `logId`, make it easy to fetch that log
- Display errors plainly

## Out of Scope

- No streaming
- No polling
- No log search
- No backend changes
- No UI redesign

## Acceptance Criteria

- User can enter log id and fetch logs
- Returned log text displays in log panel
- Missing log shows error
- Run response logId can be reused easily
- Existing run form still works

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v8-wire-log-view.md
node server/agent-service.js
# open http://127.0.0.1:3000/ui and test log fetch
```

## Dev Handoff

- Confirm the log input fetches plain text from `GET /logs/:id`.
- Reuse the returned `logId` without backend changes by normalizing the `.log` suffix in the UI.
- Keep the run form behavior unchanged.
