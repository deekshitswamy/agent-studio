# AGENTS.md

## Purpose
This repo is the repo-native operating foundation for Agent Studio.

Agent Studio is the project identity for the repository and toolchain. DIVYA remains the assistant/orchestrator identity used inside the workflow.

Its job is to let future Codex sessions continue improving the agent system from files in this repository, not from chat history. The files here are the source of truth for workflow, coordination, handoff, and calibration.

## How Agents Should Work
- Start from repo files first, especially this file, [`system/agent-runner.md`](./system/agent-runner.md), and the templates in [`templates/`](./templates/).
- Turn each meaningful effort into a small documented execution with a clear goal, inputs, outputs, and verification steps.
- Prefer editing or adding markdown process artifacts before building software when the work is still defining the system.
- Leave enough written context that a later Codex session can continue without needing prior chat context.

## Rules

### One-Agent-Per-Execution Rule
Each execution should have one primary agent responsible for one clearly defined task or change set.

Do not mix multiple unrelated objectives into a single execution. If a request expands, split it into separate planned executions.

### Context-Pack Rule
Before substantial work, prepare or update a context pack using [`templates/context-pack-template.md`](./templates/context-pack-template.md).

For Agent Studio v1, the context pack file is the required execution input. Raw source material such as `idea.md` is optional and should only be treated as supporting input when the context pack references it.

The context pack should capture:
- objective
- current state
- relevant files
- constraints
- assumptions
- verification plan
- explicit out-of-scope items

### Dev-Log Rule
Every execution should leave a short dev log using [`templates/dev-log-template.md`](./templates/dev-log-template.md).

The dev log is the continuity layer between sessions. It should record what changed, why it changed, what was verified, and what still needs attention.

Store dev logs in `/logs/` unless a better execution-specific location is explicitly defined.

### Scope-Drift Rule
When new ideas appear during execution, do not silently absorb them into the current task.

Instead:
1. finish the current scope if still valid, or pause and restate scope
2. note the new idea in the dev log or retrospective
3. schedule it as a future execution if needed

### Source-of-Truth Rule
If chat instructions and repo files diverge, update the repo files so the next session inherits the corrected operating model.

Do not treat memory of previous chats as durable system state.

## How To Verify Changes
- Confirm the requested files exist in the intended locations.
- Check that each file is concise, readable, and non-duplicative.
- Confirm links and references between markdown files are correct.
- Ensure the execution stayed within stated scope.
- If code or infrastructure is not being changed, do not invent app-level validation; verify the markdown/process layer itself.

## Primary References
- [`system/agent-runner.md`](./system/agent-runner.md)
- [`templates/context-pack-template.md`](./templates/context-pack-template.md)
- [`templates/dev-log-template.md`](./templates/dev-log-template.md)
- [`templates/calibration-retrospective-template.md`](./templates/calibration-retrospective-template.md)
- [`logs/`](./logs/)
