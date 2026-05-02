# Task: Wire Agent Loading And Run Form

## Task

- `agent-studio-v8-wire-agents-and-run-form`

## Status

done

## Objective

Connect the UI shell to the v7 API for agent loading and run submission.

## Context Pack

context-packs/agent-studio-v8-ui.md

## Scope

- Fetch agents from `GET /agents`
- Populate agent dropdown
- Submit form to `POST /runs`
- Display run metadata/result
- Display errors plainly

## Out of Scope

- No log fetching yet
- No backend changes
- No streaming
- No polling
- No auth
- No database
- No framework

## Acceptance Criteria

- Agent dropdown loads from `GET /agents`
- Context pack path is required before submit
- Form sends:
  - contextPack
  - agent
  - task when provided
  - withArtifact when provided
- Successful run response appears in result panel
- Errors appear in result panel
- No backend behavior changes

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v8-wire-agents-and-run-form.md
node server/agent-service.js
# open ui/index.html and test form
```

## Dev Handoff

- Confirm the agent dropdown loads from `GET /agents`.
- Submit one run through `POST /runs` and confirm the result panel updates.
- Keep log fetching, polling, and backend changes out of this task.
