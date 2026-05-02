# Context Pack: DIVYA Agent Runner v1

## Goal

Build a minimal CLI-based Agent Runner that executes the agent workflow using repo files.

## Scope

- Read the provided context pack file
- Run orchestrator logic
- Generate next agent prompt
- Output structured result
- Store outputs in project folders

## Features (MVP)

- CLI command: `run-agent`
- Reads:
  - context pack file
  - AGENTS.md
  - system/agent-runner.md
- Outputs:
  - structured agent response
- Writes:
  - logs
  - next-step prompt

## Optional Source Material

- `idea.md` may exist as project source material, but it is not required for Agent Runner v1

## Non-goals

- No UI
- No automation yet
- No API integration
- No async execution

## Constraints

- Minimal implementation
- File-based system only
- No overengineering

## Acceptance Criteria

- `run-agent <context-pack-file>` is the primary v1 contract
- `idea.md` is optional source material, not a required runtime input
