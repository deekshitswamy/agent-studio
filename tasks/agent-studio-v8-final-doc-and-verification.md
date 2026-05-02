# Task: Document And Verify Agent Studio UI

## Task

- `agent-studio-v8-final-doc-and-verification`

## Status

done

## Objective

Document local UI usage and verify the completed v8 UI against scope.

## Context Pack

context-packs/agent-studio-v8-ui.md

## Scope

- Document how to start API server
- Document how to open UI
- Document how to run an agent from UI
- Document how to fetch logs
- Verify scoped behavior

## Out of Scope

- No backend changes
- No UI redesign
- No auth
- No database
- No streaming
- No polling
- No production deployment

## Acceptance Criteria

- Release doc exists for v8 UI
- Docs include:
  - start server command
  - open UI URL
  - run agent flow
  - fetch logs flow
  - limitations
- Verification confirms:
  - `/ui` loads
  - `/agents` populates dropdown
  - `POST /runs` works from UI/API
  - `/logs/:id` returns logs
- Scope drift check recorded

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v8-final-doc-and-verification.md
```

## Dev Handoff

- Keep this step documentation and verification only.
- Confirm `/ui`, `/agents`, `POST /runs`, and `/logs/:id` against the live local server.
- Do not bundle UI redesign or backend behavior changes into this task.
