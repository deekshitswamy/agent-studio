# Selected Task

## Task

mcp-004-implement-safe-read-file-policy

## Status

done

## Objective

Implement a strict repo-local safe path policy for the MCP `read_file` tool.

## Context Pack

context-packs/divya-runner-v5-local-mcp-server.md

## Scope

- Add safe path policy module:
  - `src/mcp/safe-paths.js`
- Ensure `read_file` is repo-root bounded
- Reject unsafe paths
- Keep reads file-only and read-only

## Out of Scope

- No directory listing
- No write access
- No shell execution
- No remote file access
- No external integrations
- No UI
- No production security hardening beyond local prototype policy

## Acceptance Criteria

- `read_file` accepts repo-relative paths.
- Absolute arbitrary paths are rejected.
- Parent-directory escape attempts are rejected.
- Resolved paths must remain inside repo root.
- Hidden or sensitive paths are rejected unless explicitly allowed.
- Reads are file-only and read-only.
- No directory traversal listing is added.
- No shell execution is used.
- Rejection errors are clear enough for local operator debugging.
- Existing MCP adapters and CLI behavior continue working.

## Verification

Run:

```bash
node ./bin/run-agent.js task validate tasks/mcp-004-implement-safe-read-file-policy.md
node ./bin/mcp-server.js --json
node ./bin/run-agent.js queue validate
node ./bin/run-agent.js audit list
```

## Dev Handoff

- Inspect:
  - `src/mcp/tools.js`
  - `src/mcp/safe-paths.js`
  - `src/tool-router.js`
  - `src/mcp/server.js`
- Keep future work bounded to explicit allowlist tuning or later MCP runtime/protocol needs.
