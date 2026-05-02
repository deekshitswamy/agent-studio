# Dev Log

## Execution

- Task: `mcp-004-implement-safe-read-file-policy`
- Context Pack: `context-packs/divya-runner-v5-local-mcp-server.md`
- Date: `2026-05-02`

## Goal

- Add a strict repo-local safe path policy for the MCP `read_file` adapter without changing existing runner behavior.

## Before-Coding Plan

- Add one new `src/mcp/safe-paths.js` module.
- Validate only MCP `read_file` paths there, not the broader runner/router behavior.
- Reject:
  - absolute paths
  - `..` traversal
  - hidden or sensitive paths
  - directories
- Keep file reads routed through the existing tool-router after the path is approved.

## Changes

- Added [`src/mcp/safe-paths.js`](../src/mcp/safe-paths.js).
- Wired MCP `read_file` in [`src/mcp/tools.js`](../src/mcp/tools.js) through the new safe-path resolver before calling the existing router-backed read logic.
- Updated [`tasks/mcp-004-implement-safe-read-file-policy.md`](../tasks/mcp-004-implement-safe-read-file-policy.md) to the current validated task format.

## After-Coding Summary

- MCP `read_file` now accepts only repo-relative file paths.
- Absolute paths, parent traversal, hidden/sensitive paths, missing files, and directories are rejected with clear local errors.
- Existing `run-agent` CLI behavior and the broader tool-router behavior were preserved.

## Verification

- `node ./bin/run-agent.js task validate tasks/mcp-004-implement-safe-read-file-policy.md`
- `node ./bin/mcp-server.js --json`
- `node ./bin/run-agent.js queue validate`
- `node ./bin/run-agent.js audit list`
- `node ./bin/run-agent.js context-packs/divya-runner-v1.md --execute`
- `node -e 'const { createLocalMcpServer } = require("./src/mcp/server"); const server = createLocalMcpServer({ repoRoot: process.cwd() }); console.log(server.adapters.read_file({ path: "AGENTS.md" }).path);'`
- `node -e 'const { createLocalMcpServer } = require("./src/mcp/server"); const server = createLocalMcpServer({ repoRoot: process.cwd() }); try { server.adapters.read_file({ path: "../package.json" }); process.exit(1); } catch (error) { console.log(error.message); }'`
- `node -e 'const { createLocalMcpServer } = require("./src/mcp/server"); const server = createLocalMcpServer({ repoRoot: process.cwd() }); try { server.adapters.read_file({ path: "/etc/passwd" }); process.exit(1); } catch (error) { console.log(error.message); }'`
- `node -e 'const { createLocalMcpServer } = require("./src/mcp/server"); const server = createLocalMcpServer({ repoRoot: process.cwd() }); try { server.adapters.read_file({ path: ".env.example" }); process.exit(1); } catch (error) { console.log(error.message); }'`
- `node -e 'const { createLocalMcpServer } = require("./src/mcp/server"); const server = createLocalMcpServer({ repoRoot: process.cwd() }); try { server.adapters.read_file({ path: "src" }); process.exit(1); } catch (error) { console.log(error.message); }'`

## Scope Drift Check

- No write tools were added.
- No shell execution was added.
- No networking changes were added.
- No directory listing was added.
- No broad safe path policy was applied outside the MCP `read_file` boundary.
- Existing CLI behavior was preserved.

## Next

- Recommended next human-selected task depends on whether the repo wants stricter hidden-file allowlist tuning or a more complete MCP runtime surface.
