# Task: Build Minimal Local UI Shell

## Task

- `agent-studio-v8-build-local-ui-shell`

## Status

done

## Objective

Create the smallest local web UI shell for Agent Studio.

## Context Pack

context-packs/agent-studio-v8-ui.md

## Scope

- Create `ui/index.html`
- Add one run form
- Add one result panel
- Add one log panel
- Use plain HTML/CSS/JS
- No API wiring yet beyond placeholders

## Out of Scope

- No backend changes
- No framework
- No auth
- No database
- No streaming
- No polling
- No production deployment

## Acceptance Criteria

- `ui/index.html` exists
- UI includes:
  - agent dropdown placeholder
  - required context pack path input
  - optional task path input
  - optional artifact path input
  - run button
  - result display area
  - log id input
  - fetch logs button
  - log display area
- Minimal readable styling
- Can be opened locally in browser
- No Agent Runner/API behavior changed

## Verification

```bash
node ./bin/run-agent.js task validate tasks/agent-studio-v8-build-local-ui-shell.md
```

## Dev Handoff

- Confirm `ui/index.html` exists and opens locally in a browser.
- Keep this step static only. Do not wire real API calls yet.
- Preserve current server and CLI behavior unchanged.
