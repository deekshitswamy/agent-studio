# MCP Tool Router

## Purpose

Define the first architecture for the Agent Studio MCP/tool-router layer that lets future agents access local tools through a controlled, role-aware interface.

The router should help agents ask for the right tool capability without exposing the whole local system by default. It should preserve the current human-in-the-loop model and keep repo files as source of truth.

## Non-Goals

- not an autonomous orchestration engine
- not a background worker
- not a permission bypass layer
- not a replacement for context packs, task files, or queue state
- not a full remote MCP marketplace design
- not an implementation plan for a production MCP server yet

## High-Level Architecture

```text
Agent
  -> Tool Router
    -> role policy check
    -> context lookup
    -> tool selection
    -> local MCP server capability
    -> result filtering
  -> agent response
```

The first version should stay local-first:

- repo files provide context
- the router selects from approved local capabilities
- results flow back into the current execution only

## Tool Router Responsibilities

- map an agent request to an allowed tool category
- enforce role-based access boundaries
- attach only the minimum context needed for the tool call
- keep task and context-pack scope visible
- return tool results in a simple, inspectable format
- avoid implicit multi-step execution
- leave a clear audit trail in logs when tool use matters

## Initial Tool Categories

- file read
- file write
- task file validation
- queue validation and queue state read/write
- local code execution
- test/verification command execution
- documentation search

These categories should remain small and explicit in the first phase.

## Role-Based Access Rules

- Orchestrator:
  - may read workflow/context artifacts
  - may not perform broad write operations by default
- PM / Architect / Task Planner / QA:
  - read-first roles
  - should prefer file inspection, validation, and search
  - should not mutate queue or source files unless explicitly allowed by the execution
- Dev:
  - may read and write only within the selected task scope
  - should use validation and verification tools before and after code changes
- DevOps:
  - may inspect operational files and verification outputs
  - should remain bounded to current execution needs

Access should be deny-by-default outside the role’s current task.

## Context Retrieval Strategy

- start from the active context pack
- add linked repo source-of-truth files:
  - `AGENTS.md`
  - `system/agent-runner.md`
  - relevant state file
  - selected task file, if present
- add supporting artifacts only when explicitly requested or referenced:
  - prior execution logs
  - architect or QA artifacts
  - queue state

The router should prefer narrow retrieval over broad repo scans.

## Context Builder

- Agent Studio now uses a deterministic context builder before agent execution
- the context builder reads only scoped files
- the context pack is always the primary execution input
- `AGENTS.md` and `system/agent-runner.md` are included as repo source-of-truth context
- the selected task file is included only when present
- no whole-repo scan occurs
- run artifacts now include `context_files` so the exact scoped file set is visible in logs

## Direct Agent Interaction Model

- an agent asks for one tool capability at a time
- the router checks:
  - current role
  - current task or context pack
  - requested tool category
- the router returns:
  - allowed action
  - rejected action with reason, or
  - required human confirmation point

No hidden chaining should occur inside the router.

## Agent Tool Usage Convention

- agents must request one tool capability at a time
- tool use must be allowed for the current role before execution
- tool use must stay within the active context pack or selected task scope
- failed tool calls should be reported clearly with the reason for denial or failure
- agents should not assume access to files or tools unless the router grants it for that role and request

Examples:

- Dev using `validate_task_file`:
  - allowed when Dev is working on one selected task and wants to confirm the task file structure before coding
- QA using `read_file`:
  - allowed when QA needs to inspect an Architect or Dev artifact as supporting review context
- PM denied `validate_queue`:
  - denied because PM is a read-first planning role and queue validation is outside the current role allowlist

## Tool Audit Logs

- every routed tool call is audited
- audit entries include:
  - role
  - tool
  - safe args subset
  - result
- denied calls are also audited
- no secrets or file contents are logged
- run artifacts include `tool_audit`
- an append-only local audit file exists at `logs/tool-router-audit.jsonl`

## Minimal Local MCP Server Plan

First local MCP server scope should stay small:

- expose a few stable capabilities only
- wrap existing local behaviors the repo already uses
- keep calls synchronous where possible
- prefer stateless request handling
- log request type, role, and target resource

Suggested first endpoints:

- `read_file`
- `write_file`
- `validate_task_file`
- `validate_queue`
- `list_queue`
- `run_verification_command`

## Security Boundaries

- local-only by default
- no secret exposure through router logs
- no unrestricted shell passthrough
- no automatic permission escalation
- no writes outside the current workspace
- no silent cross-task mutation
- explicit separation between:
  - queue state mutation
  - task validation
  - code execution

Human review should remain the boundary before risky or broad actions.

## Future Milestones

- define a stable router config file for tool categories and role policies
- add task-scoped write restrictions for Dev
- add artifact-aware context retrieval rules
- add clearer audit logging for tool use
- decide whether queue and task validation should move behind the router or stay as direct CLI helpers
- prototype a minimal local MCP server that mirrors the current CLI validation capabilities

## Audit Viewer

Agent Studio includes a read-only audit viewer:

```bash
node ./bin/run-agent.js audit list
```
