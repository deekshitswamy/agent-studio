# Agent Studio v2 Task Queue

Status: Stable  
Mode: Human-in-the-loop

## Overview

Agent Studio v2 Task Queue adds a minimal file-based queue state layer on top of the existing Agent Studio v1 workflow.

It introduces explicit queue-management commands and a repo-root `tasks.json` file, while preserving the existing context-pack-driven execution model and direct Dev task selection flow.

## Design Principle

The task queue manages state only.  
Execution remains explicit and human-invoked.

This separation is intentional to prevent:

- hidden automation
- accidental multi-task execution
- loss of control over workflow steps

## What v2 Adds

- repo-root `tasks.json` as queue state source of truth
- explicit CLI queue commands:
  - list tasks
  - mark one task `in-progress`
  - mark one task `done`
- minimal task status tracking without changing existing v1 execution behavior
- human-managed coordination between queue state and task files under `tasks/`

## Task Queue Schema

`tasks.json` uses a minimal root object:

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

Supported statuses:

- `pending`
- `in-progress`
- `done`

Each task record is intentionally small:

- `id`: unique task identifier
- `file`: task file path, usually under `tasks/`
- `status`: current queue status

Notes:

- `file` is not validated or executed by queue commands.
- Queue integrity depends on humans maintaining consistency between `tasks.json` and files under `tasks/`.

## Commands

Queue management:

```bash
node ./bin/run-agent.js queue list
node ./bin/run-agent.js queue start <task-id>
node ./bin/run-agent.js queue complete <task-id>
```

Direct Dev execution still uses the existing v1 path:

```bash
node ./bin/run-agent.js <context-pack-file> --agent dev --llm --task <task-file>
```

Example:

```bash
node ./bin/run-agent.js queue list
node ./bin/run-agent.js queue start add-minimal-agent-runner-task-queue
node ./bin/run-agent.js context-packs/divya-runner-v2-task-queue.md --agent dev --llm --task tasks/add-minimal-agent-runner-task-queue.md
node ./bin/run-agent.js queue complete add-minimal-agent-runner-task-queue
```

## What Queue Commands Do Not Do

- do not execute agents
- do not run Dev automatically
- do not invoke Task Planner, QA, or chaining
- do not read a context pack for queue-state changes
- do not resolve dependencies between tasks
- do not assign priorities
- do not create an automation loop
- do not add background or async processing
- do not replace the human task-selection step

## Relationship To Dev `--task`

Queue state and Dev task execution are related but separate:

- `tasks.json` tracks task status only.
- `--task <task-file>` gives Dev exactly one selected task file to work on.
- Queue commands never execute the task file they reference.
- Dev execution never starts automatically because a queue status changed.
- A human must still:
  1. choose a task
  2. run Dev on that task file
  3. update queue state explicitly with queue commands

This keeps Agent Studio human-in-the-loop and avoids an automation loop.

## Known Next Milestones

- tighten task-file conventions so Task Planner outputs map more consistently to `tasks/<task-id>.md`
- decide whether queue state should remain fully separate from later QA or review workflows
- improve release-grade docs for queue-based operator workflows
- optionally add validation, not enforcement, for queue/task-file mismatch

## Source Of Truth

- `AGENTS.md`
- `system/agent-runner.md`
- `context-packs/divya-runner-v2-task-queue.md`
- `tasks.json`
- `tasks/`
- `logs/`

## Queue Validation

Agent Studio v2 also supports read-only queue validation:

```bash
node ./bin/run-agent.js queue validate
```
