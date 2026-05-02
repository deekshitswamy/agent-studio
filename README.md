# Agent Studio

Agent Studio is a repo-native, human-in-the-loop agent workflow system for planning, executing, and verifying bounded work from files instead of chat memory.

DIVYA remains the assistant/orchestrator identity used inside the workflow. The project identity of the repository is Agent Studio.

## Current Capabilities

### v1
- context-pack-driven execution
- direct agent runs
- bounded chaining through PM, Architect, Task Planner, and QA
- state-aware prompts, quality checks, and repo-native logs

### v2
- file-based task queue with `tasks.json`
- queue list, start, complete, and validate commands

### v3
- task lifecycle conventions
- validated task templates
- one-task-per-Dev-run workflow

### v4
- local tool router
- deterministic context builder
- tool audit logs and audit viewer

### v5
- local read-only MCP server skeleton
- read-only MCP tool adapters
- safe `read_file` policy for MCP

### v6
- direct-agent CLI contract docs
- shared direct-agent response format
- Dev task guardrails
- direct-agent context validation rules
- direct-agent QA checklist

## Basic Commands

Core runner:

```bash
node ./bin/run-agent.js <context-pack-file>
node ./bin/run-agent.js <context-pack-file> --execute
node ./bin/run-agent.js <context-pack-file> --execute --llm --chain 4
node ./bin/run-agent.js <context-pack-file> --agent <role> --llm
node ./bin/run-agent.js <context-pack-file> --agent dev --llm --task <task-file>
```

Queue and validation:

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

## Source Of Truth

- `AGENTS.md`
- `SYSTEM_STATUS.md`
- `system/agent-runner.md`
- `releases/`
- `state/`
- `logs/`
