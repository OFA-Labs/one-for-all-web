# Voice iteration 1 - web integration

This PR connects the existing web interface to the Windows Python voice companion.
The speech/OS executor lives in the API repository. The web UI does not execute
arbitrary shell commands, carry provider credentials or implement account sign-in.

Complete architecture, setup, capability checklist, CP/AC ledger, test evidence and
limitations are consolidated in the [API voice handoff](https://github.com/jvsing/one-for-all-api/blob/feat/voice-pipeline/docs/voice/README.md).
The shared workspace keeps one report at `reports/voice-itr1.md`; older split reports
were recoverably archived. That workspace path is not required by the web runtime.

## Local setup

1. Run the API companion using its pinned Python 3.12 setup and local speech keys.
2. Run this checkout with `npm ci` then `npm run dev -- --port 3000`.
3. Open `http://127.0.0.1:3000/desktop`, or Settings -> Desktop Integration.
4. Connect once, verify the Windows origin/key prompt, and approve it yourself.
5. Switch to another website, press physical Caps Lock and say `Open WhatsApp`.

The browser stores a nonextractable P-256 key in IndexedDB. One-use challenges and
WebSocket tickets connect directly to literal loopback on this computer. Native
microphone capture needs Windows permission, not browser getUserMedia in this mode.
Stop retains pairing; Disconnect revokes grants and permission upgrades. Reload or
companion restart never resumes recording or replays a command. The future trusted
sign-in flow can request revocation using `ofa:desktop-signout`; preview roles do
not authenticate a user. Real principal/session authority remains a dependency.

## Delivered controls and limits

Desktop Integration includes app inventory/refresh/manual registration, separate
native window/read/write permissions, exact approval cards, app choices, questions,
human handoff, bounded file preview, startup preference, Stop, Quit and Disconnect.
Scope requests send a named permission; folders/executables are selected natively.
Decision requests carry only the active task/card/read hash and a decision.

Only public companion URL and a future real installer download URL belong in
`NEXT_PUBLIC_*`. Provider secrets stay native. Production/staging origins and the
installer URL remain unconfigured until a real deployment/release exists.

The original human WhatsApp M0 passed. The updated physical voice/file trial and
Slack live sending were explicitly deferred. Opening a URL proves dispatch, not
page load; personal tab control needs separate browse installation/pairing. This
is an iteration-1 control surface, not every OS use case or a production release.

Validation before publication: **3 desktop feature tests passed**; full web suite
**135 passed, 1 pre-existing dictation-focus failure** reproduced on pristine staging.
Typecheck/build, lint and dependency architecture passed. Browser feature transport
is mocked; the API handoff separately records actual OS/provider/loopback checks.
Remote CI status must be read from the PR, not inferred from these local results.
