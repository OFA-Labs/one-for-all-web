# Dictation status

## CP0 — complete

Read the supplied prompt and inspected the actual app, settings, voice UI, providers, tests and available services. Architecture notes and decisions record the frontend-only scope. No dictation application code was changed before this checkpoint.

## Browser implementation checkpoints — complete

- Browser CP1: consent-gated Caps filter, repeat/modifier/bounce handling, and cleanup. Native `WH_KEYBOARD_LL` is NOT IMPLEMENTED.
- Browser CP2: one reducer/event dispatcher, correlated asynchronous results, cancellation, retry, recovery and target-policy UI. Unit tests exercise the browser model.
- Browser CP3/4: mock capture/STT/artifact/insertion adapters only. A controlled preview document receives the result. Real capture/STT/storage/insertion are NOT IMPLEMENTED.
- Browser CP5: in-page 44px indicator, reduced-motion meter, focus-preserving automatic show/hide, error/cancel controls. Native overlay flags/foreground/DPI are NOT IMPLEMENTED.
- Browser CP6: first-run consent, settings, controls menu, disable, session-storage recovery, privacy-reset integration. Native tray/background/CLI/env/crash handling are NOT IMPLEMENTED.
- Browser CP7: production regression suite passed all 69 tests, including 20 dictation model/browser tests. TypeScript, ESLint, Prettier and the Webpack production build passed. Automated accessibility audits passed across the site's routes and the dictation tabs, consent, active indicator, fallback and mobile state. Desktop/mobile screenshots were inspected. No real-desktop gate is claimed.

The authorized frontend scope is complete. Raw gate outputs, screenshots, the requirement matrix and completed/out-of-scope checklists are linked from [REPORT.md](REPORT.md). Native CP1–CP7 remain NOT IMPLEMENTED; their real-desktop gates remain UNVERIFIED.

Open issues: no native desktop host or real audio/STT/insertion services; no Git repository. These are intentional scope boundaries, not blockers for the requested frontend.
