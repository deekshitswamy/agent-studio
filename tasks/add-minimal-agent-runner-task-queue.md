# Task: Add Minimal Agent Runner Task Queue

## Goal

Add a minimal file-based task queue to Agent Runner using `tasks.json` as the source of truth, with CLI commands to list tasks, mark a task in progress, and mark a task done.

## Dependencies

- Read and follow:
  - `system/agent-runner.md`
  - `templates/context-pack-template.md`
  - `templates/dev-log-template.md`
  - `bin/run-agent.js`
  - `context-packs/divya-runner-v2-task-queue.md`
- Preserve existing Agent Runner v1 behavior, especially:

  ```bash
  node ./bin/run-agent.js <context-pack> --agent dev --llm --task <task-file>
  ```

## Acceptance Criteria

- Add repo-root `tasks.json` as the queue source of truth.
- Use this minimal schema:

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

- Support only these statuses:
  - `pending`
  - `in-progress`
  - `done`

- Add explicit CLI support for:

  ```bash
  node ./bin/run-agent.js queue list
  node ./bin/run-agent.js queue start <task-id>
  node ./bin/run-agent.js queue complete <task-id>
  ```

- `queue list`:
  - Reads `tasks.json`.
  - Prints each task with `id`, `file`, and `status`.
  - Does not modify state.

- `queue start <task-id>`:
  - Reads `tasks.json`.
  - Finds exactly one matching task by `id`.
  - Updates status to `in-progress`.
  - Writes `tasks.json`.
  - Does not execute the task.

- `queue complete <task-id>`:
  - Reads `tasks.json`.
  - Finds exactly one matching task by `id`.
  - Updates status to `done`.
  - Writes `tasks.json`.
  - Does not execute the task.

- Unknown task IDs produce a clear error and non-zero exit.
- Missing or invalid `tasks.json` produces a clear error and non-zero exit.
- Existing Agent Runner v1 command behavior remains unchanged.
- Queue command routing is explicit and does not interfere with normal agent execution parsing.
- Add a short v2 queue note to `system/agent-runner.md` or the active context pack, without rewriting the workflow.
- Create or update the execution dev log from `templates/dev-log-template.md`.

## Out of Scope

- No automation loop.
- No automatic task execution.
- No priority scoring.
- No dependency resolver.
- No UI.
- No database.
- No async/background worker.
- No schema expansion beyond `id`, `file`, and `status`.
- No redesign of Agent Runner architecture.
