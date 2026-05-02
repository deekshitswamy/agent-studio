# Selected Task

## Task

T4-add-context-retrieval-layer

## Status

done

## Objective

Add a minimal context retrieval layer so agents receive only relevant repo context instead of broad file loading.

## Context Pack

context-packs/divya-runner-v4-mcp-tool-router.md

## Scope

- Add a context builder module
- Build context based on:
  - context pack
  - selected task file (if present)
  - AGENTS.md
  - system/agent-runner.md
- Avoid loading unrelated files
- Integrate with tool router

## Out of Scope

- No vector DB
- No embeddings
- No semantic search
- No external indexing
- No async retrieval

## Acceptance Criteria

- Agent receives minimal scoped context
- Context is deterministic and predictable
- No full repo loading
- Existing flows continue working

## Verification

- Run Dev / PM / QA
- Inspect logs → confirm only relevant files used

## Dev Handoff

Check:

- src/agent-runner.js
- create src/context-builder.js
- integrate before agent execution
