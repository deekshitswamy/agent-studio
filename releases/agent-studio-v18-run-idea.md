# Agent Studio v18 Run Idea

Status: Local Prototype  
Mode: Human-in-the-loop

## Purpose

Agent Studio v18 adds a small Run Idea flow so one human-entered idea can be turned into task drafts in one guided step.

The goal is narrow:

- accept one idea in the UI
- run PM first
- run Task Planner second using PM output
- surface the resulting draft material in the existing `Unsaved Drafts` panel

This remains a human-triggered flow. It does not save tasks automatically and it does not trigger Dev automatically.

## UI Behavior

The UI now includes:

- an `Idea` input
- a `Run Idea` button

When the operator clicks `Run Idea`:

1. the UI validates that:
   - context pack is present
   - idea text is present
2. the UI starts a PM run through the existing `POST /runs` flow
3. the PM run uses the idea as supporting artifact context
4. after the PM run completes successfully, the UI starts a Task Planner run
5. the Task Planner run uses the PM run log as supporting artifact context
6. the existing `Task Planner Source` and `Unsaved Drafts` flow renders the resulting draft source and extracted drafts

The existing result and log surfaces are reused:

- `Run Result`
- `Task Planner Source`
- `Unsaved Drafts`

## Request Chain

### First Request: PM

The first run is sent as a normal `POST /runs` call:

```json
{
  "contextPack": "<current-context-pack>",
  "agent": "pm",
  "idea": "<idea text>"
}
```

### Second Request: Task Planner

After the PM run succeeds, the UI sends a second normal `POST /runs` call:

```json
{
  "contextPack": "<current-context-pack>",
  "agent": "task-planner",
  "withArtifact": "<pm-log-path>"
}
```

The PM log path becomes the planning source for the Task Planner step.

## Project-Aware Behavior

Project support remains active in this flow.

When a project is selected:

- the PM run remains project-scoped
- the generated PM log is read from:

```text
projects/<project-id>/.local/runs/<pm-log-id>.log
```

- the Task Planner follow-up run uses that project-scoped PM log path as `withArtifact`

When no project is selected:

- the flow uses the existing global `.local/runs/` path

## What It Does Not Do

This flow does not introduce:

- auto-save
- auto-run Dev
- background jobs
- queue behavior
- persistent orchestration
- task execution beyond the explicit PM then Task Planner chain started by the user

## Verification Commands

Server and UI checks:

```bash
node -c server/agent-service.js
node -e "const fs=require('fs'); const html=fs.readFileSync('ui/index.html','utf8'); const start=html.indexOf('<script>'); const end=html.lastIndexOf('</script>'); if(start===-1||end===-1||end<=start) throw new Error('Script block not found'); new Function(html.slice(start+8,end)); console.log('ui-script-syntax-ok');"
PORT=3014 node server/agent-service.js
```

Global PM run with idea:

```bash
curl -X POST http://127.0.0.1:3014/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v10-run-dev-from-task.md","agent":"pm","idea":"Quick global idea verification without a selected project."}'
```

Project-scoped PM run with idea:

```bash
curl -X POST http://127.0.0.1:3014/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v10-run-dev-from-task.md","agent":"pm","idea":"Build a local workflow that turns one product idea into reviewed task drafts for a human to save and run later.","project":"agent-studio"}'
```

Project-scoped Task Planner follow-up:

```bash
curl -X POST http://127.0.0.1:3014/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v10-run-dev-from-task.md","agent":"task-planner","withArtifact":"projects/agent-studio/.local/runs/<pm-log-id>.log","project":"agent-studio"}'
```

Verify the resulting draft source:

```bash
curl 'http://127.0.0.1:3014/runs/<task-planner-run-id>/task-planner-source?project=agent-studio'
```

Verify the UI contains the new controls:

```bash
curl -s http://127.0.0.1:3014/ui | rg 'Idea|Run Idea|idea-input'
```

## Known Limitations

- the flow is still local-only
- it runs PM then Task Planner sequentially in the browser-triggered path
- no automatic task-file save happens after draft generation
- no automatic Dev run happens after draft generation
- Task Planner draft extraction remains best-effort
- the PM step uses generated supporting markdown from the idea rather than a dedicated idea-native runner contract
- no retry, cancellation, or background orchestration is added

## Relationship To Existing Versions

- v8 adds the local browser UI
- v9 adds task draft detection, editable drafts, and explicit save
- v13 adds project-scoped tasks, runs, and logs
- v17 adds project-scoped Docker runner execution
- v18 adds a human-triggered PM → Task Planner idea-to-drafts flow on top of the existing API and UI

## Source Of Truth

- `ui/index.html`
- `server/agent-service.js`
- `logs/2026-05-03-agent-studio-v18-run-idea-flow.md`
