# Agent Studio v7 Local API Service

Status: Local Prototype  
Mode: Human-in-the-loop

## Overview

Agent Studio v7 adds a minimal local HTTP service layer on top of the existing CLI workflow.

The service is local-only and intentionally thin. It exposes a small set of endpoints for direct-agent discovery and local run access while preserving the existing `run-agent` CLI behavior.

## How To Start

Default:

```bash
node server/agent-service.js
```

Custom port:

```bash
PORT=3010 node server/agent-service.js
```

Default address:

- `http://127.0.0.1:3000`

## Endpoints

### `GET /agents`

Returns the supported direct-agent roles.

Example:

```bash
curl http://127.0.0.1:3000/agents
```

Response:

```json
{
  "agents": ["pm", "architect", "task-planner", "dev", "qa"]
}
```

### `POST /runs`

Starts one local Agent Studio execution by invoking the existing runner CLI.

Supported request fields:

- `contextPack` required
- `agent` required
- `llm` optional boolean
- `task` optional string, but required when `agent` is `dev`
- `withArtifact` optional string

Example:

```bash
curl -X POST http://127.0.0.1:3000/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v7-service-layer.md","agent":"pm"}'
```

Typical response:

```json
{
  "id": "2026-05-02T08-29-36-887Z-26516",
  "agent": "pm",
  "contextPack": "context-packs/agent-studio-v7-service-layer.md",
  "status": "completed",
  "exitCode": 0,
  "logId": "2026-05-02T08-29-36-887Z-26516.log",
  "startedAt": "2026-05-02T08:29:36.887Z",
  "completedAt": "2026-05-02T08:29:36.959Z"
}
```

### `GET /runs/:id`

Returns saved metadata for a known run from:

- `.local/runs/<id>.json`

Example:

```bash
curl http://127.0.0.1:3000/runs/2026-05-02T08-29-36-887Z-26516
```

Unknown IDs return `404`.

### `GET /logs/:id`

Returns saved log content for a known run from:

- `.local/runs/<id>.log`

Example:

```bash
curl http://127.0.0.1:3000/logs/2026-05-02T08-29-36-887Z-26516
```

Unknown IDs return `404`.

## Local Artifact Paths

The current API writes and reads local artifacts only under:

- `.local/runs/<id>.json`
- `.local/runs/<id>.log`

## Current Limitations

- local-only
- no auth
- no database
- no background jobs
- no UI
- no run listing or search endpoint
- no log streaming
- no deployment or production service guidance yet

## Relationship To The CLI

- the CLI remains the source-of-truth execution path
- `POST /runs` reuses the existing runner rather than replacing it
- direct CLI usage still works as before

## Source Of Truth

- `server/agent-service.js`
- `context-packs/agent-studio-v7-service-layer.md`
- `tasks/agent-studio-v7-api-docs.md`
- `logs/`
