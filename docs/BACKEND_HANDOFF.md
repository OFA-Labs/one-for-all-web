# ONE FOR ALL backend handoff

Generated from src/lib/integrations.ts. Run npm run docs:generate after changing a feature.

**All endpoints and payloads below are proposals, not implemented APIs.** This project has no backend, database, real sessions, provider calls, extension automation or production infrastructure. Sample IDs, statuses and evidence are fictional.

## Integration order
1. Decide identity/session and owner-scoping model; version consent and adult assertion.
2. Generate shared wire types from FastAPI contracts, replacing illustrative client types. Keep secrets server-side.
3. Implement ordered events and snapshot recovery; authenticate task subscriptions and private frame references.
4. Implement request screen and frozen-plan validation before any tool, then real device pairing and local extension hard rules.
5. Implement park-and-commit, exact-page readings, signed single-use tokens, ledger and evidence before any consequential action.
6. Add Gradium/Pipecat WebRTC and instrument actual mic/playback timings. Orb states must come from real signals.
7. Implement scoped file/GitHub/Telegram connections and quotas; add watcher scheduler, privacy erasure and retention.
8. Measure real browser, mobile, refusal, attack, reconnect and speech acceptance criteria before enabling real sites.

## Boundaries and shared behavior
- Visitor: Reader/short voice/isolated Playground, 10 voice minutes and 3 demo tasks per day. No personal browser or connectors.
- Member: personal Chromium tasks, stock voice, selected files, connections and watchers. Owner-only: clone, higher caps and optional Desktop Companion. Server enforces roles; frontend preview selector never authenticates.
- Propose HttpOnly Secure SameSite session cookies, CSRF protection, strict owner checks, idempotency and versioned mutations. Secure cross-device authorization requires explicit design and trials.
- Event envelope: sequence, taskId, stepId, attempt, workerId, deviceId, tabId, approvalId, voiceTurnId, type, timestamp, bounded payload. Deduplicate, detect gaps, fetch snapshot and apply in order.
- Orb precedence: Reconnecting, Browser offline, You are driving, Error, Declined, Listening, Speaking, Waiting, Held, Thinking, Executing, Completed, Idle. Concern is an amber annotation.
- One foreground task and three queued. Stop/wait/ruk pauses; cancel revokes unused approvals and leaves tabs. An already-sent commit finishes and is reported, never silently undone.
- Proposed common errors: 400 validation; 401 login; 403 owner/scope/policy; 409 conflict/page changed/already decided; 410 expired; 413 size; 422 invalid input; 429 quota; 503 provider/device unavailable. Return stable code, safe message, field errors, requestId and retry guidance.
- Mask data before traces; carry correlation IDs without secrets. Langfuse integration, credential provisioning and eval pipelines are backend work, not in this scaffold.
- No DB schemas are delivered. B8 entities describe conceptual data needs only; website must never directly read a production DB.

## Screen-to-feature map
| Screen | Registry features |
|---|---|
| Account and onboarding | auth.*, browser.pair, voice.session |
| Assistant and task detail | task.*, approval.*, browser.permissions, history.list, speech.flag |
| Reader | reader.speech, files.upload, speech.flag |
| Playground | jobs.workflow, social.workflow, research.workflow, stretch.sheets |
| Connections/extension | browser.*, connections.*, files.drive, stretch.desktop |
| History/watchers | history.list, watchers.manage |
| Settings/privacy | settings.save, browser.permissions, privacy.delete |
| Owner voice lab | voice.clone, speech.harness |
| Handoff/about | All registry features and documented roadmap |

## Acceptance criteria shared by every feature
Ownership checked server-side; inputs validated; zero imaginary client API calls; loading/error/empty states replace samples; failures preserve user input and fail closed; no unverifiable success claim. Test duplicate commands, unauthorized IDs, stale state and interrupted connections. Real security/latency claims require the full system.

## auth.email — Email sign-in and registration

Module: Account. Spec: J2, B11.1–3.

### Purpose
Create an adult, consented account or securely resume a member session.

### Frontend implementation
- Email/password validation, consent and adult checkboxes
- Sign-in, registration, recovery and explicit demo-role entry

### Backend implementation required
- Implement identity provider, email verification and bot protection
- Hash credentials or delegate to a managed identity provider; issue secure HttpOnly sessions
- Enforce rate limits, CSRF protection, session revocation and server-side roles

### Data requirements
Email, password (never logged), consent version/time, adult assertion; user ID, role, verified status and session expiry.

### Proposed API contract
`POST /v1/auth/sessions`

Authentication: Public; rate limited, CSRF protection

Request example:

```json
{
  "email": "member@example.test",
  "password": "<never log>"
}
```

Response example:

```json
{
  "user": {
    "id": "u_123",
    "role": "member",
    "emailVerified": true
  },
  "next": "/onboarding"
}
```

### Business rules and permissions
- Require versioned privacy consent and adult confirmation on sign-up
- Owner privileges are assigned server-side, never by the preview role selector

### Expected frontend behavior and acceptance
Set the secure cookie, route verified accounts to onboarding or the dashboard; show verification instructions otherwise.

### Errors and edge cases to test
- Invalid credentials without account enumeration
- Unverified email, expired session, bot challenge, rate limit
- Consent not accepted or adult requirement not met

## auth.google — Continue with Google

Module: Account. Spec: J2, B6.8.

### Purpose
Sign into ONE FOR ALL with Google identity, separately from Drive file access.

### Frontend implementation
- Google entry button and handoff dialog
- Onboarding destination preview

### Backend implementation required
- Configure Google OAuth client and redirect allowlist
- Validate state, nonce and callback tokens; create or match account
- Issue revocable secure session; collect missing consent before browser pairing

### Data requirements
State/nonce, auth code; user ID, verified email, display name, onboarding status. Never send the client secret to the browser.

### Proposed API contract
`GET /v1/auth/google/start`

Authentication: Public with state and nonce

Request example:

```json
{
  "returnTo": "/onboarding"
}
```

Response example:

```json
{
  "redirectUrl": "<Google authorization URL>"
}
```

### Business rules and permissions
- Identity OAuth does not grant Drive/Gmail permissions
- Return paths must be allowlisted

### Expected frontend behavior and acceptance
Full-page redirect to consent, validate callback, restore destination and collect adult/privacy consent.

### Errors and edge cases to test
- User cancelled consent
- Wrong account, invalid state, replayed code
- Provider unreachable or unverified app

## auth.recovery — Password recovery and verification

Module: Account. Spec: J2 entry experience.

### Purpose
Recover access without exposing whether an email is registered.

### Frontend implementation
- Validated recovery email form
- Neutral response preview

### Backend implementation required
- Generate single-use expiring recovery/verification tokens
- Deliver email and implement secure reset flow
- Invalidate prior sessions when required; audit attempts

### Data requirements
Email and return path; neutral delivery result. Reset token is single-use and kept out of analytics.

### Proposed API contract
`POST /v1/auth/recovery`

Authentication: Public, rate limited

Request example:

```json
{
  "email": "member@example.test"
}
```

Response example:

```json
{
  "message": "If eligible, instructions have been sent."
}
```

### Business rules and permissions
- Do not reveal registered accounts
- Allow password managers and paste

### Expected frontend behavior and acceptance
Show a neutral check-email state; callback displays verified or reset form.

### Errors and edge cases to test
- Expired or already-used link
- Delivery delay, provider error
- Excessive attempts

## voice.session — Live voice and interruption

Module: Voice. Spec: B4.1, B5.1–5, B5.7–8, B12.

### Purpose
Talk in the website while task actions hold immediately when speech starts.

### Frontend implementation
- Fourteen orb states, transcript and typed fallback
- Push-to-talk preference and simulated listening controls
- Pause/resume/cancel plus visible provider and browser failure states

### Backend implementation required
- Negotiate EU-hosted WebRTC with Pipecat and Gradium; choose relay through a 4G trial
- Implement floor manager and ordered task events; one speaking device per account
- Dip ≤100ms, hold by 250ms, cut by 2 words/600ms; measure actual client timings
- Rotate warm connection at 40min; close transcription after 60s silence; enforce credits

### Data requirements
Session/device/turn IDs, audio frames, speech start/end, actual playback timestamps; numbered orb events and final transcripts. No raw mic recording retained.

### Proposed API contract
`POST /v1/voice/sessions`

Authentication: Visitor token with quotas or member session

Request example:

```json
{
  "deviceId": "device_1",
  "languageProfile": "en",
  "pushToTalk": false
}
```

Response example:

```json
{
  "sessionId": "vs_1",
  "transport": "webrtc",
  "negotiation": "<short-lived transport description>",
  "expiresIn": 2400
}
```

### Business rules and permissions
- Website owns audio; extension never handles microphone
- Gradium unavailable means text-only, never a silent provider switch
- Transcription selected per person, not per sentence
- Speak approval read-backs before progress; wait 700ms after user speech

### Expected frontend behavior and acceptance
Drive Listening from real mic signals and Speaking from actual audio; synchronize other states from ordered server events.

### Errors and edge cases to test
- Mic denied: retain typing
- Transport/relay failure or iPhone echo
- Credits exhausted, Gradium down, model down
- Newer device becomes speaker; reconnect without stale event replay

## task.start — Request screening and frozen plan

Module: Tasks. Spec: B6.1–3, B7.4–5.

### Purpose
Turn the user's own request into a visible immutable plan before opening any outside content.

### Frontend implementation
- Typed request, illustrative scenario selection and plan timeline
- Refusal and clarification samples; queue/add/replace choices

### Backend implementation required
- Implement start_task request screen using structural rules and a second model opinion; stricter wins
- Classify Level 1–4 before tools and log reason codes
- Create LangGraph graph, freeze sites/steps/recipients, dispatch ≤4 tab workers
- Enforce 40 actions/6min per worker, 30min task and site caps

### Data requirements
Utterance, selected device, explicit facts; task ID, policy decision, frozen plan version/hash, steps, sites and recipients.

### Proposed API contract
`POST /v1/tasks`

Authentication: Member for personal Chrome; quota-limited guest for Playground

Request example:

```json
{
  "instruction": "Ask the team to review PR #142",
  "deviceId": "device_1",
  "mode": "personal"
}
```

Response example:

```json
{
  "taskId": "task_1",
  "decision": "allow",
  "planVersion": 1,
  "sites": [
    "github.com",
    "slack.com"
  ],
  "status": "planning"
}
```

### Business rules and permissions
- Outside text may fill values but never add steps, sites or recipients
- Never fake identities/engagement, bypass CAPTCHA, type passwords or make payments
- One foreground task and at most three queued; clarify borderline identity requests

### Expected frontend behavior and acceptance
Render numbered events, frozen plan and site cards; decline creates no tools or tabs.

### Errors and edge cases to test
- Level 4 decline with reason
- Missing intent or conflicting facts
- Budget limit, offline browser, unauthenticated personal task
- Worker fails once then screenshot-backed failure

## task.control — Pause, resume, cancel and amend

Module: Tasks. Spec: J5, B5.3, B7.5.

### Purpose
Keep the user in control without losing work or repeating consequential actions.

### Frontend implementation
- Spacebar pause, resume, cancel confirmation and driving state
- Local queue and state transition preview

### Backend implementation required
- Implement idempotent pause/resume/cancel/amend commands
- Revoke unused approvals on cancel; leave tabs open
- Checkpoint and re-brief on resume; verify unknown intents before retrying
- Release backchannel holds and parse negative/quoted interruption phrases correctly

### Data requirements
Task ID, command ID, attempt, plan version, spoken/typed instruction; accepted status, already-sent actions and resumable checkpoint.

### Proposed API contract
`POST /v1/tasks/{taskId}/commands`

Authentication: Owning user or authenticated linked Telegram identity

Request example:

```json
{
  "command": "pause",
  "commandId": "cmd_1"
}
```

Response example:

```json
{
  "status": "paused",
  "revokedApprovals": [],
  "committedActions": []
}
```

### Business rules and permissions
- Stop/wait/ruk pause; cancel aborts; don't stop and wait for approval do not pause
- Never undo committed work automatically
- Paused >10min requires a fresh worker brief

### Expected frontend behavior and acceptance
Immediate held state; acknowledge action boundary; resume after fresh observation and explicit confirmation when user drove.

### Errors and edge cases to test
- Task already ended
- Command arrives after action sent
- Stale plan version, disconnected device
- Amendment changes site/recipient: require explicit user confirmation

## task.events — Live tabs, timeline and transcript

Module: Tasks. Spec: B4.1, B7.3, B7.11.

### Purpose
Show the exact state and evidence of work on laptop and phone.

### Frontend implementation
- Stacked tab decks, scrollable capture history on hover, and a full tab conversation dialog
- Event timeline, transcript flags and task detail routes

### Backend implementation required
- Provide numbered SSE/task events and authenticated snapshot recovery
- Forward extension frames from ONE FOR ALL-group tabs only
- About 1fps per tile and 5fps enlarged; mask sensitive data before storage/traces
- Carry task/step/attempt/worker/device/tab/gate/approval/voice correlation IDs

### Data requirements
Sequence, event type/time, bounded message, task IDs, private screenshot references; no raw page text in voice loop.

### Proposed API contract
`GET / SSE /v1/tasks/{taskId}/events`

Authentication: Task owner; short-lived signed frame access

Request example:

```json
{
  "afterSequence": 24
}
```

Response example:

```json
{
  "sequence": 25,
  "type": "approval.required",
  "taskId": "task_1",
  "approvalId": "ap_1"
}
```

### Business rules and permissions
- Apply events in sequence; detect gaps and refresh
- Never show frames from sensitive sites, password fields or while the user is driving
- Worker claims alone are never verification

### Expected frontend behavior and acceptance
Recover missed events, announce meaningful status and display private tab frames only when allowed.

### Errors and edge cases to test
- Out-of-order/duplicate event
- Gap after reconnect
- Screenshot redacted or expired
- Tab removed, browser asleep, unauthorized subscriber

## approval.commit — Park-and-commit approval

Module: Approvals. Spec: B6.3–6, B7.5–6.

### Purpose
Approve exactly what the page says before any externally visible consequence.

### Frontend implementation
- Exact sample payloads, accounts/files/declarations, edit and item selection
- Page-changed, expired, already-decided and partial-approval previews
- Single-action voice-code eligibility explanation; tap-only multi-item cards

### Backend implementation required
- Build cards from extension's fixed-code fresh page reading, not worker prose
- Issue signed single-use 60s commit token bound to user/task/tab/payload hash
- Extension re-reads and compares before making final click; ledger intent→committed→verified
- Reject changed snapshots, forged/reused tokens and double-device decisions atomically
- 24h review expiry, 30min rejected-draft retention, sequential commits

### Data requirements
Approval ID/revision, site/account, every field including hidden values, files, declarations, snapshot hash; selected item IDs and exact decision, evidence tier.

### Proposed API contract
`POST /v1/approvals/{id}/decisions`

Authentication: Owning user; CSRF and first-decision-wins

Request example:

```json
{
  "revision": 2,
  "decision": "approve",
  "items": [
    "slack_1"
  ],
  "snapshotHash": "<hash>"
}
```

Response example:

```json
{
  "status": "accepted",
  "commitStatus": "intent",
  "tokenExpiresIn": 60
}
```

### Business rules and permissions
- No always-allow consequential actions
- Voice: one low-risk item, read-back ended +500ms, final transcript ≤15s, approve + two-digit code, no negation; code is never spoken
- New recipients, documents, settings, deletion, declarations and multi-item cards are tap-only

### Expected frontend behavior and acceptance
Show committing, then evidence. Tier A alone or B+C counts verified; unknown is reported and never blindly retried.

### Errors and edge cases to test
- 409 page changed; invalidate and rebuild card
- 409 already decided on another device
- 410 approval/token expired
- Interrupted after first commit; report partial results
- Tier B only: submitted, not yet confirmed; D never counts

## approval.question — Clarifications and saved facts

Module: Approvals. Spec: B6.7, B9.

### Purpose
Ask only for facts that cannot safely be inferred and remember confirmed answers.

### Frontend implementation
- Relocation question, draft edits and confirmed resume facts
- Editable profile preference form

### Backend implementation required
- Create structured questions referencing missing facts
- Use confirmed profile facts, never invent qualifications or declarations
- Reminder once after 20s; park unanswered item while others continue

### Data requirements
Question/task ID, field, known fact/provenance, answer and remember flag; updated plan values without new steps.

### Proposed API contract
`POST /v1/questions/{id}/answer`

Authentication: Task owner

Request example:

```json
{
  "answer": "NCR only",
  "remember": true
}
```

Response example:

```json
{
  "accepted": true,
  "factId": "fact_1",
  "resumeStep": "prepare"
}
```

### Business rules and permissions
- Ask predictable facts up front, once
- Conflicting external claims cannot overwrite user facts

### Expected frontend behavior and acceptance
Show saved-source annotation and resume only the affected step.

### Errors and edge cases to test
- Invalid answer, stale question
- No answer: reminder then park
- Fact conflict requires confirmation

## browser.pair — Connect this browser

Module: Browser. Spec: J2, B7.3, E1.

### Purpose
Bind one user's Chromium extension to their account with a revocable device key.

### Frontend implementation
- Install/pair steps, browser list and primary-device selector
- Extension toolbar, side panel and debugging-bar UI mockups

### Backend implementation required
- Publish/audit Manifest V3 Nanobrowser-derived control layer or own audited alternative
- Website hands extension a one-time code; exchange for short-lived revocable device key
- Outgoing encrypted WebSocket, 20s heartbeat, wake/reconnect trials
- Preserve Apache-2.0/NOTICE on any fork; pin upstream and mark changes

### Data requirements
One-time pairing code/expiry, device label/browser version, device public key; device ID, last seen, primary flag. No model keys in extension.

### Proposed API contract
`POST /v1/devices/pairing`

Authentication: Member session; exchange endpoint also verifies one-time code

Request example:

```json
{
  "label": "Chrome on your laptop"
}
```

Response example:

```json
{
  "pairingId": "pair_1",
  "code": "<single-use>",
  "expiresIn": 120
}
```

### Business rules and permissions
- ONE FOR ALL group only; user retains debugging-bar Cancel and Alt+Shift+J
- No remote code, password access, private-network pages, arbitrary script or coordinate batches
- Pairing alone never authorizes a commit

### Expected frontend behavior and acceptance
Actual verified handshake shows online; first safe Playground task offered.

### Errors and edge cases to test
- Extension missing, code expired/replayed
- Store review pending: documented developer-mode fallback
- Browser asleep, heartbeat timeout
- Unsupported browser or duplicate pairing

## browser.permissions — Site permissions and local hard rules

Module: Browser. Spec: B6.2–3, B6.8, B11.2.

### Purpose
Restrict browser actions to user-approved sites inside the frozen plan.

### Frontend implementation
- Once/always access card, revocable site list and blocklist preview
- Sensitive-site and You-are-driving states

### Backend implementation required
- Enforce site permission on server and locally in extension
- Hard-block passwords/CAPTCHA, private addresses, outside-group tabs and non-plan recipients
- Implement supported-site commit tripwire after feasibility trial; fail closed
- Run Playground canary every 10min; kill switch if hard rules fail

### Data requirements
Canonical origin, scope, expiresAt, task ID, approval user/time; permission decision and blocked rule code.

### Proposed API contract
`PUT /v1/site-permissions/{origin}`

Authentication: Member; explicit site access consent

Request example:

```json
{
  "scope": "once",
  "taskId": "task_1"
}
```

Response example:

```json
{
  "origin": "https://slack.com",
  "scope": "once",
  "active": true
}
```

### Business rules and permissions
- Always access is not always approval
- Password managers remain permanently blocked; email/storage/settings ask every time and read-only by default
- Show site-automation terms notice where applicable

### Expected frontend behavior and acceptance
Resume permitted read/draft work; revoke immediately parks relevant workers.

### Errors and edge cases to test
- Blocked category, invalid origin, link >512 characters
- Unknown element means park
- Canary failure, backend unreachable
- Site terms warning, login/CAPTCHA parks for 24h

## browser.disconnect — Disconnect a browser or connection

Module: Connections. Spec: J10, B6.8.

### Purpose
Revoke access immediately without implying that removing a sample row revokes real credentials.

### Frontend implementation
- Destructive confirmation and local disconnect preview
- Primary-device reassignment preview

### Backend implementation required
- Revoke device keys or provider tokens and close sockets
- Pause affected tasks, revoke unused approvals, notify all sessions
- Delete provider grants where supported and audit revocation

### Data requirements
Device or connection ID, revocation reason; revokedAt, affected task IDs and remaining connections.

### Proposed API contract
`DELETE /v1/connections/{id}`

Authentication: Connection owner; recent authentication if required

Request example:

```json
{}
```

Response example:

```json
{
  "revoked": true,
  "pausedTasks": [
    "task_1"
  ]
}
```

### Business rules and permissions
- Disconnect is idempotent
- Extension uninstall must also end access
- No secret/token material in UI

### Expected frontend behavior and acceptance
Show disconnected after acknowledged revocation, remove live frames and offer reconnect.

### Errors and edge cases to test
- Already revoked
- Provider revocation delayed: report pending
- Network failure: retain row until confirmed

## files.drive — Google Drive file picker

Module: Files. Spec: J6, B6.8, B9.

### Purpose
Use only files the user explicitly chooses, without reading all of Drive or Gmail.

### Frontend implementation
- Allow card, sample file picker, file name/size display
- Resume-fact confirmation UI

### Backend implementation required
- Configure minimum Drive picker OAuth scope and full-page consent return flow
- Validate selected file permissions, MIME/size, scan/extract safely
- Keep private artifacts and expiry; confirm account before using files

### Data requirements
Picked file ID, provider account, MIME, name, version/hash and task use; sanitized extracted facts with source references.

### Proposed API contract
`POST /v1/files/drive/selections`

Authentication: Member plus scoped Google grant

Request example:

```json
{
  "fileId": "file_1",
  "taskId": "task_1"
}
```

Response example:

```json
{
  "artifactId": "art_1",
  "name": "Resume.pdf",
  "status": "needs_confirmation",
  "facts": []
}
```

### Business rules and permissions
- Only selected files; no Gmail API
- Connecting is not upload approval
- Google test grants may expire; do not claim broad Drive access

### Expected frontend behavior and acceptance
Show connected account and facts for user confirmation before form preparation.

### Errors and edge cases to test
- User closed consent, wrong account
- Grant revoked/expired, deleted file
- Unsupported or oversized file, extraction failure

## files.upload — Resume and document upload

Module: Files. Spec: B9, B6.4.

### Purpose
Preview a local file and later attach it only to an approved task.

### Frontend implementation
- Local PDF/TXT file metadata and size/type validation
- Sample resume facts, explicit confirmation and application card

### Backend implementation required
- Signed private upload, malware scan and safe extraction
- Store artifact hash and confirmed facts/provenance
- Extension attaches approved file itself; bind exact file to commit snapshot

### Data requirements
File bytes/name/type/size/hash, task purpose; artifact ID, confirmed facts, expiry. Local previews in this build never upload bytes.

### Proposed API contract
`POST /v1/artifacts/upload-intents`

Authentication: Member

Request example:

```json
{
  "name": "Resume.pdf",
  "mime": "application/pdf",
  "size": 182400
}
```

Response example:

```json
{
  "artifactId": "art_1",
  "uploadUrl": "<short-lived private upload URL>",
  "expiresIn": 300
}
```

### Business rules and permissions
- Never invent qualifications
- Uploading to a third-party site requires tap approval
- Only user-selected files reach the extension

### Expected frontend behavior and acceptance
Validate scan/extraction then ask user to confirm facts; bind file version to approval.

### Errors and edge cases to test
- Unsupported MIME, >10MB, encrypted PDF
- Malware or extraction failure
- Stale file hash, expired upload URL

## reader.speech — Reader speech and sentence timing

Module: Reader. Spec: J1, B5.5, B10.2.

### Purpose
Read unseen text through Gradium with sentence highlighting and pronunciation feedback.

### Frontend implementation
- Text/link/PDF modes, local TXT loading and file metadata
- Simulated play/pause, seek, speed and per-sentence flag
- No audio playback is claimed in the preview

### Backend implementation required
- Fetch links in isolated public reader with SSRF/size/type checks; safely extract PDFs
- Send complete sentences through measured speakable-text strategy and Gradium
- Stream actual audio with sentence timing and stable utterance IDs
- Apply visitor 10min/day limit and balance checks before each turn

### Data requirements
Text or public URL/artifact, voice, speed; utterance IDs, original/display text, spoken text, timing, audio reference, request IDs.

### Proposed API contract
`POST /v1/reader/sessions`

Authentication: Anonymous visitor token or member session

Request example:

```json
{
  "text": "A salary of ₹8.5 lakh per year.",
  "voice": "stock-calm",
  "speed": 1
}
```

Response example:

```json
{
  "readerId": "read_1",
  "sentences": [
    {
      "id": "s_1",
      "displayText": "A salary of ₹8.5 lakh per year."
    }
  ],
  "transport": "<authenticated audio stream>"
}
```

### Business rules and permissions
- Display text unchanged; rewriting only after category measurements
- Gradium only; provider failure means text notice
- Never use browser speech synthesis as an unlabelled substitute

### Expected frontend behavior and acceptance
Highlight according to actual playback; seek and pause audio together; flag exact utterance.

### Errors and edge cases to test
- Empty input, private-network URL, encrypted PDF
- Provider down, credits or quota exhausted
- Long input chunking, interrupted stream

## speech.flag — Flag a spoken line

Module: Voice. Spec: B4.1, B10.3–4.

### Purpose
Give reproducible pronunciation feedback tied to the real audio and provider request.

### Frontend implementation
- Flag controls on Reader sentences and assistant lines
- Reason selection and locally marked state

### Backend implementation required
- Persist feedback tied to utterance/request ID and exact settings
- Store masked text/audio reference under retention policy
- Aggregate into Gradium report without fabricated metrics

### Data requirements
Utterance ID, category, reason, expected spoken form, rating; feedback ID/request ID/audio reference.

### Proposed API contract
`POST /v1/speech/feedback`

Authentication: Visitor session with rate limit or member

Request example:

```json
{
  "utteranceId": "utt_1",
  "reason": "pronunciation",
  "expected": "eight point five lakh"
}
```

Response example:

```json
{
  "feedbackId": "fb_1",
  "requestId": "gradium_request_id"
}
```

### Business rules and permissions
- No feedback submission exists without backend
- Respect 14-day utterance-log retention

### Expected frontend behavior and acceptance
Acknowledge saved feedback; duplicates update the same item.

### Errors and edge cases to test
- Utterance expired
- Audio unavailable or wrong user
- Duplicate or invalid category

## jobs.workflow — Job discovery, evaluation and application

Module: Playground. Spec: B3 Demo 2, B9.

### Purpose
Find relevant jobs and prepare truthful applications using confirmed resume facts.

### Frontend implementation
- Intake, local resume preview, scored sample jobs and score explanations
- Relocation question, form summary, tap-only approval and evidence preview

### Backend implementation required
- Implement intake→resume→discovery→evaluation→preparation→approval→tracking
- Personal sites through extension; public research through isolated browsers
- Return score reasons and unknowns; never guess legal declarations
- Respect one worker per site/account, daily application caps and challenges

### Data requirements
Title/location/work mode/salary floor/experience/count, confirmed resume; listings with provenance, scores/reasons/unknowns, application status/evidence.

### Proposed API contract
`POST /v1/tasks/job-applications`

Authentication: Member for real sites, guest for Playground only

Request example:

```json
{
  "title": "ML Engineer",
  "salaryFloorLpa": 8,
  "locations": [
    "NCR"
  ],
  "count": 5,
  "resumeId": "art_1"
}
```

Response example:

```json
{
  "taskId": "job_1",
  "status": "intake",
  "questions": []
}
```

### Business rules and permissions
- No automated testing on real accounts
- Resume upload and declaration always tap-only
- Submission success needs Tier A or B+C evidence

### Expected frontend behavior and acceptance
Show each stage, ask unknowns, park at Submit, verify then track with evidence tier.

### Errors and edge cases to test
- Login/CAPTCHA parks only affected site
- Salary unknown, relocation conflict
- Resume revoked, application duplicate
- Submitted but not confirmed

## social.workflow — Four-site sharing and refusal demo

Module: Playground. Spec: B3 Acts 1–2, B6.1.

### Purpose
Share original posts only from genuine accounts, with individual draft review.

### Frontend implementation
- Four platform draft previews, edit/select/partial approval
- Fake-engagement refusal sample with zero tools

### Backend implementation required
- Screen fake identities and repeated engagement before any tool
- Confirm newest upload title from stored authorized channel fact
- Run up to four distinct-site workers; park at final controls
- Build one card after all ready or 90s; commit selected items sequentially and verify

### Data requirements
User-authorized source video, genuine accounts, platform-specific text, target channels, draft IDs; per-item receipt/evidence.

### Proposed API contract
`POST /v1/tasks/share`

Authentication: Member with connected personal browser

Request example:

```json
{
  "sourceVideo": "<confirmed URL>",
  "sites": [
    "youtube.com",
    "linkedin.com",
    "x.com",
    "slack.com"
  ]
}
```

Response example:

```json
{
  "taskId": "share_1",
  "status": "screening"
}
```

### Business rules and permissions
- Refuse fake identities and more than one engagement on same item from several accounts
- Unticked drafts kept 30min
- All rehearsals use stand-ins or restricted visibility; real posts never from automated tests

### Expected frontend behavior and acceptance
Show 4 drafts, per-site blockers, partial results and only Tier A links.

### Errors and edge cases to test
- Level 4 refusal
- Site session challenged
- One draft failed, page changed
- Pause after first commit

## research.workflow — Parallel public research

Module: Playground. Spec: B3 Demo 3, B6.2.

### Purpose
Compare public sources without exposing personal-browser logins.

### Frontend implementation
- Sample TTS pricing table and source/assumption labels
- Three-browser research plan preview

### Backend implementation required
- Run isolated logged-out browsers with public-network-only access
- Extract cited values/currency/units and timestamp
- Keep tainted reports from adding sites/recipients to personal plan

### Data requirements
Research question, public sources, units/currency; comparison rows, source URLs, retrievedAt, caveats. Sample prices are illustrative, not purchasing advice.

### Proposed API contract
`POST /v1/tasks/research`

Authentication: Guest quota or member

Request example:

```json
{
  "query": "Compare TTS pricing per million characters"
}
```

Response example:

```json
{
  "taskId": "research_1",
  "mode": "isolated-public"
}
```

### Business rules and permissions
- Personal Chrome never used for open-ended research
- No private-network/localhost access

### Expected frontend behavior and acceptance
Show cited findings, numbers and uncertainty; retain original text for speech.

### Errors and edge cases to test
- Page inaccessible or robots/challenge
- Incomparable pricing units
- Source changed, timeout or insufficient evidence

## watchers.manage — PR watchers and notifications

Module: Watchers. Spec: J7, B7.9.

### Purpose
Notify when a PR merges, even while the personal browser is offline.

### Frontend implementation
- Create/edit sample watcher, pause, renew, stop and event preview
- Duplicate detection, cap and expired/failed/closed states

### Backend implementation required
- GitHub authorized fixed checks on timer, no model; at most once/minute
- 10 active/user, 7-day expiry, disable after 5 consecutive failures
- Deduplicate repeated watches and notifications; recheck grants every run
- Notify only; no automated follow-up actions

### Data requirements
Provider/repo/PR number, condition, connection, expiry/failure count/last observation; watcher ID and last notified event.

### Proposed API contract
`POST /v1/watchers`

Authentication: Member with GitHub grant

Request example:

```json
{
  "repository": "acme/voice-kit",
  "pullRequest": 142,
  "event": "merged",
  "notify": "telegram"
}
```

Response example:

```json
{
  "watcherId": "watch_1",
  "status": "active",
  "expiresInDays": 7
}
```

### Business rules and permissions
- Closed unmerged ends watch early
- Recreating same watch returns existing ID
- Never acts when event fires

### Expected frontend behavior and acceptance
Acknowledge only after persistence; show next check, expiry, notice and renewal.

### Errors and edge cases to test
- No GitHub grant, private repo forbidden
- 10-watch cap, duplicate
- 5 consecutive provider failures, expiry or PR closed

## connections.github — Connect GitHub

Module: Connections. Spec: B6.8, B7.9.

### Purpose
Read authorized pull requests for PR nudges and offline watchers.

### Frontend implementation
- Connection card, allowed-data explanation and account preview

### Backend implementation required
- OAuth with minimum repository read permissions and state validation
- Encrypt tokens outside DB key storage; renew/revoke grants
- Check repo access for every watcher and task

### Data requirements
OAuth code/state; account, granted scope/repositories, last use and status. No provider token exposed.

### Proposed API contract
`GET /v1/connections/github/start`

Authentication: Member

Request example:

```json
{
  "returnTo": "/connections"
}
```

Response example:

```json
{
  "redirectUrl": "<provider authorization URL>"
}
```

### Business rules and permissions
- Access is not permission to post or change code
- No write permissions for watchers

### Expected frontend behavior and acceptance
Full-page consent, callback validation and return to preserved task.

### Errors and edge cases to test
- Consent closed, wrong account
- Token expired/revoked
- Repository access removed

## connections.telegram — Link Telegram and phone approvals

Module: Connections. Spec: J4, B7.8.

### Purpose
Deliver compact task results and verified review links to the linked person.

### Frontend implementation
- Explicitly non-redeemable demo linking code
- Sample notification and approval deep-link UI

### Backend implementation required
- Run own official-API bot and issue expiring one-time account-link code
- Reject group chats and unlinked identities; authenticate signed Web App data ≤5min
- Handle pause/cancel by code and prevent same-channel start/approve
- Send privacy-safe messages; Gradium voice notes begin ONE FOR ALL here

### Data requirements
One-time code, chat/user ID stored server-side, signed init data; link status, notification ID and review URL on own domain.

### Proposed API contract
`POST /v1/connections/telegram/link-codes`

Authentication: Member

Request example:

```json
{}
```

Response example:

```json
{
  "code": "<one-time>",
  "expiresIn": 300,
  "botUsername": "<configured bot>"
}
```

### Business rules and permissions
- No sensitive details in push text
- Task started from Telegram cannot be approved there
- First decision on phone/web wins

### Expected frontend behavior and acceptance
Show linked only after bot confirms; Review opens authenticated approval on ONE FOR ALL domain.

### Errors and edge cases to test
- Expired/reused code, wrong Telegram user
- Stale signed login data
- Approval already decided, bot blocked

## history.list — Task history and evidence

Module: History. Spec: B4.1, B7.5–6.

### Purpose
Revisit what happened and distinguish verified from merely submitted or unknown.

### Frontend implementation
- Sample searchable/filterable/sortable/paginated history
- Task detail, illustrative ledger and download of sample summary

### Backend implementation required
- Owner-scoped cursor pagination and task/evidence retrieval
- Store idempotent side-effect ledger and immutable approval audit
- Private artifact access with 7-day screenshot retention

### Data requirements
Task ID, goal, timestamps, state, attempt, tier, created item ID/link, gate reason and snapshot hash; cursor/total.

### Proposed API contract
`GET /v1/tasks`

Authentication: Member; strict owner scoping

Request example:

```json
{
  "status": "completed",
  "cursor": null,
  "limit": 10
}
```

Response example:

```json
{
  "items": [],
  "nextCursor": null,
  "total": 0
}
```

### Business rules and permissions
- intent never blindly retried; inspect first
- D evidence never counts; Tier A links only
- Submitted, not yet confirmed is distinct from verified

### Expected frontend behavior and acceptance
Show accurate server statuses, empty/error states and chronological audit.

### Errors and edge cases to test
- Unauthorized task ID
- Expired screenshot
- Cursor invalid or disconnected

## settings.save — Preferences, profile facts and budgets

Module: Settings. Spec: B5.4, B5.7, B6.7, B11.1–2.

### Purpose
Use confirmed facts and personal voice preferences without repeated questions.

### Frontend implementation
- Local non-sensitive preference storage with explicit save
- Editable sample facts, language, voice, concerns, push-to-talk and usage preview

### Backend implementation required
- Persist versioned preferences and fact provenance
- Enforce member/owner capabilities, rate caps, invites and global Reader-only kill switch
- Permanently block password managers; ask-every-time sensitive categories

### Data requirements
Display name, timezone, stock voice, language profile, concern mode, confirmed facts and version; limits, usage and policy flags.

### Proposed API contract
`PATCH /v1/me/preferences`

Authentication: Member; optimistic version check

Request example:

```json
{
  "version": 1,
  "languageProfile": "hi-en",
  "concerns": "important"
}
```

Response example:

```json
{
  "version": 2,
  "saved": true
}
```

### Business rules and permissions
- No owner role assignment from client
- Facts cannot be silently overwritten by outside content
- No always-allow commit preference

### Expected frontend behavior and acceptance
Acknowledge server save; preserve user edits on failure and resolve version conflicts.

### Errors and edge cases to test
- Invalid language/voice for role
- Version conflict, budget exhausted
- Owner-only setting denied

## privacy.delete — Delete my data

Module: Privacy. Spec: J10, B11.3.

### Purpose
Erase account data and voice clone within 24 hours with an auditable request.

### Frontend implementation
- Privacy notice, retention table and explicit confirmation
- Separate local-demo reset that makes no server-deletion claim

### Backend implementation required
- Reauthenticate, revoke sessions/device keys/tokens and stop tasks
- Erase files, history, checkpoints, traces, profile facts and provider voice clone
- Track deletion job, completion and exceptions within 24h
- Retain only legally necessary minimal audit with clear disclosure

### Data requirements
Authenticated deletion intent and confirmation; deletion request ID, status, requestedAt and deadline. No database schema is implemented here.

### Proposed API contract
`POST /v1/me/deletion-requests`

Authentication: Member with recent authentication

Request example:

```json
{
  "confirmation": "DELETE"
}
```

Response example:

```json
{
  "requestId": "del_1",
  "status": "pending",
  "deadlineHours": 24
}
```

### Business rules and permissions
- Raw mic audio not stored; utterance logs 14d; screenshots 7d; page readings hashes after task
- Provider deletion must be confirmed
- Frontend reset is not account deletion

### Expected frontend behavior and acceptance
Show scheduled request, revoke access and provide a safe status receipt.

### Errors and edge cases to test
- Recent authentication required
- Provider deletion delayed
- Request already pending, legal hold must be disclosed

## voice.clone — Owner voice enrolment and consent

Module: Owner lab. Spec: B5.6.

### Purpose
Create only an owner's consented voice with retained consent evidence.

### Frontend implementation
- Three-take selection, 20–30s script and consent phrase UI
- Owner presentation gating, countdown preview and no mic recording

### Backend implementation required
- Check owner role, capture three actual takes with noise processing off
- Issue three random words plus today's date, validate spoken within 30s
- Verify consent transcription and send selected audio to Gradium
- Keep voice ID only server-side; delete provider clone with account

### Data requirements
Owner ID, recording refs/durations, chosen take, challenge words/date/issuedAt/consent result; voice profile status without provider ID.

### Proposed API contract
`POST /v1/voice-profiles/enrolments`

Authentication: Owner only, recent authentication

Request example:

```json
{
  "selectedTake": "take_2",
  "consentChallengeId": "consent_1"
}
```

Response example:

```json
{
  "enrolmentId": "enroll_1",
  "status": "validating"
}
```

### Business rules and permissions
- No member/visitor clones in iteration 1
- Real audio and consent required; sample phrase is not proof
- Provider voice ID never reaches client

### Expected frontend behavior and acceptance
Show pending validation then usable profile or specific retake request.

### Errors and edge cases to test
- Not owner, consent mismatch or >30s
- Audio <20s or >30s, poor noise
- Provider voice quota, consent/provider deletion failure

## speech.harness — Speech harness and Gradium feedback

Module: Owner lab. Spec: B5.5, B10.3–4, B15.

### Purpose
Measure speech reliability without fabricating benchmark results.

### Frontend implementation
- Category/strategy/seed controls, illustrative case rows and blind-rating UI
- Exportable feedback template marked not measured

### Backend implementation required
- Run raw rewrite-off/on/custom strategies ×3 seeds, whole vs pieces
- Score hard substrings using two non-Gradium transcribers and name/length checks
- Cache by text/voice/settings hash; nightly runner; 100-line blind 1–5 ratings
- Generate feedback with real request ID, text, settings and audio

### Data requirements
Case ID/category, expected form, strategy/seed, provider request ID, audio ref, independent scores and blind rating.

### Proposed API contract
`POST /v1/speech-tests/runs`

Authentication: Owner

Request example:

```json
{
  "categories": [
    "currency",
    "names"
  ],
  "strategies": [
    "raw-off",
    "raw-on",
    "custom"
  ],
  "seeds": [
    1,
    2,
    3
  ]
}
```

Response example:

```json
{
  "runId": "run_1",
  "status": "queued"
}
```

### Business rules and permissions
- Never grade with Gradium's own transcription
- No real success percentages or latency claims from preview
- Report provider dictionary gaps with reproducible evidence

### Expected frontend behavior and acceptance
Stream measured rows and build feedback only from completed runs.

### Errors and edge cases to test
- Quota/provider errors
- Missing reference pronunciation or audio
- Partial run and invalid comparison

## stretch.sheets — Picked Google Sheets and Docs edits

Module: Stretch. Spec: J6, B3 Demo 4, B14.2, E1.13.

### Purpose
Edit a selected file via API, then show the result in personal Chrome.

### Frontend implementation
- Expense-sheet before/after preview and total-row summary
- Explicit stretch badge and exact-request handoff

### Backend implementation required
- Trial whether picker grant permits Sheets/Docs edits
- Build approval from exact API request, version and cells
- Apply only approved edit; verify read-back and open selected document

### Data requirements
Picked file/version, range, existing values, proposed mutations; revision ID and read-back evidence.

### Proposed API contract
`POST /v1/document-edits`

Authentication: Member, selected-file grant and tap approval

Request example:

```json
{
  "fileId": "sheet_1",
  "range": "A8:B8",
  "values": [
    [
      "Total",
      28450
    ]
  ],
  "rename": "November"
}
```

Response example:

```json
{
  "approvalId": "ap_sheet_1",
  "status": "parked"
}
```

### Business rules and permissions
- Stretch only after must-haves
- No entire-Drive permission
- Version conflict invalidates approval

### Expected frontend behavior and acceptance
After approved commit, show read-back totals and open selected file.

### Errors and edge cases to test
- Scope insufficient: defer feature
- File changed, access revoked
- Partial edit requires accurate report

## stretch.desktop — Desktop Companion and remote input

Module: Stretch. Spec: B7.7, B14.2, E1.14.

### Purpose
Optionally act in explicitly enabled desktop apps/folders through an owner-only companion.

### Frontend implementation
- Disabled-by-default owner Companion card and permissions explanation
- Remote-input stretch status; no OS control or files accessed

### Backend implementation required
- Trial OpenClaw Windows tool hook and authenticated transport
- Gate every desktop action; park every file mutation
- Allowlist apps/folders and keep view-only without active task
- Phone click control requires a separately secured, consented implementation

### Data requirements
Paired device/app/folder allowlist, task, exact file mutations and hashes; gate decision and verification.

### Proposed API contract
`POST /v1/companions/pairing`

Authentication: Owner only and explicit local consent

Request example:

```json
{
  "platform": "windows",
  "mode": "view-only"
}
```

Response example:

```json
{
  "pairingId": "comp_1",
  "status": "awaiting-local-consent"
}
```

### Business rules and permissions
- Stretch, not part of functional frontend
- No shareable gateway for strangers
- All changes require approval

### Expected frontend behavior and acceptance
Only after trial and explicit consent show actual paired status.

### Errors and edge cases to test
- Windows support/transport unproven
- Out-of-allowlist app/file
- Offline companion or gate bypass: stop

## dictation.preview — Caps Lock dictation — frontend preview

Module: Voice. Spec: Dictation prompt §§3–10; frontend-only scope override.

### Purpose
Review consent, toggle states, recovery and insertion outcomes without any native hook, microphone, STT or external app changes.

### Frontend implementation
- Consent-gated Caps Lock handling while the website is focused
- Nonmodal indicator, simulated levels, status, retry and recovery UI
- Typed abortable mock adapters and original/current sandbox target policies
- Preview clipboard fallback and explicitly user-clicked browser copy

### Backend implementation required
- NOT IMPLEMENTED: global native keyboard capture/suppression, background host and single instance
- NOT IMPLEMENTED: reuse real microphone/STT/insertion services through DictationServices
- NOT IMPLEMENTED: native overlay, private audio files, clipboard snapshot/restore and desktop tray
- NOT IMPLEMENTED: native kill switches, crash breaker, Windows E2E and latency/soak gates

### Data requirements
Session-correlated UI events, opaque artifact references, target policy, consent version and phase progress. The browser adapter uses only mock recovery tokens and demo text; no audio or non-trigger keystrokes.

### Proposed API contract
`Local adapter contract (not implemented) src/lib/dictation/contracts.ts — DictationServices`

Authentication: Explicit preview consent now; native identity and consent must be implemented separately

Request example:

```json
{
  "event": "TOGGLE",
  "binding": {
    "trigger": "CapsLock"
  },
  "mode": "simulation"
}
```

Response example:

```json
{
  "phase": "LISTENING",
  "nativeCapture": false,
  "externalInsertion": false
}
```

### Business rules and permissions
- Never describe browser simulation as working system-wide dictation
- No new HTTP endpoints or real voice requests
- Keep failed or interrupted preview data until confirmed sandbox insertion, expiry or explicit discard
- Only an explicit Copy text click writes the browser clipboard

### Expected frontend behavior and acceptance
The UI completes the simulated flow in an in-app target. Native behavior remains not implemented.

### Errors and edge cases to test
- Simulated mic/connection/keyboard availability errors
- Closed, elevated and password targets
- Stale results, cancellation and interrupted preview recovery

## Unproven infrastructure / operations
All 15 prep-week trial items in E1 remain unrun: extension lifetime, concurrency, background frames, tripwire, upload, real-site challenge rate, phone frame latency, store review, 4G transport, India–EU latency, Gradium session limit, Hinglish transcription selection, Sheets permission, Windows Companion hook, and Nanobrowser adaptation. E2 source claims require primary-source verification.

Judging operations: daily database/Reader/Playground probes; privacy-safe Telegram alert; renew Google test grants every 6 days; funded model/server/Gradium through judging; credit checks 20 Dec and 1 Jan. These are requirements from the source, not deployed jobs.

Excluded future roadmap: member desktop companion, Microsoft 365, always-allow commits, WhatsApp and meeting clones. No UI suggests these are currently available.
