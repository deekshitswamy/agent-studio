# Agent Studio v19 Dev Write Artifacts

Status: Local Prototype  
Mode: Human-in-the-loop

## Purpose

Agent Studio v19 adds the first safe path for Dev to create or update real project files.

The goal is intentionally narrow:

- Dev can emit a structured write artifact
- the API can detect that artifact after the run completes
- the API can safely apply those writes inside the selected project workspace only

This makes project-scoped Dev runs capable of producing actual filesystem changes without opening arbitrary shell write access or parsing free-form prose.

## Write Artifact Format

The implemented format is a strict JSON object:

```json
{
  "version": 1,
  "writes": [
    {
      "path": "projects/<project-id>/relative/path.ext",
      "content": "full file content"
    }
  ]
}
```

The artifact is carried as a final structured section in Dev output:

```md
## Write Artifact

```json
{
  "version": 1,
  "writes": [
    {
      "path": "projects/agent-studio/docs/example.md",
      "content": "# Example\n"
    }
  ]
}
```
```

The runner extracts that JSON block and saves a sibling `*-dev-writes.json` artifact under `logs/`.

## Project-Only Boundary

This feature is project-scoped only.

- if `project` is not provided, Dev write artifacts are ignored
- if `project` is provided, writes may target only:

```text
projects/<project-id>/
```

This keeps the write boundary aligned with the existing project workspace model.

## Validation Rules

Before the API applies any write artifact, it validates:

- the run is a Dev run
- `project` is present
- the artifact is valid JSON
- `version` is `1`
- `writes` is a non-empty array
- each write entry has:
  - `path` as a non-empty string
  - `content` as a string
- target path is not absolute
- target path does not contain `..`
- target path stays under `projects/<project-id>/`
- hidden or sensitive segments are rejected
- duplicate target files inside one artifact are rejected

If validation fails, the write is rejected safely and the run metadata records the failure.

## Example Write Artifact

The verification task used this artifact:

```json
{
  "version": 1,
  "writes": [
    {
      "path": "projects/agent-studio/docs/dev-write-artifact-example.md",
      "content": "# Dev Write Artifact Example\n\nThis file was created by the project-scoped Dev write artifact verification flow.\n"
    }
  ]
}
```

## Example Created File

Example output file created during verification:

```text
projects/agent-studio/docs/dev-write-artifact-example.md
```

## Verification Commands

Syntax and task validation:

```bash
node -c server/agent-service.js
node -c src/agent-runner.js
node -c src/dev-write-artifacts.js
node -c src/mcp/safe-write-paths.js
node ./bin/run-agent.js task validate tasks/agent-studio-v19-dev-write-artifacts.md
```

Run the local API:

```bash
PORT=3016 node server/agent-service.js
```

Project-scoped successful write:

```bash
curl -X POST http://127.0.0.1:3016/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v10-run-dev-from-task.md","agent":"dev","task":"projects/agent-studio/tasks/agent-studio-v19-write-artifact-smoke.md","project":"agent-studio"}'
```

Invalid path rejection:

```bash
curl -X POST http://127.0.0.1:3016/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v10-run-dev-from-task.md","agent":"dev","task":"projects/agent-studio/tasks/agent-studio-v19-invalid-write-artifact.md","project":"agent-studio"}'
```

Non-project no-op check:

```bash
curl -X POST http://127.0.0.1:3016/runs \
  -H "Content-Type: application/json" \
  -d '{"contextPack":"context-packs/agent-studio-v10-run-dev-from-task.md","agent":"dev","task":"projects/agent-studio/tasks/agent-studio-v19-nonproject-ignore.md"}'
```

Read run metadata and logs:

```bash
curl 'http://127.0.0.1:3016/runs/<run-id>?project=agent-studio'
curl 'http://127.0.0.1:3016/logs/<run-id>?project=agent-studio'
```

Confirm created file content:

```bash
sed -n '1,80p' projects/agent-studio/docs/dev-write-artifact-example.md
```

## Limitations

- project-scoped Dev only
- full file create/replace only
- no patch editing
- no delete or rename
- no arbitrary shell writes
- no UI visualization of written files yet
- no background jobs
- no database or multi-user support

## Next Recommended Improvements

- surface written files in run metadata more prominently in the UI
- add a small write preview/review UI before application
- add explicit overwrite policy options for future project files
- add optional validation hooks for known file types after write application
- tighten the project-runner sandbox further so write isolation is stronger than the current local prototype

## Source Of Truth

- `server/agent-service.js`
- `src/agent-runner.js`
- `src/dev-write-artifacts.js`
- `src/mcp/safe-write-paths.js`
- `prompts/dev.md`
- `logs/2026-05-03-agent-studio-v19-dev-write-artifacts.md`
