# Agent Studio v5 Local MCP Server

Status: Prototype Verified  
Mode: Human-in-the-loop

## Overview

Agent Studio v5 adds a local-only MCP server skeleton with a small set of read-only tool adapters.

The MCP layer is intentionally separate from the main runner CLI. It exists to expose safe local capabilities without introducing write access, shell execution, networking, or autonomous workflows.

## What v5 Adds

- separate MCP entrypoint at `bin/mcp-server.js`
- local server boundary in `src/mcp/server.js`
- read-only tool registry and adapters in `src/mcp/tools.js`
- repo-local safe path policy for MCP `read_file`
- reuse of existing Agent Studio validation, queue, and audit modules

## Approved Read-Only Tools

- `read_file`
- `validate_task_file`
- `validate_queue`
- `list_queue`
- `audit_list`

## Tool Behavior

- `read_file`
  - reads repo-local files only
  - rejects arbitrary absolute paths
  - rejects parent-directory traversal
  - rejects hidden and sensitive paths unless later allowlisted
  - rejects directories
- `validate_task_file`
  - validates task markdown structure
  - does not modify the task file
- `validate_queue`
  - validates `tasks.json`
  - does not modify queue state
- `list_queue`
  - reads queue state only
  - does not change task status
- `audit_list`
  - reads recent tool-router audit entries only
  - does not modify audit logs

## Commands

Inspect the local MCP server:

```bash
node ./bin/mcp-server.js --print-tools
node ./bin/mcp-server.js --json
```

Verify related read-only capabilities:

```bash
node ./bin/run-agent.js task validate tasks/mcp-005-verify-and-document-mcp-prototype.md
node ./bin/run-agent.js queue validate
node ./bin/run-agent.js audit list
node ./bin/run-agent.js context-packs/divya-runner-v1.md --execute
```

## Separation From The Runner

- `bin/mcp-server.js` is separate from `bin/run-agent.js`
- MCP tooling does not replace the context-pack runner contract
- existing Agent Studio CLI behavior remains intact

## Intentionally Not Supported

- no write tools
- no shell execution through MCP
- no external network integrations
- no UI
- no production deployment behavior
- no autonomous execution loop
- no broad filesystem access beyond the current repo-local read boundary

## Verification Summary

The current prototype was verified to confirm:

- the MCP server entrypoint exists and is separate from the runner CLI
- only the approved read-only tools are exposed
- `read_file` rejects:
  - absolute arbitrary paths
  - parent-directory escapes
  - hidden or sensitive paths such as `.env.example`
  - directories
- queue, task, and audit MCP tools are read-only
- existing `run-agent` behavior still works

## Known Next Milestones

- decide whether to expose the adapters through a fuller MCP protocol surface without changing the read-only boundary
- refine allowlist behavior for any future explicitly approved hidden files
- add release-grade operator guidance for invoking MCP tools safely

## Source Of Truth

- `AGENTS.md`
- `system/agent-runner.md`
- `context-packs/divya-runner-v5-local-mcp-server.md`
- `bin/mcp-server.js`
- `src/mcp/`
- `logs/`
