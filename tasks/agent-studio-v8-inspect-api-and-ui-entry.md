# Selected Task

## Task

agent-studio-v8-inspect-api-and-ui-entry

## Status

done

## Objective

- Inspect the current v7 API contracts and identify the smallest repo-consistent UI entry point without building the UI or changing backend behavior.

## Context Pack

- `context-packs/agent-studio-v8-ui.md`

## Scope

- inspect the concrete v7 API shapes for:
  - `GET /agents`
  - `POST /runs`
  - `GET /logs/:id`
- determine whether a frontend or static UI location already exists
- recommend the smallest repo-consistent UI entry point if none exists
- record API mismatch risks or blockers
- keep the work inspection-only

## Out of Scope

- no UI implementation
- no backend or API changes
- no auth
- no database
- no production deployment
- no streaming, polling, or multi-user behavior

## Acceptance Criteria

- files inspected are recorded
- request/response shape is recorded for:
  - `GET /agents`
  - `POST /runs`
  - `GET /logs/:id`
- existing frontend/static location is confirmed or ruled out
- a minimal UI entry-point recommendation is recorded
- API mismatch risks or blockers are recorded
- dev log is updated with findings

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v8-inspect-api-and-ui-entry.md
```

## Dev Handoff

- Inspect:
  - `context-packs/agent-studio-v8-ui.md`
  - `tasks/agent-studio-v8-inspect-api-and-ui-entry.md`
  - `server/agent-service.js`
  - `package.json`
  - top-level repo structure for any existing frontend/static directories
- Keep any next step bounded to one selected UI task and do not change backend behavior unless explicitly requested.
