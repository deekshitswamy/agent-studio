# Agent Studio

## Purpose

This file defines the operating workflow for Agent Studio. It describes how one execution moves from idea intake to retrospective, with each role contributing a specific output.

Agent Studio is the project identity. DIVYA remains the assistant/orchestrator identity inside the workflow.

Use this as the execution map. Use `AGENTS.md` as the top-level contract.

## Workflow

### 1. Idea Intake

Capture the request in plain language.

The intake source can come from chat, notes, or optional project material such as `idea.md`, but Agent Studio v1 should normalize that input into a context pack before execution.

Output:

- problem statement
- desired outcome
- constraints
- success signal

If the request is vague, tighten it before downstream planning starts.

### 2. Project Initialization

Create or update the execution context pack from [`../templates/context-pack-template.md`](../templates/context-pack-template.md).

For v1, this context pack is the primary file passed to `run-agent`.

Initialization should define:

- scope for this execution only
- known repo state
- files likely to change
- risks and assumptions
- verification approach
- optional supporting source material, if any

### 3. Orchestrator

The orchestrator owns flow control across the execution.

Responsibilities:

- sequence the role handoffs
- keep work within scope
- decide when a role needs to re-enter
- ensure outputs are written back into repo artifacts

The orchestrator does not absorb every role's work. It coordinates.

### 4. PM

The PM turns the request into an execution-ready brief.

Responsibilities:

- refine objective
- define acceptance criteria
- identify dependencies and tradeoffs
- keep scope practical for one execution

Primary output:

- clarified execution brief in the context pack

### 5. Architect

The architect defines the structure before implementation begins.

Responsibilities:

- choose the simplest durable approach
- identify affected system boundaries
- define interfaces, artifacts, or workflow structure
- prevent premature build-out

Primary output:

- implementation approach and decision notes

### 6. UX

The UX role protects operator clarity and future usability, even in non-UI work.

Responsibilities:

- improve readability of process artifacts
- reduce ambiguity in templates
- ensure future agents can follow the workflow quickly

Primary output:

- clarity improvements to docs, templates, and naming

Optional project design handoff workflow:

1. Human explicitly chooses UX Designer when a design pass is needed before implementation.
2. UX Designer produces `projects/<project-id>/design/handoff.md`.
3. Human reviews the handoff before using it downstream.
4. Task Planner may use that handoff as supporting context for saved Dev tasks.

Rules:

- UX Designer is optional and human-triggered
- UX Designer does not auto-chain into Task Planner or Dev
- the current task and file workflow remains the source of truth
- the design folder contract is:
  - `projects/<project-id>/design/handoff.md` required when a design handoff exists
  - additional design files may exist later, but are optional for now

### 7. Task Planner

The task planner converts the approach into an ordered execution list.

Responsibilities:

- break work into small steps
- define sequence and dependencies
- separate now vs later
- explicitly mark out-of-scope work

Primary output:

- execution checklist inside the context pack or working notes
- one task file per executable task under `tasks/<task-id>.md` when a task is ready for direct Dev selection

Task selection workflow:

1. Run Task Planner to produce small executable tasks.
2. Save each selected implementation-ready task as `tasks/<task-id>.md`.
3. Keep human-in-the-loop selection. Do not auto-run tasks.
4. Pick one task file and run Dev directly:
   `node ./bin/run-agent.js <context-pack> --agent dev --llm --task <task-file>`
5. Dev should work on exactly that one selected task only.

### 8. Dev Execution

The execution agent makes the actual repo changes.

Responsibilities:

- change only what is needed for current scope
- keep edits concise and consistent
- update docs/templates as source of truth
- avoid bundling speculative future work

Primary output:

- completed changes
- updated context artifacts where needed

## Direct Agent CLI Contract

Direct-agent execution is the bounded way to run one role directly without orchestrator-first chaining.

Contract:

```bash
node ./bin/run-agent.js <context-pack-file> --agent <role>
```

Rules:

- the context pack remains the required primary input
- direct-agent execution still follows the one-agent-per-execution rule
- the selected role runs alone for that execution
- no bounded chain is used when `--agent` is present
- supporting artifact context may be added only when explicitly provided

Supported direct-agent pattern examples:

```bash
node ./bin/run-agent.js context-packs/divya-runner-v1.md --agent pm
node ./bin/run-agent.js context-packs/divya-runner-v1.md --agent architect --llm
node ./bin/run-agent.js context-packs/divya-runner-v1.md --agent task-planner --llm
node ./bin/run-agent.js context-packs/divya-runner-v1.md --agent qa --llm --with-artifact logs/<artifact>.md
node ./bin/run-agent.js context-packs/divya-runner-v1.md --agent dev --llm --task tasks/<task-id>.md
```

Dev direct-agent rule:

- Dev should be run with `--task <task-file>`
- the selected task file must represent exactly one task
- Dev should not be used without a single explicit task selection unless the operator is intentionally doing a bounded non-coding check
- Dev should not auto-select work from `tasks/` or `tasks.json`
- Dev should not combine multiple task files or absorb adjacent work into the same run
- if no task file is explicitly selected, the correct next step is to stop and let the human choose one task

Interaction boundary:

- direct-agent mode is CLI-first
- human chooses the role
- human chooses the context pack
- human chooses the task file for Dev
- runner loads only scoped context and approved tool access for that role

Context validation rules:

- the context pack is always the primary required input for a direct-agent run
- Dev receives a selected task file only when the human explicitly provides `--task <task-file>`
- QA or other review-style direct-agent runs may receive supporting artifact context only when the human explicitly provides it
- supporting artifact context does not replace the context pack as primary input
- agents should not assume broad repo context, unrelated file loading, or whole-repo scanning
- direct-agent context should stay aligned with the existing deterministic context builder rather than expanding ad hoc

## Direct Agent Response Format

Direct-agent responses should be markdown-first, readable in the CLI, and consistent across roles without becoming a strict machine schema.

Shared format:

```md
## Summary

Short description of what was done

## Output

Main content for the role:
- brief
- design
- task plan
- implementation notes
- review result

## Next Action

What the human should do next

## Warnings

Optional risks, assumptions, or constraints
```

Response rules:

- `Summary` should stay short
- `Output` carries the main role-specific content
- `Next Action` should be concrete and human-facing
- `Warnings` is optional and should appear only when it adds real signal
- roles may add light structure inside `Output`, but should not replace the shared top-level shape
- this format does not introduce JSON, CLI changes, chaining, or automation behavior

Role examples:

PM example:

```md
## Summary

Clarified the execution brief for the selected context pack.

## Output

- Objective: tighten the current direct-agent contract
- Acceptance Criteria:
  - keep single-agent execution
  - preserve context-pack-first input
- Risks:
  - avoid mixing direct-agent UX work with chain changes

## Next Action

Hand off to Architect only if the task requires structure/design work.
```

Architect example:

```md
## Summary

Defined the smallest durable design for the current execution.

## Output

- Design Approach:
  - reuse the existing context builder and tool router
- File Reads:
  - `system/agent-runner.md`
  - relevant prompt files
- Output Artifact Locations:
  - `docs/`
  - `logs/`

## Next Action

Implement only the documented design boundary in the next selected task.
```

Task Planner example:

```md
## Summary

Converted the approved design into small executable tasks.

## Output

- Task 1: document direct-agent contract
- Task 2: document shared response format
- Out of Scope:
  - CLI changes
  - automation

## Next Action

Human selects one task file for the next direct Dev run.
```

Dev example:

```md
## Summary

Completed the selected documentation task without changing runner behavior.

## Output

- Files Changed:
  - `system/agent-runner.md`
  - `logs/<dev-log>.md`
- Verification:
  - task validation passed
- Scope Drift Check:
  - no CLI or automation changes

## Next Action

Review the updated docs and choose the next bounded task.

## Warnings

This execution updated process docs only.
```

QA example:

```md
## Summary

Reviewed whether the direct-agent output is ready for the next handoff.

## Output

- Passed Checks:
  - context pack remained primary
  - scope stayed bounded
- Failed Checks:
  - none
- Decision:
  - pass

## Next Action

Proceed with the next bounded human-selected step.
```

## Direct Agent QA Checklist

Use this checklist to review a direct-agent execution before accepting the result or handing it off.

General checks:

- the intended agent role was selected explicitly
- the context pack was provided and remained the primary input
- the run stayed within single-agent execution
- no unintended chaining, automation, async work, UI work, or background-job behavior was introduced
- the response follows the shared direct-agent response format

Dev-specific checks:

- Dev used exactly one explicit task file
- Dev did not auto-select from `tasks/` or `tasks.json`
- Dev did not combine multiple tasks or absorb adjacent work
- Dev changed only files required by the selected task
- Dev included verification steps and a scope-drift check

Context checks:

- supporting task or artifact context was used only when explicitly provided
- the context pack remained the source of truth for the execution
- the agent did not assume broad repo context or unrelated file contents

Tool usage checks:

- tools were used only through the approved router or MCP path
- the execution did not bypass scoped tool access
- tool use stayed limited to the selected role and current task

Output checks:

- the response includes `Summary`, `Output`, and `Next Action`
- `Warnings` are included when risks, assumptions, or incomplete verification matter
- the result is concise, human-readable, and suitable for the next handoff

### 9. QA

QA verifies the execution against the acceptance criteria.

Responsibilities:

- confirm requested artifacts were created or updated
- confirm references and structure are correct
- check for duplication, ambiguity, and scope drift
- record any gaps honestly

Primary output:

- verification notes for the dev log

Bounded chain note:

- default step 4 is `Task Planner`
- optional step 4 is `QA` when explicitly requested
- `QA` replaces `Task Planner` for that run
- do not run `Architect -> QA -> Task Planner` in one bounded execution

### 10. DevOps

The devops role ensures the work is operationally usable by future sessions.

Responsibilities:

- confirm file placement and naming conventions
- confirm repo-state assumptions are documented
- make sure next-step instructions are practical

Primary output:

- continuity notes and operational checks

### 11. Retrospective

Close the execution with a short calibration pass using [`../templates/calibration-retrospective-template.md`](../templates/calibration-retrospective-template.md).

Capture:

- what worked
- what slowed execution down
- what should change in the workflow
- what follow-up should be queued

## Standard Execution Artifacts

- context pack
- task files under `tasks/` for human-selected Dev work
- repo-root `tasks.json` for optional human-managed queue state in v2 planning
- `queue validate` for read-only queue integrity checks in v2 planning
- `task validate` for read-only task file structure checks before Dev execution
- tool-router audit entries in local logs and run artifacts when routed tools are used
- dev log
- calibration retrospective when the execution changes the operating system or reveals workflow issues

## Operating Defaults

- One primary agent per execution
- Repo files override chat memory
- Concise artifacts beat long narrative notes
- New ideas go to future scope unless required for current acceptance criteria

---

# Task Lifecycle (v3)

## States

- `pending` → task is defined but not started
- `in-progress` → task is actively being worked on
- `done` → task is completed and verified

These are human-managed states only.

## Lifecycle Flow

1. Task is created under `tasks/<task-id>.md`
2. Task is added to `tasks.json` (optional queue)
3. Human selects ONE task
4. Mark task as `in-progress`:

```bash
node ./bin/run-agent.js queue start <task-id>
```
