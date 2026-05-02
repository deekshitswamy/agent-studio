# Task: Detect Task Planner Run Output

## Task

- `agent-studio-v9-detect-task-planner-output`

## Status

done

## Objective

Detect Task Planner output from existing run results or logs so it can later be converted into task drafts.

## Context Pack

context-packs/agent-studio-v9-task-drafts.md

## Scope

- Detect when a completed run was from `task-planner`
- Use existing run metadata and/or logs
- Expose detected Task Planner source text to the UI
- Keep detection conservative

## Out of Scope

- No task draft extraction yet
- No task file saving
- No task editing
- No Dev auto-run
- No background jobs
- No database

## Acceptance Criteria

- Task Planner runs can be identified from available metadata
- Non-Task Planner runs are not treated as task draft sources
- UI can access or display detected Task Planner source text
- Existing run/log behavior remains unchanged
- No tasks are created or saved automatically

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v9-detect-task-planner-output.md
```

## Dev Handoff

- Confirm completed `task-planner` runs can be identified conservatively from existing metadata and logs.
- Expose source text only. Do not extract drafts or save task files yet.
- Keep non-task-planner runs out of the task-draft path.
