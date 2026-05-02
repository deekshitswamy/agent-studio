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
- `v7`:
  - local API server
  - `GET /agents`
  - `POST /runs`
  - `GET /runs/:id`
  - `GET /logs/:id`
- `v8`:
  - local browser UI
  - run form, log viewer, and served static UI
- `v9`:
  - saved task listing
  - Task Planner source detection
  - editable unsaved drafts
  - human-reviewed task saving
- `v10`:
  - Run Dev directly from saved tasks in the UI
- `v12`:
  - guided workflow hints in the UI
  - local context-pack and next-step guidance
- `v13`:
  - lightweight project workspace layer
  - project-scoped tasks
  - project-scoped runs and logs
  - legacy fallback when no project is selected
- `v17`:
  - Docker-based project runner sandbox
  - legacy non-project runs still use local execution
  - project-scoped runs execute through a short-lived runner container
- `v18`:
  - Run Idea flow in the UI
  - PM run followed by Task Planner run
  - drafts surface in the existing Unsaved Drafts panel
- `v19`:
  - structured Dev write artifacts
  - safe project-scoped file application after Dev runs
  - no write application for non-project runs

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
- `projects/<project-id>/tasks/` holds optional project-scoped task files.
- `tasks.json` is the optional queue state file.
- `projects/<project-id>/.local/runs/` holds optional project-scoped run artifacts.
- `docker-compose.yml` now defines both the local API/UI service and the short-lived project runner service.
- `ui/index.html` now supports both direct runs and an idea-to-drafts PM -> Task Planner flow.
- project-scoped Dev runs can now emit structured write artifacts that the API validates and applies inside `projects/<project-id>/` only.
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
- no database-backed state
- no project creation flow
- no production isolation guarantees for the Docker sandbox
- no write-enabled MCP tools
- no shell execution through MCP
- no external network integrations for the MCP layer
- no patch/delete/rename support for Dev write artifacts

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
   - [releases/agent-studio-v8-ui.md](/Users/deekshitswamy/Documents/GitHub/Agent%20Runner/releases/agent-studio-v8-ui.md)
   - [releases/agent-studio-v9-task-drafts.md](/Users/deekshitswamy/Documents/GitHub/Agent%20Runner/releases/agent-studio-v9-task-drafts.md)
   - [releases/agent-studio-v13-project-workspaces.md](/Users/deekshitswamy/Documents/GitHub/Agent%20Runner/releases/agent-studio-v13-project-workspaces.md)
   - [releases/agent-studio-v17-project-runner.md](/Users/deekshitswamy/Documents/GitHub/Agent%20Runner/releases/agent-studio-v17-project-runner.md)
   - [releases/agent-studio-v18-run-idea.md](/Users/deekshitswamy/Documents/GitHub/Agent%20Runner/releases/agent-studio-v18-run-idea.md)
   - [releases/agent-studio-v19-dev-write-artifacts.md](/Users/deekshitswamy/Documents/GitHub/Agent%20Runner/releases/agent-studio-v19-dev-write-artifacts.md)
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
