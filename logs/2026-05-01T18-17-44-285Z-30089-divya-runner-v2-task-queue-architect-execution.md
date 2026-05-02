# architect Execution Output
## Metadata
- Timestamp: 2026-05-01T18:17:44.285Z
- Agent: architect
- Mode: llm
- Prompt File: prompts/architect.md
- Model: gpt-5.5
## Output
## Summary

Architect design for Agent Runner v2 task queue: add a minimal file-based task status layer using `tasks.json`, exposed through explicit CLI queue-management commands only. The design preserves Agent Runner v1 execution behavior and keeps `--task` human-selected Dev execution separate from queue status updates.

## Clarified Objective

Implement a small, durable task queue/status mechanism with:

- `tasks.json` as the source of truth.
- A minimal task record schema.
- CLI commands to:
  - list tracked tasks
  - mark one task `in-progress`
  - mark one task `done`
- No automatic task execution or orchestration loop.
- No change to existing Agent Runner v1 behavior unless the new queue commands are explicitly invoked.

Recommended command shape:

```bash
node ./bin/run-agent.js queue list
node ./bin/run-agent.js queue start <task-id>
node ./bin/run-agent.js queue complete <task-id>
```

Alternative acceptable if current CLI conventions prefer flags:

```bash
node ./bin/run-agent.js --queue list
node ./bin/run-agent.js --queue start <task-id>
node ./bin/run-agent.js --queue complete <task-id>
```

The key boundary is that queue commands manage state only. They must not invoke agents or execute task files.

## Acceptance Criteria

### Minimal `tasks.json` schema

Use a simple root object to allow future non-breaking metadata:

```json
{
  "tasks": [
    {
      "id": "example-task-id",
      "file": "tasks/example-task-id.md",
      "status": "pending"
    }
  ]
}
```

Required fields:

- `id`: unique task identifier.
- `file`: task file reference, usually under `tasks/`.
- `status`: one of:
  - `pending`
  - `in-progress`
  - `done`

Optional fields should be avoided for this execution unless already present in repo conventions.

### CLI behavior

- `queue list`
  - Reads `tasks.json`.
  - Prints each task with `id`, `file`, and `status`.
  - Does not modify state.

- `queue start <task-id>`
  - Reads `tasks.json`.
  - Finds exactly one matching task by `id`.
  - Updates its status to `in-progress`.
  - Writes `tasks.json`.
  - Does not execute the task.

- `queue complete <task-id>`
  - Reads `tasks.json`.
  - Finds exactly one matching task by `id`.
  - Updates its status to `done`.
  - Writes `tasks.json`.
  - Does not execute the task.

### Guardrails

- Unknown task IDs should produce a clear error and non-zero exit.
- Missing or invalid `tasks.json` should produce a clear error.
- Existing `node ./bin/run-agent.js <context-pack> --agent dev --llm --task <task-file>` behavior must continue unchanged.
- Queue commands should be routed before normal agent-run execution parsing if needed, but only for the explicit `queue` command form.

### Files Dev should read before implementation

- `system/agent-runner.md`
- `templates/context-pack-template.md`
- `templates/dev-log-template.md`
- `bin/run-agent.js`
- Existing task files under `tasks/`, if present.
- Existing context pack: `context-packs/divya-runner-v2-task-queue.md`, if present.

### Expected artifact locations

- `tasks.json`
  - Repo root.
  - Source of truth for queue state.

- CLI implementation
  - Prefer existing CLI entrypoint: `bin/run-agent.js`.
  - If logic becomes awkward, create a small helper module such as:
    - `lib/task-queue.js`
  - Keep helper file minimal and synchronous/file-based unless repo style indicates otherwise.

- Documentation/process update
  - Update `system/agent-runner.md` with a short v2 queue note, or update the active context pack if that is the repo convention.
  - Do not rewrite the full workflow.

- Dev log
  - Create or update the execution dev log using `templates/dev-log-template.md`.

## Risks Or Assumptions

- Assumption: `bin/run-agent.js` is the current CLI entrypoint and can accept a small explicit queue subcommand.
- Assumption: repo root is the correct location for `tasks.json`.
- Assumption: task IDs are manually maintained and unique.
- Risk: Overloading existing `--task` behavior could confuse execution semantics. Mitigation: keep queue commands explicitly separate from agent execution.
- Risk: Schema expansion could creep into priority/dependency planning. Mitigation: only support `id`, `file`, and `status` in this execution.
- Risk: Strict state transition validation could create unnecessary complexity. Minimal acceptable behavior is direct status update for known tasks.
- Out of scope:
  - auto-running tasks
  - dependency resolution
  - priority scoring
  - UI
  - database
  - async/background loop
  - multi-agent chaining

## Recommended Next Handoff

Task Planner.

Task Planner should produce a small implementation checklist and, if needed, one executable task file for Dev. The next Dev task should focus only on:

1. Add/read/write `tasks.json`.
2. Add explicit queue CLI commands.
3. Preserve existing Agent Runner v1 behavior.
4. Add concise documentation and dev-log notes.
