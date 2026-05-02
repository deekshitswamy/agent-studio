# Dev Log

## Execution

- Task: `T6-add-tool-audit-viewer`
- Context Pack: `context-packs/divya-runner-v4-mcp-tool-router.md`
- Date: `2026-05-02`

## Goal

- Add a read-only CLI command to view recent tool-router audit entries.

## Changes

- Added [`src/tool-audit.js`](../src/tool-audit.js) for read-only audit-log viewing.
- Added `run-agent audit list` in [`bin/run-agent.js`](../bin/run-agent.js).
- The viewer:
  - reads `logs/tool-router-audit.jsonl`
  - prints recent entries in a readable format
  - fails clearly if the audit log is missing
  - skips invalid JSONL lines safely with warnings
- Updated [`tasks/T6-add-tool-audit-viewer.md`](../tasks/T6-add-tool-audit-viewer.md) to the current validated task format.

## Verification

- `node ./bin/run-agent.js task validate tasks/T6-add-tool-audit-viewer.md`
- `node ./bin/run-agent.js audit list`
- `node ./bin/run-agent.js context-packs/divya-runner-v4-mcp-tool-router.md --agent dev --task tasks/T6-add-tool-audit-viewer.md`

## Scope Drift Check

- No analytics, filtering system, UI, database, mutation, or MCP server added.
- Audit logs remain read-only for the viewer command.
- Existing runner behavior was preserved.

## Next

- If a future need appears, a bounded next step could be a tiny `audit tail <n>` style extension, but it is not needed for the current scope.
