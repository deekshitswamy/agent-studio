# Selected Task

## Task

T5-add-tool-audit-logs

## Status

done

## Objective

Add audit logging for tool router usage so every tool call is traceable.

## Context Pack

context-packs/divya-runner-v4-mcp-tool-router.md

## Scope

- Log every tool call:
  - role
  - tool name
  - args (safe subset)
  - result (success/failure)
- Append logs to run artifacts
- Keep logs readable and minimal

## Out of Scope

- No external logging system
- No database
- No analytics engine
- No UI
- No async logging pipeline

## Acceptance Criteria

- Every tool call is logged
- Logs include role + tool + result
- Logs do not expose sensitive data
- Logs appear in run artifacts

## Verification

- Run Dev / QA
- Inspect logs → confirm tool usage is visible

## Dev Handoff

Check:

- src/tool-router.js
- src/agent-runner.js
