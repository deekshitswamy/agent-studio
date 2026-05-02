# Dev Log

## Execution

- Task: `T5-add-tool-audit-logs`
- Context Pack: `context-packs/divya-runner-v4-mcp-tool-router.md`
- Date: `2026-05-02`

## Goal

- Add minimal audit logging for routed tool usage so allowed and denied calls are traceable without exposing secrets or file contents.

## Changes

- Added local append-only audit logging to [`src/tool-router.js`](../src/tool-router.js).
- Logged each routed tool call with:
  - role
  - tool
  - safe args subset
  - success or failure result
- Added per-run `tool_audit` entries to Agent Runner artifacts in [`src/agent-runner.js`](../src/agent-runner.js).
- Threaded audit collection through the deterministic context builder in [`src/context-builder.js`](../src/context-builder.js).
- Added a standard-artifact note in [`system/agent-runner.md`](../system/agent-runner.md).
- Updated [`tasks/T5-add-tool-audit-logs.md`](../tasks/T5-add-tool-audit-logs.md) to the current validated task format.

## Verification

- `node ./bin/run-agent.js task validate tasks/T5-add-tool-audit-logs.md`
- `node ./bin/run-agent.js queue validate`
- `node ./bin/run-agent.js context-packs/divya-runner-v4-mcp-tool-router.md --agent dev --task tasks/T5-add-tool-audit-logs.md`
- `node -e 'const { runToolRouter } = require("./src/tool-router"); try { runToolRouter({ repoRoot: process.cwd(), role: "PM", tool: "validate_queue" }); process.exit(1); } catch (error) { console.log(error.message); }'`
- inspected `logs/tool-router-audit.jsonl`

## Scope Drift Check

- No external logging service, database, analytics system, UI, async pipeline, or MCP server added.
- Existing runner behavior and queue/task validation behavior were preserved.
- No secrets or file contents were written into audit entries.

## Next

- If v4 continues, the next bounded step could be documenting audit-log usage in the MCP architecture doc or adding a read-only CLI viewer only if a real need appears.
