# Context Pack: Agent Studio v7 Service Layer

## Goal

Expose Agent Runner through a minimal local API service.

## Scope

- Add API server layer
- Run existing Agent Runner commands from API
- Return run metadata and logs
- Preserve CLI behavior

## Features

- GET /agents
- POST /runs
- GET /runs/:id
- GET /logs/:id

## Non-goals

- No UI yet
- No auth yet
- No multi-user
- No background job system
- No database
- No production deployment

## Constraints

- Local-first
- Minimal implementation
- Human-in-the-loop
- Reuse existing runner
- Preserve Agent Runner CLI
