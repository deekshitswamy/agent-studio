# Task: Extract Editable Task Drafts

## Task

- `agent-studio-v9-extract-editable-task-drafts`

## Status

done

## Objective

Extract editable unsaved task drafts from detected Task Planner markdown output.

## Context Pack

context-packs/agent-studio-v9-task-drafts.md

## Scope

- Parse detected Task Planner source text
- Extract best-effort task draft blocks
- Show drafts in UI as unsaved drafts
- Keep original text available when parsing is ambiguous

## Out of Scope

- No task file saving
- No draft persistence
- No automatic validation
- No Dev auto-run
- No complex parser
- No database

## Acceptance Criteria

- Task Planner source text can produce one or more unsaved draft objects
- Drafts include:
  - title
  - suggestedTaskId
  - body
  - status: draft
- Ambiguous extraction keeps editable source text visible
- UI distinguishes unsaved drafts from saved task files
- No task files are written

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v9-extract-editable-task-drafts.md
```

## Dev Handoff

- Keep extraction best-effort and unsaved only.
- Preserve original Task Planner source text in the UI when parsing is ambiguous.
- Do not add saving, persistence, or any automatic execution behavior.
