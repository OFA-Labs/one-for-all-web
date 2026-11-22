# Dictation frontend preflight — CP0

Scope: the user's latest instruction explicitly limits this work to frontend UI and simulated services. Native Windows integration, microphone capture, agents, STT, and OS insertion must not be implemented.

| Area                        | Evidence                                                                                 | Decision                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Application                 | `package.json`, `src/app/layout.tsx`: Next.js 16.4.6, React 19.3.1, TypeScript, Tailwind | EXTEND the existing web app; no Electron/Tauri/native host exists                             |
| Shared state                | `src/components/provider.tsx`                                                            | REUSE root-provider pattern; keep dictation preview separate from existing task/reading state |
| Voice UI                    | `src/components/ofa.tsx`, `common.tsx`: silent video orb                                 | REUSE visual language; do not introduce a microphone engine                                   |
| Capture/STT                 | `src/lib/integrations.ts`: proposed Gradium contracts only                               | MISSING; use explicitly simulated, abortable adapter methods                                  |
| Text insertion              | No insertion service under `src/`                                                        | MISSING; update only a controlled demo text area                                              |
| Settings                    | `src/components/settings.tsx`: browser-only preferences                                  | EXTEND with consent-gated dictation preferences and a standalone preview page                 |
| Overlay                     | Existing Radix dialogs are in-page UI                                                    | Add an in-page nonmodal pill that does not automatically focus; no desktop window             |
| Tray/background/native hook | No native project, helper process, or tray integration                                   | NOT IMPLEMENTED; offer a labeled in-page controls menu                                        |
| Recovery                    | Browser storage available to UI, no audio files exist                                    | Simulated session metadata and demo transcripts only; never claim retained audio              |
| Tests                       | Playwright, Chromium, existing project-local browser cache                               | Test browser interactions and model transitions; native harness is out of scope               |
| Git                         | `git status --short`: fatal: not a git repository                                        | No branch/commit created; do not initialize an unrelated repository                           |

Preflight: this environment can run browser UI tests. Native GUI input injection, real audio feed, STT credentials, Win32 hooks, foreground HWND checks, OS Caps state, physical desktop focus, DPI/native placement, and real external-app insertion will not be exercised or implemented. Their requirements remain NOT IMPLEMENTED / UNVERIFIED as specified in the final matrix.

Expected files: `src/lib/dictation/*`, `src/components/dictation/*`, `src/app/dictation/page.tsx`, root layout integration, Settings and Shell entry points, dictation tests, and `docs/dictation/*`. Preserve the O F A merge, compact tab decks, existing user edits, and frontend-only behavior.
