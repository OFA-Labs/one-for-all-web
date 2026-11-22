# Dictation QA

## Browser walkthrough

1. Run `npm run dev`; open `/dictation`. Caps Lock is inert for the feature while Off.
2. Turn on **Enable dictation preview**. Read the consent; no hook or microphone is installed. Without acknowledging, Enable preview remains disabled. Cancel leaves Off.
3. Acknowledge and click **Enable preview**. The badge becomes Ready. Choose a mock app and focus its text area.
4. Press Caps Lock once. Observe Starting then Listening. Holding/releasing the key, waiting silently, switching mock app tabs, minimizing the mock target, or navigating to another site page must not stop the browser preview.
5. Press again after at least 400ms of listening. Observe Transcribing, Inserting, and the exact sample text in the chosen sandbox target. The indicator hides; automatic display did not move browser focus.
6. Test Original versus Current target policy, line breaks, code, Devanagari, emoji, and the empty-result scenario. These validate the demo only, not external app insertion.
7. Select connection failure. Observe retry 1/2 and 2/2, then Recent. Change scenario to success and retry; the entry remains until sandbox insertion completes.
8. Select a closed/elevated target. Inspect the preview clipboard and retained transcript. Automatic fallback must not change your real clipboard. Explicit Copy text is a separate browser action.
9. Test microphone unavailable, password target and keyboard availability failure. For the keyboard availability scenario, disable/re-enable; change to success and use Retry availability.
10. While listening, disable from Settings or the floating controls menu. The indicator disappears and an unfinished preview is retained. Caps Lock is inert for this feature afterward.
11. Reload while listening. Confirm Off and a recovered mock session in Recent. Enable explicitly and retry, or Discard. Check expiry preference and the simulated cap/device/lock controls.
12. Enable reduced motion and confirm a static dot. Check 375px, tablet, desktop and keyboard-only controls. Use Settings → Dictation as another entry point.

## Native desktop QA — NOT RUN / UNVERIFIED

All items below require the explicitly excluded native/backend implementation. The provided Appendix A harness was not executed or installed.

- Physical Caps Lock state and suppression, Shift/Ctrl/Alt/Win combinations and IME/layout behavior.
- Dedicated native hook thread, callback latency/queueing, injection flags, switch bounce, latch recovery, silent hook removal, no idle-reset heartbeat, single instance, helper lifetime and cleanup after crash.
- Recording with the main window minimized/hidden for ≥60s, app switches, silence, lock/suspend/RDP disconnect and full application exit/crash.
- A real microphone, device hot-swap, STT provider credentials, provider duration/file limits, transport chunking, request timeouts/retries and real empty speech.
- Native overlay `WS_EX_*` flags, foreground HWND unchanged, Windows work-area placement, monitor movement, negative coordinates, 100/125/150/200% DPI, taskbar changes and fullscreen-exclusive behavior.
- Native insertion into Notepad, VS Code, Chrome/chat and terminal profiles; UIPI/elevation/secure desktop refusals; true foreground re-verification and no Enter/send keystroke.
- All-format clipboard snapshot/restore, newer user clipboard copy protection, delayed formats, clipboard history/cloud exclusion and clipboard lock retries.
- Private disk audio, user-only ACLs, crash recovery, correct expiry, real long-session RAM/CPU behavior, p95 latency budgets and p99 native callback duration.
- Native tray, close-to-tray, native sounds, CLI/env disable, crash-loop breaker and OS-level kill-switch cleanup.

Before such work is implemented, verify the specified Win32 behavior against current Microsoft documentation and repeat the actual desktop gates. Browser simulation tests cannot establish any of these results.
