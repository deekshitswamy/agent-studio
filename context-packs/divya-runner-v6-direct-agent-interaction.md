# Context Pack: DIVYA Agent Runner v6 Direct Agent Interaction

## Goal

Enable clean, direct interaction with any agent using the existing Agent Runner system.

## Scope

- Improve direct agent execution UX
- Standardize agent interaction format
- Ensure context + tools are correctly scoped
- Keep single-agent execution model

## Features

- Direct agent commands:
  - PM
  - Architect
  - Task Planner
  - Dev
  - QA
- Clean input → output loop
- Consistent structured responses

## Non-goals

- No agent chaining
- No automation
- No UI
- No async execution
- No background jobs

## Constraints

- Must reuse:
  - context builder
  - tool router
  - MCP tools
- Must remain CLI-first
- Must remain human-in-the-loop
