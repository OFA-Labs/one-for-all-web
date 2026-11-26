<div align="center">

# ONE FOR ALL

<img src="docs/assets/team-six7.png" alt="Team SIX7 — ONE FOR ALL" width="720" />

**Team SIX7 · OFA Labs**

</div>

## one-for-all-web

The web frontend for **ONE FOR ALL**, a voice-first assistant by OFA Labs.

This repo is the **web frontend**. Its default mode is an interactive preview: tasks, history records and connections are local sample data, with no real authentication, microphone, browser control or AI. E-Brain can optionally connect to the local SQLite memory service in the separate [`one-for-all-api`](https://github.com/OFA-Labs/one-for-all-api) repo; its capacity view otherwise uses preview fixtures. Voice-agent and workflow integration belong to later milestones.

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

With `NEXT_PUBLIC_EBRAIN_API_URL` unset, e-brain uses local preview fixtures and makes no API requests. To connect to the local E-Brain service, set `NEXT_PUBLIC_EBRAIN_API_URL` to its loopback URL and `NEXT_PUBLIC_EBRAIN_TOKEN` to the intended user's token, then rebuild. These `NEXT_PUBLIC_` values are visible to the browser; configure them only for your own local session, not a shared deployment. The API accepts the local web origins on ports 3000 and 3100. `.env.example` lists these names and the optional `ONE_FOR_ALL_PREVIEW_URL` used by `scripts/review.mjs`.

### History (preview by default, live opt-in)

`/history` and `/tasks/<id>` show the fictional sample records unless live mode is switched on, and make **no** History network requests in preview mode. Live mode reads the real, owner-scoped History API through a same-origin proxy (`src/app/api/history/[...path]/route.ts`), so the backend token never reaches the browser and no CORS is needed. The proxy is read-only (GET) and only forwards an exact allowlist of routes.

Server-only variables (never prefix these with `NEXT_PUBLIC_`), plus the one public switch:

| Variable | Where | Purpose |
| --- | --- | --- |
| `HISTORY_API_URL` | server | Backend base URL, e.g. `http://127.0.0.1:8765` |
| `HISTORY_API_TOKEN` | server | A **member** token from the backend's `HISTORY_TOKENS` |
| `NEXT_PUBLIC_HISTORY_API_URL` | build time | `/api/history` turns live mode on; unset = preview. Anything that is not a same-origin `/api/history` path is ignored |

PowerShell:

```powershell
$env:HISTORY_API_URL = "http://127.0.0.1:8765"
$env:HISTORY_API_TOKEN = "dev-history-token"
$env:NEXT_PUBLIC_HISTORY_API_URL = "/api/history"
npm run dev
```

bash (Linux/WSL):

```bash
export HISTORY_API_URL="http://127.0.0.1:8765"
export HISTORY_API_TOKEN="dev-history-token"
export NEXT_PUBLIC_HISTORY_API_URL="/api/history"
npm run dev
```

`NEXT_PUBLIC_HISTORY_API_URL` is inlined at build time, so rebuild (`npm run build`) after changing it. To try live mode against an already-built preview without rebuilding, run `localStorage.setItem("one-for-all-history-api", "/api/history")` in the browser console (development and tests only; it is not a security boundary).

If live mode is on and the API is unavailable, the page shows an honest error with a retry; it never falls back to sample data. To roll back, unset `NEXT_PUBLIC_HISTORY_API_URL` and rebuild. Backend setup, seeding and the token format are in the [backend README](../backend/README.md#history-live-mode-p0).

Claude Code's project hooks and the Codex instructions in `AGENTS.md` use the
sibling API repo's pinned Python venv for E-Brain memory. Set the intended
agent's `EBRAIN_AGENT_TOKEN` and optional `EBRAIN_URL` in that agent's process;
the API must be running. SessionStart loads context and Stop captures marked
assistant decisions before maintenance. An unavailable service gives an empty
pack, so work continues. See the [API bridge and bootstrap setup](https://github.com/OFA-Labs/one-for-all-api#agent-bridges-m2).

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
    e-brain/            Shared project memory (EXPERIMENTAL)
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

## Caps Lock agent extension (preview)

`extension/` is a Chrome (Manifest V3) extension that opens the ONE FOR ALL agent on any website.

- **Open/close:** press Caps Lock twice quickly (within 0.4 s). Esc also closes it.
- **Cue:** a short glowing ring appears at the top centre, then the agent panel slides in below the address bar.
- **Panel:** the liquid orb animation, a message box, voice input (🎤, browser speech recognition) and read-aloud (🔊, the selection or the page).
- **Limits:** replies are preview text until a backend exists. Chrome does not run extensions on `chrome://` pages or the Chrome Web Store.

Install locally: open `chrome://extensions`, turn on Developer mode, click **Load unpacked** and choose the `extension/` folder.

## Deploy

The site deploys to **Vercel** with the default Next.js preset:

- Build command: `npm run build` (`next build`)
- Output: `.next` (managed by Vercel)
- Root directory: the repository root

There is no `vercel.json`, and no environment variables are needed.

## Further reading

[Product spec (iteration 1, final)](docs/SPEC_ITERATION_1.md) · [Backend handoff](docs/BACKEND_HANDOFF.md) · [Dictation integration handoff](docs/dictation/INTEGRATION_HANDOFF.md) · [Design system](docs/DESIGN_SYSTEM.md) · [Coverage matrix](docs/COVERAGE_MATRIX.md) · [Current theme](docs/THEME_REFRESH.md) · [Video assets](docs/VIDEO_ASSET.md)

The files under `docs/` other than the handoffs are dated reports. Any file paths they mention reflect the layout at the time they were written.
