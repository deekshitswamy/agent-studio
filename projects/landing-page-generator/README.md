# Landing Page Generator

## Project Name

- `landing-page-generator`

## What The Prototype Does

- This project contains a local-first Agent Studio prototype for Landing Page Generator. The current app includes editable inputs and live preview behavior driven by in-project JavaScript.
- Generated project files are kept under `projects/landing-page-generator/` and can be previewed through the local Agent Studio API.

## Main Preview File

- `projects/landing-page-generator/app/index.html`
- Preview URL: `http://127.0.0.1:3000/project-file?project=landing-page-generator&path=app%2Findex.html`

## Generated Files

- `projects/landing-page-generator/app/index.html`
- `projects/landing-page-generator/app/preview.html`
- `projects/landing-page-generator/app/script.js`
- `projects/landing-page-generator/app/styles.css`

## How To Open Preview Through Agent Studio

- Start the host API with `node server/agent-service.js`.
- Open `http://127.0.0.1:3000/project-file?project=landing-page-generator&path=app%2Findex.html` in your browser.
- If you use a different port, keep the same route path and replace only the port: `/project-file?project=landing-page-generator&path=app%2Findex.html`.

## Current Limitations

- Local-first static prototype only; no deployment pipeline is configured.
- No backend persistence, authentication, database, or background jobs.
- Project history is file-based and scoped to local run artifacts.

## Next Suggested Improvements

- Add richer templates, sections, or component variations to the generated landing page.
- Persist form inputs or sample content presets for easier iteration.
- Expand the preview into a fuller multi-screen prototype or export flow when needed.

## Recent Project Activity

- agent=`dev` · status=`completed` · log=`2026-05-03T11-40-38-016Z-57229.log` · task=`projects/landing-page-generator/tasks/landing-page-generator-multi-file-prototype.md` · completed=`2026-05-03T11:41:24.514Z`
- agent=`dev` · status=`completed` · log=`2026-05-03T10-44-43-668Z-7719.log` · completed=`2026-05-03T10:45:30.255Z`
- agent=`dev` · status=`completed` · log=`2026-05-03T10-43-12-678Z-7719.log` · completed=`2026-05-03T10:44:01.895Z`
- agent=`dev` · status=`completed` · log=`2026-05-03T10-08-04-782Z-89023.log` · completed=`2026-05-03T10:08:14.007Z`
- agent=`dev` · status=`completed` · log=`2026-05-03T09-47-18-238Z-69495.log` · completed=`2026-05-03T09:47:18.765Z`
