# Context Pack: DIVYA Agent Runner v5 Local MCP Server

## Goal

Prototype a minimal local MCP server that exposes safe read-only Agent Runner tools.

## Scope

- Local-only MCP server
- Read-only tools first
- Wrap existing safe capabilities
- Preserve CLI runner behavior

## Initial Tools

- read_file
- validate_task_file
- validate_queue
- list_queue
- audit_list

## Non-goals

- No write tools
- No shell execution
- No external integrations
- No autonomous task execution
- No production deployment
- No UI

## Constraints

- Local only
- Read-only first
- Human-in-the-loop
- Secure by default
- Reuse existing modules where possible
