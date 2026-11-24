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
