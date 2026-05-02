# Agent Studio v17 Project Runner Sandbox

Status: Local Prototype  
Mode: Human-in-the-loop

## Purpose

Agent Studio v17 adds the smallest Docker-based project runner sandbox for project-scoped execution.

The goal is narrow:

- keep legacy non-project runs working exactly as they do today
- run project-scoped work in a short-lived Docker runner container
- preserve the existing API contract and UI behavior
- keep the system local-first and human-triggered

This is not a production isolation system. It is a lightweight local execution boundary for project-scoped runs.

## Execution Behavior

### No Project Selected

If `project` is not provided to `POST /runs`:

- the API keeps the existing local `spawnSync` execution path
- artifacts still write to `.local/runs/`
- existing UI and CLI behavior stays unchanged

### Project Selected

If `project` is provided to `POST /runs`:

- the API executes the run through:

```bash
docker compose run --rm -T agent-studio-project-runner ...
```

- artifacts still write to:

```text
projects/<project-id>/.local/runs/
```

- returned metadata still uses the same API shape and includes `project`

## Docker Compose Service Summary

The v17 runner adds a second service in `docker-compose.yml`:

- `agent-studio`
  - existing API/UI container
  - exposes port `3000`
  - runs `node server/agent-service.js`
- `agent-studio-project-runner`
  - short-lived execution container
  - uses the same image as `agent-studio`
  - exposes no ports
  - uses:

```text
node ./bin/run-agent.js ...
```

The API service triggers the runner only for project-scoped runs.

## Mount Strategy

The current project-runner execution path mounts:

- repo root read-only:

```text
/workspace
```

- selected project read-write:

```text
/workspace/projects/<project-id>
```

- `logs/` read-write as a narrow compatibility exception

This preserves the existing file-based behavior while limiting write access compared with the full API container mount.

## Current Compatibility Exception

The runner still needs write access to:

```text
logs/
```

Reason:

- current tool-audit behavior writes `logs/tool-router-audit.jsonl`
- the existing runner and tool-router behavior were preserved intentionally in v17

So the current project-runner mount model is:

- repo root read-only
- selected project read-write
- `logs/` read-write

This is a compatibility compromise, not a final hardening model.

## Verification Commands

Task validation:

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v17-project-runner-execution.md
```

Server and compose checks:

```bash
node -c server/agent-service.js
docker compose config
```

Start the API service:

```bash
PORT=3012 node server/agent-service.js
```

Legacy non-project run:

```bash
curl -X POST http://127.0.0.1:3012/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v10-run-dev-from-task.md","agent":"pm"}'
```

Project-scoped run:

```bash
curl -X POST http://127.0.0.1:3012/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v10-run-dev-from-task.md","agent":"pm","project":"agent-studio"}'
```

Read artifacts back:

```bash
curl http://127.0.0.1:3012/runs/<run-id>
curl 'http://127.0.0.1:3012/runs/<run-id>?project=agent-studio'
curl http://127.0.0.1:3012/logs/<run-id>
curl 'http://127.0.0.1:3012/logs/<run-id>?project=agent-studio'
```

## Current Limitations

- no concurrency control
- no queue
- no resource limits
- no project creation flow
- no migration
- no database
- no auth
- no multi-user support
- no production isolation guarantees
- no Docker socket inside a container
- no background jobs

## Recommended Next Hardening Steps

The safest next follow-ups are:

- move tool-audit output out of top-level `logs/` for project-runner executions so the `logs/` compatibility exception can be removed
- add a clearer project-runner execution record in run metadata or dev logs for operator debugging
- evaluate narrow resource limits only after the current local workflow is stable
- document Docker/host prerequisites explicitly in the main operator docs

## Relationship To Existing Versions

- v13 adds project-scoped tasks, runs, and logs
- v16 adds Dockerized local API/UI execution
- v17 adds a short-lived Docker runner for project-scoped runs while preserving legacy local execution for non-project runs

## Source Of Truth

- `docker-compose.yml`
- `Dockerfile`
- `server/agent-service.js`
- `tasks/agent-studio-v17-project-runner-execution.md`
- `logs/2026-05-03-agent-studio-v17-project-runner-execution.md`
