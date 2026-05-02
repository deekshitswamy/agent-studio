# MCP Module Inspection

## Execution

- Task: `mcp-001-inspect-reusable-modules`
- Context Pack: `context-packs/divya-runner-v5-local-mcp-server.md`
- Date: `2026-05-02`

## Files Inspected

- `context-packs/divya-runner-v5-local-mcp-server.md`
- `tasks/mcp-001-inspect-reusable-modules.md`
- `bin/run-agent.js`
- `system/agent-runner.md`
- `src/task-file.js`
- `src/task-queue.js`
- `src/tool-audit.js`
- `src/tool-router.js`
- `src/context-builder.js`

## Reusable Functions Found

### `validate_task_file`

- File: `src/task-file.js`
- Reusable functions:
  - `validateTaskFile(taskFilePath)`
  - `formatTaskValidationReport(result)`
  - `getTaskFilePath(taskPath)`
- Current reuse status:
  - already reusable as exported functions
  - also exposed through the router as `validate_task_file`

### `validate_queue`

- File: `src/task-queue.js`
- Reusable functions:
  - `validateTasksState(tasksState, tasksFilePath, repoRoot)`
  - `parseTasksState(tasksFilePath)`
  - `getTasksFilePath(repoRoot)`
  - `formatValidationReport(...)`
- Current reuse status:
  - already reusable as exported functions
  - also exposed through the router as `validate_queue`

### `list_queue`

- File: `src/task-queue.js`
- Reusable function present:
  - `listTasks(tasksState)`
- Current reuse status:
  - function exists, but is not exported
  - currently reached only through `runTaskQueueCommand({ action: "list" })`

### `audit_list`

- File: `src/tool-audit.js`
- Reusable functions present:
  - `runToolAuditCommand({ repoRoot, action })`
  - internal helpers:
    - `readAuditLines(auditLogPath)`
    - `parseAuditEntries(lines)`
    - `formatAuditListReport(...)`
- Current reuse status:
  - `runToolAuditCommand` is exported and reusable
  - current interface is still command-shaped because it expects `action: "list"`

### `read_file`

- Files:
  - `src/tool-router.js`
  - `src/context-builder.js`
- Reusable functions present:
  - `runToolRouter({ repoRoot, role, tool, args, auditTrail })`
  - internal helpers:
    - `resolveWorkspacePath(repoRoot, targetPath)`
    - `routeReadFile(...)`
  - `buildAgentContext(...)` reuses router-backed file reads for scoped context
- Current reuse status:
  - safe constrained file reading exists through the router
  - there is not yet an exported standalone read-only helper separate from the router contract

## CLI-Coupled Logic Found

- `bin/run-agent.js`
  - command parsing and dispatch for:
    - `queue <...>`
    - `task validate <...>`
    - `audit list`
    - normal agent execution
- `src/task-queue.js`
  - `runTaskQueueCommand(...)` is action-oriented CLI adapter logic
  - `list_queue` currently depends on this adapter unless `listTasks` is exported
- `src/task-file.js`
  - `runTaskFileCommand(...)` is action-oriented CLI adapter logic
- `src/tool-audit.js`
  - `runToolAuditCommand(...)` is action-oriented CLI adapter logic for `audit list`

## Minimal Extraction Needed

- Overall extraction needed: `yes`

### Needed

- `list_queue`
  - yes
  - smallest extraction is to export `listTasks(tasksState)` or add a thin exported non-CLI wrapper
- `audit_list`
  - maybe small extraction
  - `runToolAuditCommand` is reusable already, but a cleaner MCP adapter would likely want a direct exported reader like:
    - read recent entries
    - parse warnings
    - return structured data without the CLI-style `action`
- `read_file`
  - no immediate extraction required if MCP adapters are allowed to call `runToolRouter(...)`
  - later cleanup could expose a dedicated read-only helper if the MCP layer should avoid calling the generic router directly

### Not Needed Right Now

- `validate_task_file`
  - no
  - already reusable via exported validation functions
- `validate_queue`
  - no
  - already reusable via exported parsing/validation functions

## Behavior Change Check

- No behavior changed.
- No MCP server was implemented.
- No CLI behavior was changed in this inspection task.
- No write tools, shell execution, UI, or autonomous task execution were added.

## Recommendation

- The v5 local read-only MCP server can reuse existing validation logic directly for:
  - `validate_task_file`
  - `validate_queue`
- Before MCP adapter wiring, the cleanest small follow-up would be:
  - export or wrap `listTasks(...)` for `list_queue`
  - optionally expose a structured audit-reader helper for `audit_list`
