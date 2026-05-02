# Selected Task

## Task

direct-agent-qa-checklist

## Status

done

## Objective

- Add a concise QA checklist for verifying direct-agent executions without changing runner behavior.

## Context Pack

- `context-packs/divya-runner-v6-direct-agent-interaction.md`

## Scope

- define a lightweight QA checklist for direct-agent runs
- cover general, Dev-specific, context, tool-usage, and output checks
- keep the checklist human-readable and documentation-only
- add a short status note only if it helps future sessions

## Out of Scope

- no automation
- no CLI changes
- no QA enforcement logic
- no UI

## Acceptance Criteria

- `system/agent-runner.md` includes a concise `Direct Agent QA Checklist` section.
- The checklist includes:
  - correct agent selected
  - context pack present and primary
  - no unintended chaining
  - standard response format followed
  - Dev uses exactly one explicit task file
  - Dev does not auto-select or combine tasks
  - supporting task/artifact context used only when explicitly provided
  - no broad repo assumptions
  - tools used only through router/MCP
  - output includes `Summary`, `Output`, and `Next Action`, with warnings when needed
- No CLI, automation, UI, async, or enforcement logic is added.

## Verification

```bash
node ./bin/run-agent.js task validate tasks/direct-agent-qa-checklist.md
```

## Dev Handoff

- Inspect:
  - `system/agent-runner.md`
  - `SYSTEM_STATUS.md`
  - `prompts/qa.md`
- Keep any follow-up documentation-only unless a later selected task explicitly requests behavior changes.
