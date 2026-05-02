# task-planner Execution Output
## Metadata
- Timestamp: 2026-05-01T23:01:21.029Z
- Agent: task-planner
- Mode: llm
- Prompt File: prompts/task-planner.md
- Model: gpt-5.5
## Output
## Summary

Converted the Architect handoff into small, human-selectable implementation tasks for the local read-only MCP server prototype.

No code should be implemented in this Task Planner step. Each task below is intended to be saved as an individual file under `tasks/<task-id>.md` before a human selects exactly one for Dev execution.

## Clarified Objective

Create implementation-ready task definitions for a minimal local-only MCP server that exposes these read-only tools only:

- `read_file`
- `validate_task_file`
- `validate_queue`
- `list_queue`
- `audit_list`

The tasks preserve the approved architecture:

```text
bin/
  mcp-server.js

src/
  mcp/
    server.js
    tools.js
    safe-paths.js
```

Existing CLI behavior, especially `bin/run-agent.js`, must remain unchanged.

## Acceptance Criteria

Task planning is complete when:

- Work is split into small Dev-executable slices.
- Each task has:
  - Title
  - Goal
  - Dependencies
  - Acceptance Criteria
  - Out of Scope
- Tasks do not expand beyond the Architect handoff.
- Tasks preserve human-in-the-loop selection.
- No task implies autonomous execution, write tools, shell execution, UI, deployment, or external integrations.

---

## Proposed Task Files

### `tasks/mcp-001-inspect-reusable-modules.md`

```markdown
# Task: Inspect reusable modules for MCP read-only tools

## Goal

Identify the existing repo files and functions that can support the planned read-only MCP tools without changing behavior.

Approved tools to inspect for:

- `validate_task_file`
- `validate_queue`
- `list_queue`
- `audit_list`
- `read_file`

This task should produce written notes only. It should not implement the MCP server.

## Dependencies

- Architect handoff for DIVYA Agent Runner v5 local MCP server.
- Existing repo files, especially:
  - `bin/run-agent.js`
  - queue validation/listing modules or command handlers
  - task validation modules or command handlers
  - audit listing/log modules
  - existing file reading helpers, if any
  - `system/agent-runner.md`

## Acceptance Criteria

- Identify the current implementation locations for:
  - queue validation
  - task file validation
  - queue listing
  - audit listing
  - any existing safe file-read behavior
- Note whether each capability is already reusable as a function or currently coupled to CLI handling.
- Document any minimal extraction likely needed for later tasks.
- Confirm no behavior changes were made.
- Record findings in a concise markdown artifact or dev log entry.

## Out of Scope

- No MCP server implementation.
- No new tool registry.
- No safe path policy implementation.
- No refactoring unless strictly limited to documentation comments or notes.
- No CLI behavior changes.
- No write tools.
- No shell execution.
- No autonomous task execution.
```

---

### `tasks/mcp-002-add-local-mcp-server-skeleton.md`

```markdown
# Task: Add local MCP server skeleton

## Goal

Add the minimal file structure for a separate local MCP server entrypoint without changing existing CLI runner behavior.

Expected structure:

```text
bin/
  mcp-server.js

src/
  mcp/
    server.js
    tools.js
```

The skeleton should establish the MCP adapter boundary but should not fully implement all tool behavior unless required for basic registration.

## Dependencies

- `tasks/mcp-001-inspect-reusable-modules.md` should be completed or equivalent module-inspection notes should exist.
- Existing CLI behavior in `bin/run-agent.js` must be understood enough to avoid modification.

## Acceptance Criteria

- `bin/mcp-server.js` exists as a separate entrypoint.
- `bin/run-agent.js` remains unchanged unless a documented import-safe refactor is absolutely required.
- `src/mcp/server.js` exists and contains the local MCP server setup boundary.
- `src/mcp/tools.js` exists and defines the approved tool registry boundary.
- Only approved tools are named or registered:
  - `read_file`
  - `validate_task_file`
  - `validate_queue`
  - `list_queue`
  - `audit_list`
- No write-capable tools are added.
- No shell execution is introduced.
- No external network integration is introduced.
- Existing CLI commands continue to work as before.

## Out of Scope

- No full adapter wiring for every tool unless necessary for skeleton validation.
- No safe path policy implementation beyond placeholders or clearly marked TODOs.
- No production deployment configuration.
- No authentication layer.
- No UI.
- No autonomous task execution.
```

---

### `tasks/mcp-003-implement-readonly-tool-adapters.md`

```markdown
# Task: Implement read-only MCP tool adapters

## Goal

Wire the approved MCP tools to existing Agent Runner capabilities using thin read-only adapters.

Approved tools:

- `validate_task_file`
- `validate_queue`
- `list_queue`
- `audit_list`
- `read_file`

The adapters should reuse existing modules where practical and avoid duplicating CLI logic.

## Dependencies

- `tasks/mcp-001-inspect-reusable-modules.md`
- `tasks/mcp-002-add-local-mcp-server-skeleton.md`
- Existing reusable validation/listing/audit functions, or documented small extractions from CLI-coupled code.

## Acceptance Criteria

- MCP tool registry exposes only the approved tools.
- `validate_task_file` delegates to existing task validation logic where practical.
- `validate_queue` delegates to existing queue validation logic where practical.
- `list_queue` delegates to existing queue listing logic where practical.
- `audit_list` delegates to existing audit listing logic where practical.
- `read_file` is wired through the safe path policy module if that module already exists.
- Tool handlers do not mutate files or queue state.
- Tool handlers do not invoke shell commands.
- Existing CLI behavior remains unchanged.
- Any required extraction from CLI-coupled code is minimal and documented.

## Out of Scope

- No write tools.
- No task start, task completion, or queue mutation tools.
- No shell execution.
- No external integrations.
- No UI.
- No production deployment.
- No broad refactor of the runner.
```

---

### `tasks/mcp-004-implement-safe-read-file-policy.md`

```markdown
# Task: Implement safe path policy for MCP read_file

## Goal

Implement a strict repo-local safe path policy for the MCP `read_file` tool.

The policy should prevent arbitrary filesystem reads and keep `read_file` read-only.

Expected module:

```text
src/mcp/safe-paths.js
```

## Dependencies

- `tasks/mcp-002-add-local-mcp-server-skeleton.md`
- Existing repo root resolution conventions, if any.
- The MCP `read_file` adapter from `tasks/mcp-003-implement-readonly-tool-adapters.md`, or a clearly defined placeholder that can call the safe path policy.

## Acceptance Criteria

- `read_file` accepts only repo-relative paths or explicitly approved local paths.
- Absolute arbitrary paths are rejected.
- Parent-directory escape attempts are rejected.
- Resolved paths must remain inside the repo root.
- Hidden or sensitive paths are rejected unless explicitly allowed.
- Reads are file-only and read-only.
- No directory traversal listing is added.
- No shell execution is used.
- Rejection errors are clear enough for local operator debugging without leaking unnecessary sensitive path details.
- Focused validation or tests are added if the repo has an existing test/validation pattern for this type of module.

## Out of Scope

- No broad filesystem browser.
- No directory listing tool.
- No write access.
- No remote file access.
- No external integrations.
- No UI.
- No production security hardening beyond the local prototype policy.
```

---

### `tasks/mcp-005-verify-and-document-mcp-prototype.md`

```markdown
# Task: Verify and document local read-only MCP prototype

## Goal

Verify the implemented MCP prototype against the approved architecture and document the result.

This task should confirm the server remains local-only, read-only, and separate from the existing CLI runner.

## Dependencies

- `tasks/mcp-002-add-local-mcp-server-skeleton.md`
- `tasks/mcp-003-implement-readonly-tool-adapters.md`
- `tasks/mcp-004-implement-safe-read-file-policy.md`

## Acceptance Criteria

- Confirm `bin/mcp-server.js` exists and is separate from `bin/run-agent.js`.
- Confirm existing CLI behavior still works unchanged for relevant commands.
- Confirm the MCP tool registry exposes only:
  - `read_file`
  - `validate_task_file`
  - `validate_queue`
  - `list_queue`
  - `audit_list`
- Confirm all MCP tools are read-only.
- Confirm no shell execution is available through the MCP layer.
- Confirm no external network integrations were introduced.
- Confirm `read_file` rejects unsafe paths, including:
  - absolute arbitrary paths
  - parent-directory escapes
  - hidden/sensitive paths unless explicitly allowed
- Confirm queue/task/audit tools do not mutate files or queue state.
- Add or update a dev log artifact summarizing:
  - files changed
  - verification performed
  - known limitations
  - follow-up recommendations, if any

## Out of Scope

- No new MCP features.
- No write tools.
- No deployment work.
- No UI.
- No external integrations.
- No autonomous task execution.
- No expansion of the initial tool list.
```

## Risks Or Assumptions

- Assumption: the repo already has validation/listing/audit logic that can be reused or lightly extracted.
- Assumption: task files will be saved by a later execution or human operator before Dev selection.
- Risk: some existing functions may be tightly coupled to CLI argument parsing, requiring a small extraction task before adapters can be cleanly implemented.
- Risk: `read_file` needs careful review because it is the highest-risk read-only capability.
- Risk: “local-only” behavior depends on the selected MCP transport and must be verified during implementation.

## Recommended Next Handoff

Handoff to a human operator to save the selected task files under `tasks/`.

Recommended first Dev task:

```text
tasks/mcp-001-inspect-reusable-modules.md
```

Then run Dev on exactly one selected task, for example:

```bash
node ./bin/run-agent.js <context-pack> --agent dev --llm --task tasks/mcp-001-inspect-reusable-modules.md
```
