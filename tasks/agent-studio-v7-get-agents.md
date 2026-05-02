# Selected Task

## Task

agent-studio-v7-get-agents

## Status

done

## Objective

- Expose a local API endpoint that returns the supported Agent Studio direct-agent roles.

## Context Pack

- `context-packs/agent-studio-v7-service-layer.md`

## Scope

- add `GET /agents`
- return supported direct-agent roles
- keep the response simple JSON

## Out of Scope

- no agent execution
- no `/runs` implementation
- no database
- no auth
- no UI
- no dynamic plugin loading

## Acceptance Criteria

- `GET /agents` returns supported roles:
  - `pm`
  - `architect`
  - `task-planner`
  - `dev`
  - `qa`
- endpoint does not invent unsupported agents
- existing `/` and `/health` still work
- existing CLI behavior remains unchanged

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v7-get-agents.md
node -c server/agent-service.js
node server/agent-service.js
curl http://127.0.0.1:3000/
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/agents
```

## Dev Handoff

- Inspect:
  - `context-packs/agent-studio-v7-service-layer.md`
  - `tasks/agent-studio-v7-get-agents.md`
  - `server/agent-service.js`
- Keep any follow-up bounded to one explicit service endpoint or one explicit runner-integration task.
