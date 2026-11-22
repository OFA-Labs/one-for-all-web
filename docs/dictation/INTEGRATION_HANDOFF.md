# Frontend dictation handoff

## Implemented boundary

`src/lib/dictation/contracts.ts` defines the host/service seams. `src/lib/dictation/mock-services.ts` is the only implementation instantiated by `src/features/settings/components/dictation/dictation-provider.tsx`.

The adapter performs no network requests, microphone access, audio recording, speech recognition, native input injection or automatic system-clipboard changes. Artifact IDs identify **mock recovery data**, not audio files. Service names such as `startCapture` are deliberately interfaces; their mock implementations are clearly labeled `BACKEND NOT IMPLEMENTED`.

Event flow:

`consent → enable preview → page-local Caps filter → dispatch → reducer → abortable mock operation → session-correlated result → sandbox document or Recent`

The provider lives above the shared shell in `src/app/layout.tsx`, so client-side site navigation preserves a listening preview. Browser blur clears a lost key-up latch without stopping the session. Native host/app switching, real Windows background operation and non-activating windows are separate requirements, not provided by this architecture.

## Interfaces to replace later

| Interface                | Current behavior                                                                   | Future implementation required                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `connect` / `disconnect` | Availability simulation; page-local listener is installed separately after consent | Global hook lifecycle, suppression, single instance, native callback/queue, dead-hook detection, kill switches                       |
| `startCapture`           | Delayed success or simulated microphone error                                      | Reuse an existing microphone service; privately capture/validate the true native insertion target under the session ID               |
| `stopCapture`            | Returns `{kind: "simulated"}`                                                      | Stop/flush existing capture to a private recoverable artifact                                                                        |
| `recoverArtifact`        | Reuses mock session data                                                           | Resolve retained native audio privately, never exposing raw audio or sensitive native handles to UI logs                             |
| `subscribeLevels`        | Explicitly simulated meter data                                                    | Real capture levels at the required rate; native reduced-motion setting                                                              |
| `transcribe`             | Returns configured sample text, empty result, retry or multipart progress          | Existing STT mode/provider, authentication, real timeout/retry/transport limits, privacy and budget enforcement                      |
| `insertText`             | Confirms/fails a controlled demo document update                                   | Native target re-verification, per-app insertion profiles, Unicode/newline safety, full clipboard protocol and observed confirmation |

A production adapter must independently validate target identity, password/sensitive fields and foreground/integrity conditions. UI scenario values are never an authorization or security boundary. `nativeReference` is an opaque extension point; actual HWND/UIA handling must live in the desktop host.

The native overlay, OS settings/kill switches, tray lifecycle, durable audio files, host consent and IPC wiring are **not** implemented by replacing one mock function. They require the excluded desktop work described in the supplied prompt. Renew consent for a real capture-capable host; the saved consent version here authorizes a simulation only.

## Data and recovery

- `sessionStorage["one-for-all-dictation-preview-v1"]` holds only UI preferences, simulation consent, mock recovery records and demo text. No audio is captured or stored.
- Full reload starts the preview **off**. Unfinished mock sessions can be recovered from Recent in the same tab. Closing the tab does not provide native durable recovery.
- Failed or interrupted entries survive error dismissal and retry startup. They are removed after confirmed **sandbox** insertion, explicit discard, configured expiry, or explicit Reset local demo.
- Automatic fallback prepares a read-only preview clipboard. Only the explicitly clicked **Copy text** button uses the browser Clipboard API; no native snapshot/restore, cloud-history flags or automatic paste is implemented.
- Transition history is bounded metadata only: timestamp, session ID, source state, event and destination state. Other keyboard events are ignored before inspecting their properties. No transcript text is written to application logs.

## Dependencies

No dependencies were added. Existing React, Next.js, Radix, Lucide and Playwright are reused. No Electron/Tauri host, native addon, STT SDK, microphone engine, pywinauto, audio fixture injector or agent was installed.
