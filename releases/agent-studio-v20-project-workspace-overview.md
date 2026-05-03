# Agent Studio v20: Project Workspace Overview

## Summary

Agent Studio now gives each selected project a clearer local workspace experience. The UI can show recent project activity, generated project files, a preferred app preview, and the project README summary without leaving the browser.

This release builds on the existing local-first workspace model under:

```text
projects/<project-id>/
```

## Included Improvements

### Project History

- Added a read-only project history route:
  - `GET /project-history?project=<project-id>`
- Reads:
  - `projects/<project-id>/.local/runs/*.json`
- Sorts newest first.
- The UI now shows recent project-scoped runs with:
  - agent
  - status
  - started/completed timestamps
  - log id
  - task path when present
  - context pack when present
- History items reuse the existing log viewer and can still offer preview access.

### Multi-File Prototype Generation

- Project-scoped Dev runs can now safely apply one structured write artifact with multiple file writes.
- This supports generated prototypes that span more than one file, for example:
  - `projects/landing-page-generator/app/index.html`
  - `projects/landing-page-generator/app/styles.css`
  - `projects/landing-page-generator/app/script.js`
- The write artifact format is unchanged:

```json
{
  "version": 1,
  "writes": [
    {
      "path": "projects/<project-id>/relative/path",
      "content": "full file content"
    }
  ]
}
```

- The Dev guidance now explicitly supports multiple `writes` entries in one artifact.

### Main Preview Detection

- Agent Studio now chooses one preferred app preview file automatically in this order:
  1. `app/index.html`
  2. `app/preview.html`
  3. first visible `.html` file in the project
- The Project Files panel now shows one clear:
  - `Open App Preview`
- Per-file `Open Preview` links remain available.

### Project README Generation

- Project-scoped task saving and project-scoped runs now refresh:
  - `projects/<project-id>/README.md`
- The generated README summarizes:
  - project name
  - what the prototype does
  - main preview file
  - generated files
  - how to open the preview through Agent Studio
  - current limitations
  - next suggested improvements
  - recent project activity

### Project Overview Panel

- Added a read-only project README route:
  - `GET /project-readme?project=<project-id>`
- Reads:
  - `projects/<project-id>/README.md`
- The UI now includes a `Project Overview` panel that renders the README in readable markdown-like formatting.
- Missing README files are handled gracefully with a clear message.

## Current Usage Flow

1. Select a `Project ID`.
2. Select a `Context Pack`.
3. Run Idea or run a saved task.
4. Review generated drafts and save a task when needed.
5. Run Dev for the selected project.
6. Inspect:
   - Project Overview
   - Project Files
   - Project History
7. Open the preferred preview through:
   - `Open App Preview`

## Verified Example

Project:

- `landing-page-generator`

Preferred app preview:

- `projects/landing-page-generator/app/index.html`

Preview route:

- `http://127.0.0.1:3000/project-file?project=landing-page-generator&path=app%2Findex.html`

Generated multi-file prototype:

- `projects/landing-page-generator/app/index.html`
- `projects/landing-page-generator/app/styles.css`
- `projects/landing-page-generator/app/script.js`

Project README:

- `projects/landing-page-generator/README.md`

## Known Limitations

- Local-first only; no deployment or hosted preview flow.
- No database-backed history or metadata.
- No auth or multi-user support.
- No background jobs or autonomous follow-up execution.
- README rendering in the UI is intentionally lightweight and markdown-ish, not a full markdown engine.
- Project history is file-based and reflects available run metadata only.

## Verification Commands

```bash
PORT=3024 node server/agent-service.js
curl http://127.0.0.1:3024/ui
curl 'http://127.0.0.1:3024/project-readme?project=landing-page-generator'
curl 'http://127.0.0.1:3024/project-history?project=landing-page-generator'
curl 'http://127.0.0.1:3024/project-files?project=landing-page-generator'
curl 'http://127.0.0.1:3024/project-file?project=landing-page-generator&path=app/index.html'
```
