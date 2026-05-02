# Selected Task

## Task

direct-agent-context-validation

## Status

done

## Objective

- Document and verify how direct-agent runs should receive scoped context without changing CLI or context-builder behavior.

## Context Pack

- `context-packs/divya-runner-v6-direct-agent-interaction.md`

## Scope

- document that the context pack is always the required primary input
- document that a selected task file is included only when explicitly provided to Dev
- document that artifact context is supporting input only when explicitly provided
- clarify that agents should not assume broad repo context or unrelated file scans
- keep this as documentation-only work

## Out of Scope

- no CLI changes
- no context builder rewrite
- no new tools
- no automation
- no UI

## Acceptance Criteria

- Docs explain:
  - context pack is primary input
  - selected task is included only when provided
  - artifact context is supporting input only
  - no broad repo scan assumption
- Existing context builder behavior is preserved.
- `SYSTEM_STATUS.md` is updated briefly only as a status note.

## Verification

```bash
node ./bin/run-agent.js task validate tasks/direct-agent-context-validation.md
```

## Dev Handoff

- Inspect:
  - `system/agent-runner.md`
  - `SYSTEM_STATUS.md`
  - `src/context-builder.js`
- Keep any future follow-up bounded to documentation unless a later selected task explicitly asks for behavior changes.
