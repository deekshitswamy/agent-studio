# Selected Task

## Task

T6-add-tool-audit-viewer

## Status

done

## Objective

Add a read-only CLI command to view recent tool-router audit entries.

## Context Pack

context-packs/divya-runner-v4-mcp-tool-router.md

## Scope

- Add CLI command:
  - `node ./bin/run-agent.js audit list`
- Read from:
  - `logs/tool-router-audit.jsonl`
- Show recent audit entries in a readable format
- Do not modify audit logs

## Out of Scope

- No filtering system
- No analytics
- No UI
- No database
- No deletion or mutation of audit logs
- No MCP server

## Acceptance Criteria

- `audit list` prints recent audit entries
- Missing audit file is handled clearly
- Invalid JSON lines are handled safely
- Command is read-only
- Existing runner behavior remains unchanged

## Verification

- Run:
  ```bash
  node ./bin/run-agent.js audit list
  ```

## Dev Handoff

- Check:
  - `bin/run-agent.js`
  - `src/tool-audit.js`
  - `src/tool-router.js`
