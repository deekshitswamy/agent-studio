# Agent Studio v9 Task Drafts

Status: Local Prototype  
Mode: Human-in-the-loop

## Overview

Agent Studio v9 extends the local UI and API so Task Planner output can be surfaced as editable task drafts before anything is written to disk.

The workflow remains intentionally conservative:

- show existing saved task files from `tasks/*.md`
- detect completed `task-planner` runs as a draft source
- extract best-effort unsaved drafts in the UI
- let a human explicitly save one reviewed draft to `tasks/<task-id>.md`
- reject accidental overwrite of an existing task file

Nothing in v9 auto-selects, queues, validates, or executes a Dev task.

## How To Start

Start the local API server:

```bash
node server/agent-service.js
```

Default address:

- `http://127.0.0.1:3000`

Open the UI at:

- `http://127.0.0.1:3000/ui`

## Workflow

1. Start the local API server.
2. Open `http://127.0.0.1:3000/ui`.
3. Review the `Saved Tasks` panel populated from `GET /tasks`.
4. Run `task-planner` from the UI or API using the desired context pack.
5. Review the returned run metadata.
6. Let the UI fetch conservative Task Planner source text from `GET /runs/:id/task-planner-source`.
7. Review the extracted `Unsaved Drafts`.
8. Edit a draft if needed.
9. Click `Save to tasks/` for one reviewed draft.
10. Confirm the saved task appears in the `Saved Tasks` list.

## API Surface Used By v9

List supported agents:

```bash
curl http://127.0.0.1:3000/agents
```

List saved task files:

```bash
curl http://127.0.0.1:3000/tasks
```

Create a Task Planner run:

```bash
curl -X POST http://127.0.0.1:3000/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v9-task-drafts.md","agent":"task-planner"}'
```

Read detected Task Planner source:

```bash
curl http://127.0.0.1:3000/runs/<run-id>/task-planner-source
```

Save one reviewed draft:

```bash
curl -X POST http://127.0.0.1:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"taskId":"example-task","title":"Example Task","body":"Reviewed draft body","contextPack":"context-packs/agent-studio-v9-task-drafts.md"}'
```

## Verified Behavior

Verified against the current local implementation:

- `GET /tasks` returns saved markdown task files from `tasks/`
- completed `task-planner` runs can be detected through `GET /runs/:id/task-planner-source`
- non-`task-planner` runs are not treated as draft sources
- the UI contains separate panels for:
  - `Saved Tasks`
  - `Task Planner Source`
  - `Unsaved Drafts`
- unsaved drafts can be edited in the UI before saving
- saving a reviewed draft writes only to `tasks/<task-id>.md`
- saving refreshes the saved-task list
- saving rejects overwrite of an existing task file with `409 Conflict`
- no task is auto-selected or auto-executed for Dev

## Current Limitations

- local only
- no auth
- no database
- no background jobs
- no auto-save
- no automatic validation on save
- no queue insertion
- no automatic Dev execution
- no draft persistence beyond the current browser session
- draft extraction is best-effort, not a full markdown parser

## Relationship To Existing Versions

- v7 provides the local API service
- v8 adds the local browser UI
- v9 adds task-file listing, Task Planner source detection, editable unsaved drafts, and explicit human-reviewed save
- the underlying `run-agent` CLI behavior remains unchanged

## Source Of Truth

- `ui/index.html`
- `server/agent-service.js`
- `context-packs/agent-studio-v9-task-drafts.md`
- `tasks/agent-studio-v9-final-qa-doc-check.md`
- `logs/`
