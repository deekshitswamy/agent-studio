# Task: Add Project-Runner Execution

## Task

- `agent-studio-v17-project-runner-execution`

## Status

- `done`

## Objective

- Execute project-scoped runs inside a short-lived project-runner Docker container while keeping legacy non-project runs unchanged.

## Context Pack

- `context-packs/agent-studio-v10-run-dev-from-task.md`

## Scope

- Modify `POST /runs` behavior.
- If `project` is not provided, preserve the existing local `spawnSync` execution path.
- If `project` is provided, execute the run using `docker compose run --rm agent-studio-project-runner ...`.
- Add a new `agent-studio-project-runner` service in `docker-compose.yml`.
- Make the runner container use the same image as `agent-studio`.
- Do not expose ports from the runner container.
- Keep the runner command aligned with `node ./bin/run-agent.js ...`.
- Use a mount strategy where the repo is mounted read-only and `projects/<project-id>` is mounted read-write.
- Ensure project-scoped run artifacts still land in `projects/<project-id>/.local/runs/`.

## Out of Scope

- Docker socket inside a container
- Queue behavior
- Multi-run concurrency control
- Project creation flow
- API contract changes
- UI changes
- File migration
- Resource limits
- Agent Runner behavior changes outside the project-scoped execution path

## Acceptance Criteria

- Global runs still work through the existing local `spawnSync` path.
- Project-scoped runs execute through the `agent-studio-project-runner` container path.
- Project-scoped artifacts are written correctly under `projects/<project-id>/.local/runs/`.
- `GET /runs/:id` still works for both legacy and project-scoped runs.
- `GET /logs/:id` still works for both legacy and project-scoped runs.
- There is no behavior change for the UI request contract.

## Verification

- `node ./bin/run-agent.js task validate tasks/agent-studio-v17-project-runner-execution.md`
- Start a run without `project` and confirm it still uses the existing local execution path.
- Start a run with `project=agent-studio` and confirm it executes through the project-runner container path.
- Confirm project-scoped artifacts appear under `projects/agent-studio/.local/runs/`.
- Verify `GET /runs/:id` and `GET /logs/:id` still read the resulting artifacts correctly.
- Verify the UI continues to work without request-shape changes.

## Dev Handoff

- Inspect `docker-compose.yml`, `Dockerfile`, and `server/agent-service.js` first.
- Keep the new Docker runner path limited to project-scoped execution only.
- Preserve the current legacy local execution path for non-project runs.
- Do not add queueing, background jobs, migration, or project creation behavior in this task.
