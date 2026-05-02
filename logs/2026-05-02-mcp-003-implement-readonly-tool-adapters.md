# Dev Log

## Execution

- Task: `mcp-003-implement-readonly-tool-adapters`
- Context Pack: `context-packs/divya-runner-v5-local-mcp-server.md`
- Date: `2026-05-02`

## Goal

- Wire the approved read-only MCP tools to existing Agent Runner capabilities using the smallest possible adapter layer.

## Before-Coding Plan

- Reuse existing task, queue, audit, and router modules instead of duplicating CLI logic.
- Export only the smallest missing reusable pieces:
  - queue listing
  - structured audit-list helper
- Keep `read_file` routed through the existing tool-router behavior.
- Preserve current CLI behavior and avoid any networking, shelling out, or write-capable tools.

## Changes

- Exported `listTasks(...)` and `readTasksState(...)` from [`src/task-queue.js`](../src/task-queue.js).
- Added structured audit-list helper exports in [`src/tool-audit.js`](../src/tool-audit.js).
- Added read-only MCP adapters in [`src/mcp/tools.js`](../src/mcp/tools.js) for:
  - `read_file`
  - `validate_task_file`
  - `validate_queue`
  - `list_queue`
  - `audit_list`
- Updated [`src/mcp/server.js`](../src/mcp/server.js) to create the adapter set while keeping `--json` output printable and read-only.
- Updated [`tasks/mcp-003-implement-readonly-tool-adapters.md`](../tasks/mcp-003-implement-readonly-tool-adapters.md) to the current validated task format.

## After-Coding Summary

- The MCP layer now has actual thin read-only adapter functions behind the approved tool names.
- Existing validation, queue, audit, and router logic is reused rather than duplicated.
- Existing `run-agent` CLI behavior remains unchanged.

## Verification

- `node ./bin/run-agent.js task validate tasks/mcp-003-implement-readonly-tool-adapters.md`
- `node ./bin/mcp-server.js --print-tools`
- `node ./bin/mcp-server.js --json`
- `node ./bin/run-agent.js queue validate`
- `node ./bin/run-agent.js audit list`
- `node ./bin/run-agent.js context-packs/divya-runner-v1.md --execute`
- `node -e 'const { createLocalMcpServer } = require("./src/mcp/server"); const server = createLocalMcpServer({ repoRoot: process.cwd() }); console.log(Object.keys(server.adapters).sort().join(",")); console.log(server.adapters.list_queue().output); console.log(server.adapters.audit_list().entries.length >= 0 ? "audit-ok" : "audit-fail");'`

## Scope Drift Check

- No write tools were added.
- No shell execution was added.
- No networking changes were added.
- No broad safe path policy work was added beyond the existing router behavior.
- Existing CLI behavior was preserved.

## Next

- Recommended next human-selected task:
  - `tasks/mcp-004-implement-safe-read-file-policy.md`
