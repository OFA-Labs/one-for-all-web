<div align="center">

# ONE FOR ALL

<img src="docs/assets/team-six7.png" alt="Team SIX7 — ONE FOR ALL" width="720" />

**Team SIX7 · OFA Labs**

</div>

## one-for-all-web

The web frontend for **ONE FOR ALL**, a voice-first assistant by OFA Labs.

This repo is the **frontend only**. It is an interactive, frontend-only preview: there is no real authentication, microphone, browser control, database, AI or third-party API. Every task, history record and connection is local sample data. The backend (voice agent and agentic workflow) will live in the separate [`one-for-all-api`](https://github.com/OFA-Labs/one-for-all-api) repo.

Stack: Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui on Radix · Playwright.

## Prerequisites

- **Node.js 24** (see `.nvmrc`; `package.json` engines require ≥ 22) and npm.
- Optional: Python 3.12 for the local video-preparation scripts in `scripts/` (`requirements-tools.txt`).

## Setup

```bash
npm ci
npm run dev        # http://127.0.0.1:3000
```

To run the browser tests, install Chromium once. It is kept project-local in `.cache/ms-playwright`:

```bash
PLAYWRIGHT_BROWSERS_PATH=./.cache/ms-playwright npx playwright install chromium
```

On Windows, `scripts/setup.ps1` does all of the above, plus the Python tooling venv.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on 127.0.0.1:3000 |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Playwright suite against a local production server on port 3100 |
| `npm run format` | Prettier |
| `npm run check:arch` | dependency-cruiser architecture rules (see below) |
| `npm run verify` | typecheck → lint → build → test |
| `npm run docs:generate` | Regenerate `docs/BACKEND_HANDOFF.md` from `src/lib/integrations.ts` |
| `npm run review` | Screenshot and accessibility review script (`scripts/review.mjs`) |
| `npm run test:ui` | Playwright UI mode |

## Environment variables

The app reads **no** environment variables. `.env.example` lists the one optional tooling variable, `ONE_FOR_ALL_PREVIEW_URL`, which `scripts/review.mjs` uses as its base URL.

## Project structure

```text
src/
  app/                  Routes (App Router), root layout, error/loading/404, icon
    providers/          App-wide state (app-provider) and theme provider
  features/             One folder per product area; routes import the index.ts barrel
    home/               O F A workspace: assistant, reader, home video
    playground/         Playground, including the specialized-agents registry
    history/            History calendar (components/, lib/)
    watcher/            PR watchers
    arc-reactor/        OFA Engine
    e-brain/            Reserved placeholder (renders nothing on purpose)
    settings/           Settings, Caps Lock dictation (components/, types/)
    account/ connections/ voice-lab/ reference/
  components/
    ui/                 shadcn/ui primitives only
    layout/             App shell, navigation, theme selector
    tasks/              Task workspace/detail and browser decks (shared by home, tasks, history)
    reactor/            Reactor visual (shared by shell and arc-reactor)
    common.tsx          Small shared building blocks
  lib/                  Framework-agnostic logic: demo data, integrations registry,
                        dictation domain, reactor timing, utils
  config/               Theme definitions
  styles/               globals.css (Tailwind entry and design tokens)
public/media/           Videos, posters and manifests used by the UI
tests/                  Playwright journeys, a11y/responsive and domain tests
scripts/                Handoff generator, review and video-preparation tools
docs/                   Handoff, design, coverage and historical reports
```

**Architecture rules**, enforced by `npm run check:arch` (`.dependency-cruiser.cjs`):

- A feature never imports another feature. Shared code goes in `components/`, `lib/` or `config/`.
- `components/`, `lib/`, `hooks/` and `config/` never import from `features/`.
- No circular dependencies and no orphan modules.

## Deploy

The site deploys to **Vercel** with the default Next.js preset:

- Build command: `npm run build` (`next build`)
- Output: `.next` (managed by Vercel)
- Root directory: the repository root

There is no `vercel.json`, and no environment variables are needed.

## Further reading

[Product spec (iteration 1, final)](docs/SPEC_ITERATION_1.md) · [Backend handoff](docs/BACKEND_HANDOFF.md) · [Dictation integration handoff](docs/dictation/INTEGRATION_HANDOFF.md) · [Design system](docs/DESIGN_SYSTEM.md) · [Coverage matrix](docs/COVERAGE_MATRIX.md) · [Current theme](docs/THEME_REFRESH.md) · [Video assets](docs/VIDEO_ASSET.md)

The files under `docs/` other than the handoffs are dated reports. Any file paths they mention reflect the layout at the time they were written.
