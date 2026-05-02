# Selected Task

## Task

mcp-003-implement-readonly-tool-adapters

## Status

done

## Objective

Wire the approved MCP tools to existing Agent Runner capabilities using thin read-only adapters.

## Context Pack

context-packs/divya-runner-v5-local-mcp-server.md

## Scope

Implement adapters for these approved read-only tools only:

- `validate_task_file`
- `validate_queue`
- `list_queue`
- `audit_list`
- `read_file`

Reuse existing modules where practical and avoid duplicating CLI logic.

## Out of Scope

- No write tools
- No task start / complete tools
- No queue mutation tools
- No shell execution
- No external integrations
- No UI
- No production deployment
- No broad runner refactor
- No MCP server networking changes

## Acceptance Criteria

- MCP tool registry exposes only the approved tools:
  - `validate_task_file`
  - `validate_queue`
  - `list_queue`
  - `audit_list`
  - `read_file`
- `validate_task_file` delegates to existing task validation logic where practical.
- `validate_queue` delegates to existing queue validation logic where practical.
- `list_queue` delegates to existing queue listing logic where practical.
- `audit_list` delegates to existing audit listing logic where practical.
- `read_file` uses the existing local read behavior or tool-router read path.
- Tool handlers do not mutate files or queue state.
- Tool handlers do not invoke shell commands.
- Existing CLI behavior remains unchanged.
- Any required extraction from CLI-coupled code is minimal and documented.

## Verification

Run:

```bash
node ./bin/run-agent.js task validate tasks/mcp-003-implement-readonly-tool-adapters.md
node ./bin/mcp-server.js --print-tools
node ./bin/mcp-server.js --json
node ./bin/run-agent.js queue validate
node ./bin/run-agent.js audit list
```

## Dev Handoff

- Inspect:
  - `src/mcp/server.js`
  - `src/mcp/tools.js`
  - `src/task-file.js`
  - `src/task-queue.js`
  - `src/tool-audit.js`
  - `src/tool-router.js`
- Keep follow-up work bounded to safe path policy or later MCP protocol/runtime needs only.
