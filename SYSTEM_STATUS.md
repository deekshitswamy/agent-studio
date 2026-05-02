# Agent Studio System Status

Status: Active  
Operating Model: Human-in-the-loop  
Primary Contract: `node ./bin/run-agent.js <context-pack-file>`

Project Name: Agent Studio  
Assistant/Orchestrator Identity: DIVYA

## Current Version Line

- `v1`:
  - file-based Agent Studio foundation
  - context-pack-driven execution
  - direct agent runs
  - bounded chains through PM, Architect, Task Planner, or QA
  - quality checks, state-aware prompts, logs
- `v2`:
  - minimal file-based task queue
  - `tasks.json`
  - `queue list`, `queue start`, `queue complete`, `queue validate`
- `v3`:
  - task lifecycle conventions
  - validated task-file structure
  - human-selected one-task Dev workflow
- `v4`:
  - local tool-router foundation
  - deterministic context builder
  - tool audit logs
  - read-only audit viewer
- `v5`:
  - local MCP server skeleton
  - read-only MCP tool adapters
  - safe `read_file` policy for MCP
  - verified release note for the current prototype
- `v6`:
  - direct-agent CLI contract documentation
  - shared direct-agent response format
  - Dev task guardrails
  - direct-agent context validation
  - direct-agent QA checklist

## Current Direct-Agent Contract

- primary contract remains:
  - `node ./bin/run-agent.js <context-pack-file>`
- direct-agent path:
  - `node ./bin/run-agent.js <context-pack-file> --agent <role>`
- direct-agent mode stays single-agent and human-selected
- Dev should be used with:
  - `node ./bin/run-agent.js <context-pack-file> --agent dev --llm --task <task-file>`
- Dev does not auto-pick work from `tasks/` or `tasks.json`
- one selected task file equals one Dev run
- `--agent` does not introduce chaining
- artifact context is optional supporting input, not the primary input
- direct-agent context stays scoped:
  - context pack is primary
  - task context is explicit for Dev
  - artifact context is explicit and supporting-only
- direct-agent responses now have one shared markdown-first documentation format:
  - `Summary`
  - `Output`
  - `Next Action`
  - optional `Warnings`
- direct-agent QA now has a documented checklist in:
  - `system/agent-runner.md`

## Current Architecture Summary

- Repo files are the source of truth, not chat history.
- `AGENTS.md` defines the operating rules.
- `system/agent-runner.md` defines the Agent Studio workflow and lifecycle.
- `bin/run-agent.js` is the main Agent Studio CLI runner.
- `prompts/` holds role prompts.
- `tasks/` holds human-selected work items.
- `tasks.json` is the optional queue state file.
- `src/tool-router.js` gates local tool usage by role.
- `src/context-builder.js` keeps agent context narrow and deterministic.
- `bin/mcp-server.js` and `src/mcp/` hold the local read-only MCP prototype.
- `logs/`, `releases/`, `state/`, and `retrospectives/` capture execution history and system status.

## Intentionally Not Supported

- no unlimited chaining
- no chain longer than 4 steps
- no automatic `QA -> Task Planner` continuation
- no Dev execution inside bounded chains
- no autonomous execution loop
- no background or async workflow engine
- no UI
- no database-backed state
- no write-enabled MCP tools
- no shell execution through MCP
- no external network integrations for the MCP layer

## Recommended Next Milestone

Pick one bounded follow-up and keep it human-selected:

- tighten task lifecycle/operator docs and warnings, or
- extend the local MCP layer carefully without breaking the current read-only boundary

If MCP work continues, the safest next milestone is a small, explicit operator/workflow doc pass before adding more protocol surface.

## How To Resume Work Later

1. Read [AGENTS.md](/Users/deekshitswamy/Documents/GitHub/Agent%20Runner/AGENTS.md).
2. Read [SYSTEM_STATUS.md](/Users/deekshitswamy/Documents/GitHub/Agent%20Runner/SYSTEM_STATUS.md).
3. Read [system/agent-runner.md](/Users/deekshitswamy/Documents/GitHub/Agent%20Runner/system/agent-runner.md).
4. Read the relevant state file:
   - [state/divya-runner-v1.md](/Users/deekshitswamy/Documents/GitHub/Agent%20Runner/state/divya-runner-v1.md)
   - [state/divya-runner-v2-task-queue.md](/Users/deekshitswamy/Documents/GitHub/Agent%20Runner/state/divya-runner-v2-task-queue.md)
5. Read the relevant release note:
   - [releases/agent-runner-v1.md](/Users/deekshitswamy/Documents/GitHub/Agent%20Runner/releases/agent-runner-v1.md)
   - [releases/agent-runner-v2-task-queue.md](/Users/deekshitswamy/Documents/GitHub/Agent%20Runner/releases/agent-runner-v2-task-queue.md)
   - [releases/agent-runner-v5-local-mcp-server.md](/Users/deekshitswamy/Documents/GitHub/Agent%20Runner/releases/agent-runner-v5-local-mcp-server.md)
6. Choose one context pack or one selected task before running anything.
7. Keep scope bounded to that single execution.

## Key Commands

Core runner:

```bash
node ./bin/run-agent.js <context-pack-file>
node ./bin/run-agent.js <context-pack-file> --execute
node ./bin/run-agent.js <context-pack-file> --execute --llm --chain 4
node ./bin/run-agent.js <context-pack-file> --agent <role> --llm
node ./bin/run-agent.js <context-pack-file> --agent dev --llm --task <task-file>
```

Queue and task checks:

```bash
node ./bin/run-agent.js queue list
node ./bin/run-agent.js queue start <task-id>
node ./bin/run-agent.js queue complete <task-id>
node ./bin/run-agent.js queue validate
node ./bin/run-agent.js task validate <task-file>
```

Audit and MCP:

```bash
node ./bin/run-agent.js audit list
node ./bin/mcp-server.js --print-tools
node ./bin/mcp-server.js --json
```
