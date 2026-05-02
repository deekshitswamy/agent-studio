# architect Execution Output
## Metadata
- Timestamp: 2026-05-01T23:01:21.029Z
- Agent: architect
- Mode: llm
- Prompt File: prompts/architect.md
- Model: gpt-5.5
## Output
## Summary

Architect handoff for the DIVYA Agent Runner v5 local MCP server prototype.

The minimal design should add a **local-only, read-only MCP server layer** that wraps existing Agent Runner capabilities without replacing or changing CLI behavior. The server should expose only the approved initial tools:

- `read_file`
- `validate_task_file`
- `validate_queue`
- `list_queue`
- `audit_list`

No write tools, shell execution, autonomous task execution, UI, external integrations, or production deployment work should be introduced.

## Clarified Objective

Design the smallest durable MCP server structure that can be implemented in one or more later Dev tasks while preserving current Agent Runner behavior.

Recommended architecture:

```text
bin/
  mcp-server.js              # local MCP server entrypoint, separate from CLI runner

src/
  mcp/
    server.js                # MCP server setup and local transport binding
    tools.js                 # tool registry
    safe-paths.js            # read_file path policy and repo-boundary checks

existing modules/
  queue validation/listing   # reused, not duplicated
  task validation            # reused, not duplicated
  audit listing              # reused, not duplicated
```

Design principles:

- Keep MCP as an adapter layer over existing safe modules.
- Preserve existing CLI entrypoints and behavior.
- Treat all tools as read-only.
- Enforce local-only operation in implementation, not just documentation.
- Constrain `read_file` to repo-local, non-sensitive, explicitly allowed paths.
- Avoid broad filesystem access.
- Avoid shell execution entirely.
- Keep future Dev tasks small and human-selected.

## Acceptance Criteria

For a later implementation to satisfy this architecture:

- A separate MCP server entrypoint exists and does not replace `bin/run-agent.js`.
- The MCP server exposes only:
  - `read_file`
  - `validate_task_file`
  - `validate_queue`
  - `list_queue`
  - `audit_list`
- Each tool calls or wraps existing Agent Runner capabilities where practical.
- Existing CLI commands continue to work unchanged.
- `read_file` is restricted by a safe path policy:
  - repo-root bounded
  - no absolute arbitrary paths
  - no parent-directory escape
  - no hidden or sensitive paths unless explicitly allowed
  - read-only only
- Queue/task/audit tools do not mutate files or queue state.
- No shell execution is available through the MCP server.
- No external network integrations are introduced.
- Server is local-only by default.
- Dev changes are recorded in a dev log artifact.
- Any task file created later should target one implementation slice only.

## Risks Or Assumptions

- Assumption: existing validation/list/audit functions are reusable or can be lightly extracted without changing CLI behavior.
- Assumption: adding a separate MCP entrypoint is safer than modifying the existing runner entrypoint.
- Risk: existing code may be CLI-coupled; Dev may need a small refactor to expose reusable functions.
- Risk: `read_file` is the highest-risk tool and needs strict path normalization and allow/deny handling.
- Risk: local-only behavior can be weakened if the MCP transport defaults are not checked carefully.
- Risk: audit listing may expose sensitive local metadata if log paths are too broad.
- Assumption: no authentication, deployment hardening, UI, write tools, or remote access are required for this prototype.

## Recommended Next Handoff

**Task Planner**

Create small implementation-ready task files instead of one large Dev task. Recommended task breakdown:

1. **Inspect reusable modules**
   - Identify existing files/functions for queue validation, task validation, queue listing, audit listing, and safe file reads.
   - No behavior changes.

2. **Add MCP server skeleton**
   - Add separate local MCP entrypoint and server module.
   - Register no-op or stub-safe tool definitions only if needed.
   - Preserve CLI behavior.

3. **Implement read-only tool adapters**
   - Wire approved tools to existing modules.
   - Keep adapters thin.

4. **Implement safe path policy for `read_file`**
   - Repo-root bounded path resolution.
   - Reject unsafe paths.
   - Add focused validation.

5. **Verify and document**
   - Confirm CLI behavior is preserved.
   - Confirm tools are read-only.
   - Add/update dev log.

The next agent should not implement all of this immediately unless a single small task file is selected for Dev execution.
