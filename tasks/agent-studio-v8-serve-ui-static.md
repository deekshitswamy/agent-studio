# Task: Serve UI Static Files Locally

## Task

- `agent-studio-v8-serve-ui-static`

## Status

done

## Objective

Serve the local UI from the existing Agent Studio API server to avoid file:// CORS issues.

## Context Pack

context-packs/agent-studio-v8-ui.md

## Scope

- Serve `ui/index.html` from the API server
- Add route such as `GET /ui` or serve `/ui/`
- Preserve existing API endpoints

## Out of Scope

- No framework
- No build system
- No auth
- No database
- No production static hosting
- No UI redesign

## Acceptance Criteria

- `GET /ui` or `/ui/` serves the UI HTML
- Existing endpoints still work:
  - `/`
  - `/health`
  - `/agents`
  - `/runs`
  - `/logs/:id`
- No Agent Runner behavior changes

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v8-serve-ui-static.md
node -c server/agent-service.js
node server/agent-service.js
curl http://127.0.0.1:3000/ui
```

## Dev Handoff

- Confirm `GET /ui` serves `ui/index.html`.
- Confirm `/health` and `/agents` still respond after the route addition.
- Keep static serving limited to the existing UI entry point only.
