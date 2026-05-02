# Selected Task

## Task

T3-add-tool-router-core

## Status

done

## Objective

Add a minimal tool-router layer inside the existing run-agent CLI to control tool usage based on role and task scope.

## Context Pack

context-packs/divya-runner-v4-mcp-tool-router.md

## Scope

- Add a tool router module
- Route tool calls through it instead of direct execution
- Enforce basic role-based access
- Support a few initial tools:
  - read_file
  - validate_task_file
  - validate_queue
- Keep everything local and synchronous

## Out of Scope

- No MCP server
- No networking
- No async execution
- No external tools
- No full permission system

## Acceptance Criteria

- Tool calls go through router
- Router checks role before allowing access
- Router returns error for disallowed actions
- Existing CLI behavior still works

## Verification

- Run existing commands
- Try invalid tool access → should fail

## Dev Handoff

Check:

- src/agent-runner.js
- create src/tool-router.js
- integrate before tool execution
