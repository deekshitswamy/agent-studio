# Context Pack: Agent Studio v8 UI

## Goal

Build a minimal local web UI for Agent Studio.

## Scope

- Select an agent
- Enter/select context pack path
- Optional task path
- Optional artifact path
- Run agent through local API
- View run metadata and logs

## Features

- Agent dropdown from GET /agents
- Run form using POST /runs
- Run result view
- Log view using GET /logs/:id

## Non-goals

- No auth
- No multi-user
- No database
- No production deployment
- No complex design system
- No real-time streaming

## Constraints

- Local-first
- Minimal UI
- Reuse existing v7 API
- Preserve Agent Runner behavior
