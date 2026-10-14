# ThesisBoard

A calm, private workspace for taking a research project from a question to an organized draft. [Open the live app](https://vertex-blip.github.io/thesis-board/).

## Features

- Create multiple research projects with a question, field, target date, working thesis, and current stage.
- Collect source details and notes in a searchable library.
- Build, edit, and reorder outline sections.
- Track small tasks and see completion progress.
- Export a project as Markdown, or back up and restore all projects as JSON.
- Responsive layout that works on desktop and mobile.

## Run locally

Open `index.html` in a modern browser. There is no build step, server, account, API key, or external JavaScript dependency. A local HTTP server also works, such as `python -m http.server 8000`.

## Privacy and data

Projects live in the browser's `localStorage` under `thesisboard.projects.v1`. Nothing is uploaded. Export a JSON backup before clearing browser data or changing devices. Imported project data is validated and shown as text content, so it is never interpreted as HTML. Only HTTP and HTTPS source links are accepted; external links open with `noopener noreferrer`.

ThesisBoard helps organize research. It does not verify sources or generate citations. Check formatting against your institution's citation guide before submission.

## Deployment

The entire app is static and can be served from the repository root using GitHub Pages. No backend or environment variables are needed.

## License

MIT — see [LICENSE](LICENSE).
