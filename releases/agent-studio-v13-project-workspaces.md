# Agent Studio v13 Project Workspaces

Status: Local Prototype  
Mode: Human-in-the-loop

## Purpose

Agent Studio v13 adds a lightweight project workspace layer so tasks, saved drafts, runs, and logs can be organized by project without introducing a database or changing the core runner contract.

The goal is small and local-first:

- keep legacy top-level behavior working
- allow optional project scoping when the operator selects a project id
- keep all actions explicitly human-triggered

## Folder Structure

Project-scoped files now use:

```text
projects/<project-id>/
  tasks/
  .local/runs/
```

Current v13 usage:

- `projects/<project-id>/tasks/`
- `projects/<project-id>/.local/runs/`

Legacy top-level paths still exist and still work:

- `tasks/`
- `.local/runs/`

## API Behavior

### `GET /tasks`

- without `project`:
  - reads from `tasks/`
- with `?project=<project-id>`:
  - reads from `projects/<project-id>/tasks/`

Example:

```bash
curl http://127.0.0.1:3000/tasks
curl 'http://127.0.0.1:3000/tasks?project=agent-studio'
```

### `POST /tasks`

- without `project`:
  - saves to `tasks/<task-id>.md`
- with `project`:
  - saves to `projects/<project-id>/tasks/<task-id>.md`

Overwrite protection applies in both scopes.

Example:

```bash
curl -X POST http://127.0.0.1:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"taskId":"example-task","title":"Example Task","body":"Reviewed draft body","contextPack":"context-packs/agent-studio-v10-run-dev-from-task.md"}'

curl -X POST http://127.0.0.1:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"taskId":"example-task","title":"Example Task","body":"Reviewed draft body","contextPack":"context-packs/agent-studio-v10-run-dev-from-task.md","project":"agent-studio"}'
```

### `POST /runs`

- without `project`:
  - writes run artifacts to `.local/runs/`
- with `project`:
  - writes run artifacts to `projects/<project-id>/.local/runs/`

Scoped run metadata now includes `project` when present.

Example:

```bash
curl -X POST http://127.0.0.1:3000/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v10-run-dev-from-task.md","agent":"pm"}'

curl -X POST http://127.0.0.1:3000/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v10-run-dev-from-task.md","agent":"pm","project":"agent-studio"}'
```

### `GET /runs/:id`

- without `project`:
  - reads from `.local/runs/`
- with `?project=<project-id>`:
  - reads from `projects/<project-id>/.local/runs/`

Example:

```bash
curl http://127.0.0.1:3000/runs/<run-id>
curl 'http://127.0.0.1:3000/runs/<run-id>?project=agent-studio'
```

### `GET /logs/:id`

- without `project`:
  - reads from `.local/runs/`
- with `?project=<project-id>`:
  - reads from `projects/<project-id>/.local/runs/`

Example:

```bash
curl http://127.0.0.1:3000/logs/<run-id>
curl 'http://127.0.0.1:3000/logs/<run-id>?project=agent-studio'
```

### `GET /runs/:id/task-planner-source`

- without `project`:
  - reads from the legacy global run path
- with `?project=<project-id>`:
  - reads from the project-scoped run path

This keeps Task Planner source detection working when the UI is operating inside a selected project.

Example:

```bash
curl http://127.0.0.1:3000/runs/<run-id>/task-planner-source
curl 'http://127.0.0.1:3000/runs/<run-id>/task-planner-source?project=agent-studio'
```

## Legacy Fallback

When no project is selected:

- task listing stays in `tasks/`
- task saving stays in `tasks/`
- run artifacts stay in `.local/runs/`
- run metadata and logs are read from `.local/runs/`

This preserves the original single-project behavior and avoids migration pressure.

## UI Behavior

The UI now includes a simple `Project ID` field.

When the field is empty:

- the UI uses legacy top-level behavior

When the field is filled:

- Saved Tasks reads from `projects/<project-id>/tasks/`
- reviewed draft saving writes to `projects/<project-id>/tasks/`
- runs are created in `projects/<project-id>/.local/runs/`
- log fetches and Task Planner source fetches use the same selected project

The workflow remains human-controlled:

- no auto-save
- no auto-run Dev
- no project auto-detection

## Current Limitations

- no project creation flow
- no migration of existing top-level files
- no database
- no auth
- no multi-user support
- no run list endpoint
- no background jobs

## Relationship To Existing Versions

- v7 adds the local API service
- v8 adds the local browser UI
- v9 adds task-draft detection, review, and explicit save
- v10 adds direct Dev execution from saved tasks
- v12 adds guided workflow hints in the UI
- v13 adds optional project-scoped tasks, runs, and logs while preserving legacy fallback

## Source Of Truth

- `server/agent-service.js`
- `ui/index.html`
- `tasks/agent-studio-v13-project-scoped-task-listing.md`
- `tasks/agent-studio-v13-project-scoped-task-saving.md`
- `tasks/agent-studio-v13-project-scoped-runs-logs.md`
