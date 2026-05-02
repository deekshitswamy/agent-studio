# Agent Studio v8 UI

Status: Local Prototype  
Mode: Human-in-the-loop

## Overview

Agent Studio v8 adds a minimal local browser UI on top of the existing v7 local API service.

The UI remains intentionally small. It is designed to:

- load supported agents
- submit one local run
- show returned run metadata
- fetch and display saved log output

The API server remains the backend entry point. The runner CLI remains the source-of-truth execution path underneath that API.

## How To Start

Start the local API server:

```bash
node server/agent-service.js
```

Default address:

- `http://127.0.0.1:3000`

Open the UI at:

- `http://127.0.0.1:3000/ui`

## Run Agent Flow

1. Start the local API server.
2. Open `http://127.0.0.1:3000/ui`.
3. Wait for the agent dropdown to load from `GET /agents`.
4. Enter the required context pack path.
5. Optionally enter:
   - task path
   - artifact path
6. Click `Run Agent`.
7. Review the returned run metadata in the result panel.

The run form submits to `POST /runs` with:

- `contextPack`
- `agent`
- `task` when provided
- `withArtifact` when provided

## Fetch Logs Flow

1. Copy the returned `logId` from the run result panel, or use a base run id directly.
2. Paste it into the `Log ID` field.
3. Click `Fetch Logs`.
4. Review the returned plain-text log output in the log panel.

The UI normalizes a returned `.log` suffix client-side so the existing `GET /logs/:id` API can be reused without backend changes.

## Example API Checks

Supported agents:

```bash
curl http://127.0.0.1:3000/agents
```

Start a run:

```bash
curl -X POST http://127.0.0.1:3000/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v8-ui.md","agent":"pm"}'
```

Fetch a log:

```bash
curl http://127.0.0.1:3000/logs/<run-id>
```

## Verification Performed

Verified on the local server:

- `GET /ui` returned the UI HTML
- `GET /agents` returned:
  - `pm`
  - `architect`
  - `task-planner`
  - `dev`
  - `qa`
- `POST /runs` completed successfully for:
  - `contextPack: "context-packs/agent-studio-v8-ui.md"`
  - `agent: "pm"`
- `GET /logs/:id` returned plain-text log content for the created run

UI wiring was also confirmed by inspection in `ui/index.html`:

- agent dropdown fetches `GET /agents`
- run form submits to `POST /runs`
- returned `logId` is reused for log fetch
- log panel fetches `GET /logs/:id`

## Current Limitations

- local only
- no auth
- no database
- no background jobs
- no streaming
- no polling
- no search
- no UI framework or build system
- no production deployment guidance

## Relationship To Existing Versions

- v7 provides the local API service
- v8 adds the minimal browser UI on top of that service
- the underlying `run-agent` CLI behavior is unchanged

## Source Of Truth

- `ui/index.html`
- `server/agent-service.js`
- `context-packs/agent-studio-v8-ui.md`
- `tasks/agent-studio-v8-final-doc-and-verification.md`
- `logs/`
