# Dev Log

## Execution

- Task: `T3-add-tool-router-core`
- Context Pack: `context-packs/divya-runner-v4-mcp-tool-router.md`
- Date: `2026-05-02`

## Goal

- Add the minimal local tool-router core for `read_file`, `validate_task_file`, and `validate_queue`.

## Changes

- Added [`src/tool-router.js`](../src/tool-router.js) with a small role/tool allowlist and synchronous local routing.
- Routed Agent Runner file reads through the tool router so `read_file` is a real execution path.
- Routed CLI `task validate` and `queue validate` through the tool router.
- Exported shared validation helpers from [`src/task-file.js`](../src/task-file.js) and [`src/task-queue.js`](../src/task-queue.js).
- Updated [`tasks/T3-add-tool-router-core.md`](../tasks/T3-add-tool-router-core.md) to the current task-file heading format so it passes validation.

## Verification

- `node ./bin/run-agent.js task validate tasks/T3-add-tool-router-core.md`
- `node ./bin/run-agent.js queue validate`
- `node ./bin/run-agent.js context-packs/divya-runner-v4-mcp-tool-router.md --agent dev --task tasks/T3-add-tool-router-core.md`
- `node -e 'const { runToolRouter } = require("./src/tool-router"); try { runToolRouter({ repoRoot: process.cwd(), role: "PM", tool: "validate_queue" }); process.exit(1); } catch (error) { console.log(error.message); }'`

## Scope Drift Check

- No MCP server added.
- No networking, async execution, UI, or broad permission system added.
- Existing queue commands and runner chain behavior were preserved.

## Next

- If v4 continues, the next bounded step is likely wiring direct agent/tool usage conventions into prompts or docs before any MCP server prototype.
