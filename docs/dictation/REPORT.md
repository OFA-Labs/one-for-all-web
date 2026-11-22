# Caps Lock dictation — frontend delivery

The latest user instruction limits this delivery to frontend/UI simulation. The native Windows requirements in the supplied prompt are a future integration specification. **System-wide dictation is NOT IMPLEMENTED.**

## Try the preview

Run `npm run dev` in `one-for-all-web` and open `http://127.0.0.1:3000/dictation`. Alternatively, use **Settings → Dictation**.

1. Enable the preview and acknowledge the consent dialog.
2. Focus a mock app's text area. Press Caps Lock once to show Starting → Listening.
3. Press Caps Lock again to simulate transcription and insert sample text into the selected sandbox target.
4. Use Preview scenarios to exercise retry, no speech, unavailable microphone, multipart progress, target failure, interruption and recovery.

Keyboard handling requires this website to have focus. The browser cannot reserve Windows Caps Lock or handle the shortcut while another application is focused. Start/stop buttons also support touch and pointer users.

## Completed checklist

- [x] Consent-gated preview, initially Off, with explicit Enable and disable controls.
- [x] One-toggle-per-press DOM filter, repeat/modifier/bounce handling and startup cancellation.
- [x] Starting, Listening, Transcribing, Inserting and actionable Error presentation.
- [x] Compact 44px dark indicator, simulated meter, reduced-motion static dot, and focus-preserving automatic display.
- [x] Indicator and controls remain available when navigating within the website.
- [x] Original/current mock target policies, Unicode, emoji and multiline sandbox results.
- [x] Simulated retries, multipart progress, empty speech, unavailable microphone, blocked target and keyboard availability failure.
- [x] Preview clipboard fallback, explicit browser Copy text, retained Recent entries, retry and discard.
- [x] Mock interruption recovery after reload; preview always returns to Off.
- [x] Session-limit/retention controls, warning model, device/lock simulation and privacy-reset integration.
- [x] Typed, abortable replacement interfaces with clear `BACKEND NOT IMPLEMENTED` comments.
- [x] Backend integration notes and a native QA checklist that makes no native verification claim.

## Explicitly not implemented

- [ ] Global Windows key capture, native Caps suppression/normalization, injected-key flags, hook lifecycle, dedicated threads, mutexes or single instance.
- [ ] Microphone access, audio capture/files, real input levels, STT/provider requests, actual retries/chunking/timeouts, agents or AI services.
- [ ] External-window targeting, UI Automation, SendInput, external text insertion or OS clipboard snapshot/restore.
- [ ] A native desktop overlay, monitor/work-area placement, Windows DPI handling, tray/background process or sound cues.
- [ ] CLI/env kill switches, crash-loop breaker, native crash recovery, private audio ACLs or disk retention.
- [ ] Native test seams, Appendix A harness, real-desktop E2E, real-provider smoke tests, callback/latency budgets or soak measurements.

## Architecture and event flow

`DictationProvider` is mounted once in the root layout. After consent and successful mock connection, a page-local Caps Lock listener dispatches `TOGGLE` through the reducer. Non-trigger keys return immediately; their values are never recorded. A held key does not toggle again. Other site pages share the same provider.

The normal flow is `IDLE → STARTING → LISTENING → PROCESSING → INSERTING → IDLE`. Asynchronous effects carry a session ID and abort signal; stale results cannot mutate a later session. The mock adapter supplies short delays, demo levels and the configured sample transcript. A successful mock insertion updates only an in-page document. No external application is touched.

Failures retain a mock artifact reference and available transcript in Recent. Automatic fallback fills a **preview clipboard**, without writing the real clipboard. Only an explicit **Copy text** action calls the browser Clipboard API. Retry retains the old entry until confirmed sandbox insertion; explicit discard and expiry can remove it. Preferences, consent and mock recovery data use tab session storage; there is no audio. Reload never restores enabled status. Closing the browser tab may discard this preview data.

The transition history is bounded and records timestamps, session IDs, phase and event names only. It does not include audio, transcripts or non-trigger key values. Native service adaptation and its security/lifecycle responsibilities are described in [INTEGRATION_HANDOFF.md](INTEGRATION_HANDOFF.md).

## Files created or extended

| Area                                  | Files                                                                                                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Replacement interfaces and simulation | `src/lib/dictation/contracts.ts`, `hotkey.ts`, `model.ts`, `mock-services.ts`                                                                              |
| Global frontend state and UI          | `src/components/dictation/provider.tsx`, `chrome.tsx`, `workspace.tsx`, `dictation.css`                                                                    |
| Page and app entry points             | `src/app/dictation/page.tsx`, `src/app/layout.tsx`, `src/components/settings.tsx`, `shell.tsx`                                                             |
| Reset and handoff                     | `src/components/provider.tsx`, `src/lib/integrations.ts`, generated `docs/BACKEND_HANDOFF.md` and `docs/proposed-contracts.json`                           |
| Regression fix                        | `src/components/ofa.tsx`: resolve existing Reader/workspace fragment links after the streamed client tree mounts                                           |
| Tests                                 | New `tests/dictation-model.spec.ts` and `tests/dictation.spec.ts`; extended `tests/quality.spec.ts` and local-adapter validation in `tests/domain.spec.ts` |
| Documentation                         | `README.md` and `docs/dictation/` architecture, decisions, status, handoff, QA, report, screenshots and raw gate outputs                                   |

No dependencies were added. Existing React, Next.js, Radix, Lucide, Playwright and axe tooling are reused. No native binaries, credentials, backend endpoints or deployment were added. No Git repository exists in this workspace, so no branch or checkpoint commits were created.

## Executed verification

Final executed results on 17 November 2026:

```text
TypeScript: npm run typecheck — exit 0
ESLint: npm run lint — exit 0
Prettier: All matched files use Prettier code style!
Production: next build --webpack — Compiled successfully
Playwright: 69 passed (1.3m)
Additional browser axe checks: 7 screens/states, 0 violations
Mobile: 375px, no horizontal overflow, 44px pill, text-field focus preserved
```

The 69-test suite includes 8 dictation model/adapter tests and 12 dictation browser tests. It also covers the existing O F A, browser decks, task journeys, calendar, responsive layout, video and accessibility behavior. These are browser/model tests; none is a native desktop test.

Raw executed gate output is retained without substituting a native test result:

- [CP0 reconnaissance](CP0_OUTPUT.txt)
- [TypeScript](TYPECHECK_OUTPUT.txt)
- [ESLint](LINT_OUTPUT.txt)
- [Prettier](FORMAT_OUTPUT.txt)
- [Production build](BUILD_OUTPUT.txt)
- [Production browser/model suite](TEST_OUTPUT.txt)
- [Additional browser accessibility and viewport checks](UI_QA_OUTPUT.json)

Reviewed screenshots: [consent](screenshots/consent.png), [desktop Listening](screenshots/listening.png), [mobile Listening](screenshots/mobile-listening.png), and [fallback](screenshots/fallback-error.png). The `screenshots/` directory also contains Idle, Starting, Transcribing part 2/4, Inserting, and inserted-result captures, with individual pill crops.

OneDrive locked an existing generated Next.js chunk during earlier build attempts. Production validation therefore uses an identical source copy under the user's temporary directory, linked to the existing local dependencies, media and Playwright browser. The successful build command is `npm run build -- --webpack`; tests use the normal production server on port 3100. The live development server and OneDrive process are preserved. No claim is made that the original locked output directory or the default Turbopack build was verified.

The first full regression run reported 66 passed / 2 failed. The failures exposed an HTTP-only registry assumption for the new local adapter and the streamed Reader fragment-scroll issue. Both were corrected before the final run. The accessibility audit also caught whitespace in the Code editor tab's generated ID; tab values now use stable slugs, and the added audit exercises all mock app tabs, consent and the active indicator.

## Requirement matrix

**VERIFIED** below always describes the executed browser simulation or source/build checks, never a working native implementation. **NOT IMPLEMENTED** identifies intentionally excluded code. **UNVERIFIED** identifies a real-world gate that was not executed.

| Prompt requirement                                                                                                 | Status          | Scope and evidence                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| §0 / CP0 repository, stack, commands, service inventory and decisions                                              | VERIFIED        | Next.js repository inspected; real paths and missing services recorded in architecture notes and CP0 output.                       |
| §2 separate Git branch and checkpoint commits                                                                      | NOT IMPLEMENTED | No Git repository exists; no repository was initialized.                                                                           |
| §§1, 3 pure toggle; release, held repeat and app switches do not stop                                              | VERIFIED        | DOM filter/model/browser tests; mock app switches, minimization and site navigation.                                               |
| §§1, 4 system-wide Caps capture, suppression and OS state unchanged                                                | NOT IMPLEMENTED | No native hook or OS state changes. DOM handling cannot provide this.                                                              |
| §4 native modifiers, injection flags, dedicated hook thread, queue, mutex, single instance and dead-hook detection | NOT IMPLEMENTED | Browser filter is only a preview counterpart; no Win32 helper was written.                                                         |
| §4 native normalization, Shift+Caps behavior and native callback budgets                                           | UNVERIFIED      | No native implementation or native tests.                                                                                          |
| §§3, 5 one dispatcher, correlated events, stale-result rejection and busy presses                                  | VERIFIED        | Model and browser tests exercise these UI invariants.                                                                              |
| §5 quick abort, error recovery, cancellation, device loss, disable and cap                                         | VERIFIED        | Reducer tests; browser tests for quick lifecycle, errors, disable and recovery. Device/cap/lock controls are explicit simulations. |
| §5 actual microphone lifecycle, first audio frame and disk flush                                                   | NOT IMPLEMENTED | Mock methods resolve without opening a microphone.                                                                                 |
| §5 retries, empty speech and multipart progress presentation                                                       | VERIFIED        | Mock retry/empty tests and captured multipart UI. Short mock delays are not real retry policies.                                   |
| §5 provider limits, request timeouts, Retry-After and transport splitting                                          | NOT IMPLEMENTED | No provider client or network requests.                                                                                            |
| §§3, 5 retain failed/interrupted preview until insertion, discard or expiry                                        | VERIFIED        | Model/browser recovery tests; mock data only in tab session storage.                                                               |
| §5 private audio files, ACLs, crash recovery and flat RAM for long capture                                         | NOT IMPLEMENTED | No audio or disk capture.                                                                                                          |
| §6 original/current target policy and Unicode/multiline preservation                                               | VERIFIED        | In-page sandbox tests preserve the fixture and code/newlines.                                                                      |
| §6 password/overlay refusal and closed/elevated fallback presentation                                              | VERIFIED        | Model guards, actual HTML password-field test and sandbox fallback test.                                                           |
| §6 HWND/UIA capture, focus restoration/rechecks, app profiles and no Enter send                                    | NOT IMPLEMENTED | No external input injection or app control.                                                                                        |
| §6 preview clipboard and explicit browser copy                                                                     | VERIFIED        | Test proves automatic fallback does not invoke the browser clipboard write; a user Copy click does.                                |
| §6 all-format native clipboard snapshot, sequence protection, restore and cloud/history flags                      | NOT IMPLEMENTED | Browser copy is not the requested native clipboard protocol.                                                                       |
| §7 pill geometry, state text, demo meter, reduced motion and browser focus                                         | VERIFIED        | Browser tests, axe checks and screenshots; automatic display preserves the focused HTML text field.                                |
| §7 desktop topmost/no-activate flags, target monitor work area and DPI                                             | NOT IMPLEMENTED | Indicator is fixed inside the browser viewport.                                                                                    |
| §7 native foreground HWND, monitor/DPI/fullscreen behavior and real levels                                         | UNVERIFIED      | No native desktop verification; levels are explicitly simulated.                                                                   |
| §8 consent before connecting, Off default, preferences/status and disable                                          | VERIFIED        | Browser/model tests; settings and floating controls available without an active pill.                                              |
| §8 sound, injected-key and close-to-tray preferences                                                               | VERIFIED        | Frontend preferences are stored and labeled as disconnected native settings. Their native behavior is NOT IMPLEMENTED.             |
| §8 native tray, background capture, CLI/env kill switches and crash breaker                                        | NOT IMPLEMENTED | No desktop host/process lifecycle.                                                                                                 |
| §9 mic error, empty speech, connection/target failure and hook-failure UI                                          | VERIFIED        | Simulated failure-injection browser/model tests.                                                                                   |
| §9 real device hot-swap, lock/sleep/RDP, secure desktop, multiple instances and Caps already on                    | UNVERIFIED      | Native scenarios not executed; only named mock interruption controls exist.                                                        |
| §9 approaching cap warning and cap processing                                                                      | VERIFIED        | Model boundary tests and frontend controls. A two-hour real recording was not run.                                                 |
| §10 typed mock test seams and metadata-only transitions                                                            | VERIFIED        | Explicit non-native capabilities and abortability are tested.                                                                      |
| §10 native `--e2e`, tagged input, WAV source, packaged-build gating and Appendix A                                 | NOT IMPLEMENTED | No native executable or test seams; no harness installed or executed.                                                              |
| §10 Notepad/VS Code/Chrome external insertion and clipboard oracles                                                | UNVERIFIED      | Mock tabs are not those applications. No external app test was run.                                                                |
| §§10–11 5-minute audio, force-kill recovery, native p95/p99 and soak                                               | UNVERIFIED      | These require excluded native/backend code; browser timing does not establish them.                                                |
| §11 browser production build, model/journey, responsive and accessibility gates                                    | VERIFIED        | Executed frontend gate outputs linked above; final results recorded in status.                                                     |
| §13 report, decisions, scope checklist and remaining native QA                                                     | VERIFIED        | This report, decisions, integration handoff and manual QA document.                                                                |

## Known limits and remaining handoff

The frontend is ready for review with deterministic sample data. A later desktop implementation must provide real trigger events, one shared capture/STT lifecycle, private recoverable artifacts, secure insertion, native clipboard handling, native overlay/lifecycle controls, and actual operating-system verification. The browser adapter is the only instantiated adapter today; switching its capability flags alone cannot enable native behavior.

The native specification's caveats remain relevant for that later implementation: elevated/UIPI windows, UAC/secure desktop and lock screen, fullscreen-exclusive applications, RDP/Citrix, IME-specific Caps semantics, and AV/EDR treatment of low-level hooks. None was tested here. Re-check current Microsoft documentation before implementing Win32 behavior. Real provider identity/limits and production consent must also be established; Gradium is only the existing planned provider in this repository.

See [MANUAL_QA.md](MANUAL_QA.md) for every remaining native verification category. No native/backend work is necessary to complete the authorized frontend scope.
