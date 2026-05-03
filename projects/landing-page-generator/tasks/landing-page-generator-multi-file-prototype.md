# Task: Landing Page Generator Multi-File Prototype

## Task

- `landing-page-generator-multi-file-prototype`

## Status

- `pending`

## Objective

- Upgrade the project prototype from a single-file preview into a cleaner multi-file HTML, CSS, and JavaScript prototype under the selected project workspace.

## Context Pack

- `context-packs/trial-landing-page-generator.md`

## Scope

- Create or replace `projects/landing-page-generator/app/index.html`.
- Create or replace `projects/landing-page-generator/app/styles.css`.
- Create or replace `projects/landing-page-generator/app/script.js`.
- Keep the prototype local-first and dependency-free.
- Preserve live editing behavior and make the preview feel more polished and usable.
- Use one structured write artifact with multiple `writes` entries.

## Out of Scope

- Backend persistence
- Authentication
- Deployment
- External CSS or JavaScript dependencies
- Additional API routes

## Acceptance Criteria

- A project-scoped Dev run emits one structured write artifact with multiple `writes` entries.
- `projects/landing-page-generator/app/index.html` exists after the run.
- `projects/landing-page-generator/app/styles.css` exists after the run.
- `projects/landing-page-generator/app/script.js` exists after the run.
- The HTML references the stylesheet and script through safe project-file URLs so the preview works when opened through the local API route.
- The prototype looks like a real small product page and remains responsive on mobile.

## Verification

- Run project-scoped Dev for this saved task.
- Confirm `GET /project-files?project=landing-page-generator` lists the three app files.
- Confirm `GET /project-file?project=landing-page-generator&path=app/index.html` returns the generated HTML.
- Confirm `GET /project-file?project=landing-page-generator&path=app/styles.css` returns the generated CSS.
- Confirm `GET /project-file?project=landing-page-generator&path=app/script.js` returns the generated JavaScript.

## Dev Handoff

- Implement this task only within `projects/landing-page-generator/`.
- Emit a structured write artifact with one `writes` entry per target file.
- Use these exact safe asset URLs inside `app/index.html`:
- stylesheet: `/project-file?project=landing-page-generator&path=app/styles.css`
- script: `/project-file?project=landing-page-generator&path=app/script.js`
- Keep the prototype polished, readable, and responsive without external dependencies.
