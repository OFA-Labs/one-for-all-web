<div align="center">

# ONE FOR ALL

<img src="docs/assets/team-six7.png" alt="Team SIX7 — ONE FOR ALL" width="720" />

**Team SIX7**

</div>

## ONE FOR ALL frontend preview

A responsive, interactive **frontend-only** interpretation of `../spec_ite1.md`. Next.js + TypeScript + React + Tailwind + shadcn/ui. No real authentication, voice, browser control, database, APIs, AI services or third-party connections.

The current version uses the **ONE FOR ALL** name, a small centered sculpture orb with “Tap to speak” underneath, and a pitch-black background with white accents across the website. See the [current theme](docs/THEME_REFRESH.md) for the latest visual direction. The [first-build execution report](docs/EXECUTION_REPORT.md) retains the earlier 22-test baseline as historical evidence.

## Run locally (PowerShell)

```powershell
cd C:\Users\jaiva\OneDrive\Desktop\voice-agents\one-for-all-web
npm run dev
```

Open **http://127.0.0.1:3000**. For a production preview: `npm run build`, then `npm start`. Nothing is deployed publicly. No credentials or environment variables are needed.

## Caps Lock dictation preview

Open **Settings → Dictation** (**http://127.0.0.1:3000/settings?tab=dictation**). The old `/dictation` URL redirects here. Enable the preview, acknowledge consent, focus a mock app's text area, then press Caps Lock once to start and again to finish. The floating indicator remains available across pages within this website. Try retries, unavailable targets, interruption and recovery using the simulation controls.

This is frontend simulation only. Caps Lock handling requires this website to have focus; it cannot reserve the Windows Caps state or listen in other apps. No microphone, real transcription, native overlay, external insertion or agents are implemented. Clearly commented replacement interfaces live in `src/lib/dictation/contracts.ts`. See the [completed/out-of-scope checklist](docs/dictation/REPORT.md) and [integration handoff](docs/dictation/INTEGRATION_HANDOFF.md).

## Isolated dependencies

- Node/React dependencies are installed **only in this folder's `node_modules`**, not globally. `package-lock.json` pins the complete dependency tree. Reproduce with `npm ci`.
- `.venv` is a real Python 3.12 virtual environment for local tools. The design-skill searches use the standard library; video preparation additionally uses `imageio-ffmpeg==0.8.1`, pinned in `requirements-tools.txt`, which supplies a local FFmpeg binary. Activate if needed: `.\.venv\Scripts\Activate.ps1`. No Python backend is installed. Python venvs cannot isolate Node runtimes; project-local npm dependencies are the Node equivalent.
- After the folder was renamed to `one-for-all-web`, a fresh `.venv` was created at the new path. The earlier media environment was preserved outside the project as the sibling `.previous-media-venv`; the current app does not rely on it.
- Playwright Chromium is downloaded to `.cache/ms-playwright` in this project. To reproduce: `$env:PLAYWRIGHT_BROWSERS_PATH='./.cache/ms-playwright'; npx playwright install chromium`.
- Node 24.16 was used; package declares Node >=22. Node and Python themselves are existing host runtimes.
- Fonts are installed from npm and bundled locally. The product UI needs no external fonts or media requests.

## Explore

Home is usable as a visitor. Use **Tap to speak** to start the cleaned 4K liquid animation; tap **Pause animation** to stop. **Voice integration details** opens the separate voice handoff. No microphone is opened. You can also enter a typed request. **Run local preview** starts a deterministic sample, not AI. The example prompt buttons choose explicit scenarios. Try PR nudge, a job application, four-site sharing, refusal and public research.

Task flow: plan → site permission → optional clarification → exact draft review → selected sample approvals → sample receipt. Explore page-change invalidation, expiry, edits, evidence tiers, pause/resume/cancel and safe failure states. Space pauses when focus is not on an interactive element. No real passwords are retained by the form preview. Do not enter real credentials.

Browser tabs appear as a responsive grid of stacked decks. Hover over a deck to scroll through its illustrative captures; click any preview or tap the deck to open screenshot history alongside the conversation, task activity, and that site's exact drafts. The dialog blurs the background, supports capture navigation, and closes with Escape or the close button. Long page captures and conversations scroll independently on desktop and remain accessible on phones. Driving and offline states withhold page previews. Capture sequences are derived from local task records; there is no real screenshot stream or persistent browser recording in this frontend preview.

Reader highlights sentences silently; TXT loads locally, PDFs only show metadata and extraction handoff. History has fictional sample records. Watchers and connections change only in-memory state. Preferences can be saved/loaded locally. Reloading clears active tasks, flags and management edits. **Privacy → Reset local demo** removes the local preference key and resets shared preview state.

Header **Preview role** changes presentation to visitor/member/owner. It is not authentication. Owner view exposes Voice lab and the Desktop Companion explanation. It never grants a real privilege.

## Verification

```powershell
npm run typecheck
npm run lint
npm run build
npm test
npm run docs:generate
npm audit
```

Tests use an isolated local production server on port 3100; browser binaries stay project-local. No external accounts or live sites are tested. Test artifacts go to ignored `test-results` / `playwright-report`; selected reviewed screenshots are in `docs/screenshots`.

## Structure

```text
src/app/                 App Router pages, global tokens/styles, loading/error/404
src/components/          Product modules and reusable shell, controls, panels
src/components/ui/       shadcn/ui source, backed by Radix primitives
src/lib/demo.ts          Typed sample scenarios, pure task transitions
src/lib/integrations.ts  Feature registry: nine handoff fields per feature
scripts/                 Handoff and local video-preparation tools
public/media/            Prepared 4K/1080p videos, idle poster and asset manifest
public/media/            Smooth local sculpture video and idle poster
tests/                   Browser journeys, responsive/a11y and domain transitions
docs/                    Plan, coverage, handoff, final report and screenshots
design-system/           Skill recommendation and documented workbench overrides
.venv/                   Isolated Python tool environment (ignored)
.cache/ms-playwright/    Local downloaded browser binaries (ignored)
```

See [implementation plan](docs/IMPLEMENTATION_PLAN.md), [coverage matrix](docs/COVERAGE_MATRIX.md), [backend handoff](docs/BACKEND_HANDOFF.md), [design system](docs/DESIGN_SYSTEM.md) and [execution report](docs/EXECUTION_REPORT.md). Screen inventory and role/journey map are in the implementation plan.

## Notes for integration

Replace local reducer effects with actual authenticated, ordered backend events; keep UI primitives and feature IDs. Generate shared types from FastAPI. Implement policy and the extension's local enforcement before exposing real actions. Never use this client-side scenario classifier as a real refusal or safety engine.

The extension page is a website mockup, not a working extension or Nanobrowser fork. Backend must verify identity, permissions, signed page-bound approvals, idempotency, evidence and privacy erasure. Proposed endpoints are documentation only; this app never calls them.

The spec's contest window starts 20 November 2026; this scaffold was made before that date. Contest eligibility and operational claims need independent verification. No contest submission, service deployment or production readiness is claimed.

Foundation references checked during setup: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [shadcn/ui manual installation](https://ui.shadcn.com/docs/installation/manual). Versions actually installed are recorded in `package.json`/lockfile. shadcn/ui components were fetched with its CLI. Design decisions used both installed `frontend-design` and `ui-ux-pro-max` skills, including the latter's real local design-system and keyboard-focus searches.

## Visual refresh

See [change report](docs/CHANGE_REPORT.md), [video treatment](docs/VIDEO_ASSET.md) and [black-and-white theme](docs/THEME_REFRESH.md). The 4K export is a cleaned upscale of the supplied 1194 × 1152 recording, not recovered native 4K detail. The latest revision reduces the opening orb to one-tenth of its previous dimensions and replaces colored controls with white accents and neutral grays throughout the site. The video is displayed in grayscale; narrow screens receive the lighter 1080p stream.
