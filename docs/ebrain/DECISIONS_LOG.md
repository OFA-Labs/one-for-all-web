# E-Brain web implementation decisions

## 2026-11-24 — M1 capacity view

- Build on `origin/staging` at `1cd9e73` using `feat/ebrain-m1`. The owner's
  navigation work is already merged. Existing source paths and insertion
  lines match FINAL/07-ui.md; the B4.3 amendment at L283 is owner-approved.
- Read the installed Next.js 16 server/client and Playwright guides before
  editing. The page exports metadata as a Server Component and renders the
  interactive EBrain Client Component. Preserve the existing artwork verbatim.
- Implement only M1 UI: capacity states, EXPERIMENTAL badge, loading and error
  messages, and the existing artwork. Honesty panels, memory history/drawers
  and review controls remain M3/M4 work, as specified by the build order.
- Copy generated backend facts byte-for-byte to
  `src/lib/ebrain/limits-facts.json` and import them into the preview client.
  This additional file prevents independently maintained measured numbers.
  Live copy and capacity values come from `GET /v1/ebrain/limits`; preview
  memory counts are the spec's explicitly labelled fixture values.
- Hold the client in lazy state so it remains stable for the mounted page;
  the limits effect depends on the whole client without lint suppressions.
  It ignores late results after unmount and does not poll.
- Implement the full typed HTTP seam specified for M1; defer future preview
  data and review controls. Unavailable mock mutations fail explicitly rather
  than pretending an approval or merge succeeded.
- Three transport tests supplement the five unchanged-in-meaning M1 capacity
  tests. Fetch is mocked in-process with only loopback `/v1/` paths; these
  tests verify bearer/project handling, HTTP/network failure propagation and
  human-action transport. The existing no-network journey remains unchanged.
- Browser-to-API preflight failed with HTTP 405 in the reference. The paired
  API PR adds narrowly scoped CORS for only the local web origins on ports
  3000 and 3100, using Authorization/Content-Type and no cookies. Its two
  regression tests preserve the original reference tests. Details and backend
  verification are in `one-for-all-api/docs/ebrain/DECISIONS_LOG.md`.
- Add only empty E-Brain variable names to `.env.example`; no environment
  secrets are read or committed. Document that NEXT_PUBLIC values are visible
  to the browser and the real-token configuration is for local personal use.
- Keep repositories public as the owner subsequently requested. Open PRs as
  `jvsing` from personal forks to OFA-Labs `staging`; leave merging to the owner.

The requested GitHub `j-clone` identity needs the dedicated account username.
The generic co-author avatar cannot be replaced with a repository image.
Existing commit history and the owner's personal profile are not rewritten.

### Supplied test correction

The first capacity run returned 4 passed, 1 failed. The supplied error test's
unscoped `page.getByRole("alert")` matches both the application error paragraph
and Next.js 16's built-in `__next-route-announcer__` alert, causing Playwright's
strict-mode failure. Scope it to the page's `main` landmark and keep the same
exact error-message assertion. No application alert is removed or hidden, and
the test is neither skipped nor weakened.

### Final validation

| Command | Observed result |
| --- | --- |
| `npm run build` | Passed; 22 static pages generated. |
| `npx tsc --noEmit` | Passed; exit 0. |
| `npm run lint` | 0 errors, 2 existing warnings in `.cache/motion/patch-duration.mjs`; exit 0. |
| `npm run check:arch` | 0 violations; 95 modules, 193 dependencies. |
| `npx playwright test tests/e-brain.spec.ts` | **5 passed** in 8.2s after the documented selector correction. |
| `npx playwright test tests/e-brain-client.spec.ts` | **3 passed** in 3.5s. |
| `npx playwright test tests/journeys.spec.ts tests/quality.spec.ts` | **17 passed** in 44.5s, including axe and responsive checks. |

Paired backend `.venv\Scripts\python.exe -m pytest tests -q`: **55 passed,
1 skipped, 1 known warning in 4.30s**. Besides CORS, its PR fixes path-based
chain history: encoded slashes previously returned 404; the `{chain:path}`
route now preserves history access and other-user isolation. Three additional
backend regressions explain the count above the spec's 52 passing tests.

Integrity checks confirm the preview facts, backend store and all seven original
tests match the reference byte-for-byte. Generated screenshots and
`next-env.d.ts` are restored before commits; no dev server was started and the
known failing dictation-hotkey test was not run or changed.

The real-token browser deployment remains untested as a whole; HTTP transport,
CORS and page states are covered separately. Real-user accuracy and power-loss
durability remain unmeasured. M2–M6 remain future work, including full honesty
panels/history UI and human review controls. Safety defaults are unchanged.

## 2026-11-24 — M2 agent bridge configuration

- Start `feat/ebrain-m2` from merged M1 staging (`5a0b371`). Verify the original
  six-line `.claude/settings.json` attribution object and nine-line generated
  Next.js block in AGENTS before editing; preserve their contents.
- Add SessionStart and Stop command hooks using documented Windows PowerShell
  syntax. Resolve the sibling API directory through `CLAUDE_PROJECT_DIR`, use
  its pinned Python venv and restore the original working directory. A bare
  `python -m ebrain` from the web directory cannot import the sibling package.
- SessionStart runs `pack --hook` with JSON stdin; Stop runs `capture --hook`
  then `maintain` sequentially. No permissions, attribution, tokens or security
  settings change. Tokens are supplied only through each agent's environment.
  Hook contract: https://code.claude.com/docs/en/hooks.
- Append the Codex pack/remember instructions after the generated Next.js block,
  with a working PowerShell invocation. Memory is data, not instructions, and
  offline/unconfigured packs do not stop work. Write failures remain explicit.
- CLI/entry point, bootstrap, durable-marker parsing and integration tests live
  in the paired API PR. It documents two necessary reference adaptations:
  ordinary notes need value codes to be retrieved, and imported facts need
  line-specific source paths to avoid collapsing into one file chain.
- No new web source, UI, environment files, dependencies or voice prototype
  changes are part of M2. Real Claude/Codex app sessions, personal bootstrap and
  cross-platform hook launchers remain separate from the tested local protocol.

### M2 final validation

| Command | Observed result |
| --- | --- |
| `npm run build` | Passed; 22 static pages generated. |
| `npx tsc --noEmit` | Passed; exit 0. |
| `npm run lint` | 0 errors, 2 existing cache warnings; exit 0. |
| `npm run check:arch` | 0 violations; 95 modules, 193 dependencies. |
| `npx playwright test tests/e-brain.spec.ts tests/e-brain-client.spec.ts tests/journeys.spec.ts tests/quality.spec.ts` | **25 passed (1.1m)**; exit 0. |

Paired backend milestone command
`.venv\Scripts\python.exe -m pytest tests -q -k "bridge or bootstrap or codex or claude"`:
**11 passed, 55 deselected**, 1 known warning in 58.73s. Full backend command
`.venv\Scripts\python.exe -m pytest tests -q`: **65 passed, 1 skipped**,
1 known warning in 73.04s. Existing reference tests and API/store/facts remain
unchanged. A value-reversion regression and a project-scope Stop regression
first reproduced CLI defects and passed after the fixes.

The exact configured SessionStart and Stop PowerShell commands were executed
against an isolated real API, including capture-before-maintain ordering.
Live Claude/Codex app sessions and personal bootstrap with real tokens were
not run. The full untested list is in the API decisions log. Generated tracked
screenshots and `next-env.d.ts` are restored before commits; no dev server,
dictation test changes or voice-prototype edits are included.
