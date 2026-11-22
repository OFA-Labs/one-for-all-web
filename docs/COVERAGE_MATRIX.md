# Specification coverage matrix

Source: `../spec_ite1.md`, read in full. “UI” means a local representation, not a working server feature. “Handoff” means detailed registry/UI documentation. No security, latency, provider, store or real-site acceptance claim is validated by this frontend. Plan contains the full route/role inventory; BACKEND_HANDOFF is generated from 29 shared feature contracts.

| Requirement | Frontend representation | Handoff / outstanding work and reason |
| --- | --- | --- |
| A1 changes: lawful two acts, Hinglish hearing, one brain, own browser, selected files, Playground | Playground refusal/sharing, Settings language, About architecture, Connections, jobs | `social.workflow`, `voice.session`, `files.drive`, `browser.pair`; real integrations excluded |
| A2 audit: Reader, page-bound approval, frozen plan, interruption, paid providers, ledger, evidence, runbook | Reader, Plan, TaskReview, tier selector, failure tools, generated handoff | `approval.commit`, `task.start`, `task.control`, `history.list`; operational rules documented |
| A3 extension-first and sensitive-browser constraints | Assistant browser rail, phone layout, Extension, Settings blocklist | `browser.*`; no actual debugger, tab or store access |
| A4 lawful open-source base, REA limits, licenses and pinning | About credits and extension mockup notice | `browser.pair`; no proprietary code copied and no Nanobrowser fork included. Upstream choice/trials/licenses need backend/extension team |
| B1 visitor/member/owner capabilities | Role selector and distinct owner lab/Companion presentation; auth/onboarding | `auth.*`, `voice.clone`; client roles are previews only, server must authorize |
| J1 first visit: orb, talk, Reader, demo, refusal | `/`, `/reader`, `/playground`; no-login navigation | `voice.session`, `reader.speech`, `social.workflow`; all silent/sample |
| J2 sign-up, privacy/adult consent, mic denied, voice, install, pairing, explainer, safe task | `/sign-up`, `/onboarding`, `/extension`, `/connections` | `auth.*`, `voice.session`, `browser.pair`; no OTP invented since spec does not require it |
| J3 speak, screen, plan, site permission, work, missing fact, login, park, approve, commit, verify, report | Typed composer, job/PR workflows, Plan/Review/Timeline/Transcript/History | All `task.*`, `approval.*`, `browser.permissions`; login and challenges illustrated through failure tools |
| J4 phone: laptop offline, live tabs, approvals, CAPTCHA | Responsive shell, task tiles/card, offline scenario and connection status | `task.events`, `connections.telegram`; no remote click capability; explicitly stretch |
| J5 pause, cancel, new instruction, resume | Space shortcut; task controls; limited typed interruption parser; add/queue/replace | `task.control`; no speech capture or timing claim. New instruction amendment only pauses and explains backend plan validation |
| J6 Drive, Sheets/Docs, GitHub, Telegram | Connections, job resume picker preview, sheet before/after notice | `files.drive`, `stretch.sheets`, `connections.*`; least scope and account confirmation documented |
| J7 watchers | Create/edit/pause/stop/renew, sample merged/expired/failed/closed states | `watchers.manage`; no polling, timer loop or notifications |
| J8 refusal and borderline question | Refusal scenario, clarification UI; one-question policy documented | `task.start`; local scenario selector is NOT a real classifier; backend stricter-of-rules/model required |
| J9 faults | Playground “When things change”; task offline/driving/error/reconnect panels | `task.events`, `task.control`, `browser.permissions`; actual reconnect/failover unimplemented |
| J10 disconnect/delete | Connections confirmation, privacy typed DELETE, distinct local reset | `browser.disconnect`, `privacy.delete`; no server-deletion claim |
| J11 judge path | No-install Reader → refusal → Playground → optional onboarding | Local walkthrough available; no real speech, store install or contest readiness |
| B3 Act 1 no fake engagement | Declined orb/transcript/timeline with zero sample tabs/drafts | `social.workflow`, `task.start`; refusal robustness needs backend test corpus |
| B3 Act 2 four real-account drafts, partial/edit, sequential commits, evidence | Four-site sharing preview, editable/selectable card, task evidence | `social.workflow`, `approval.commit`; newest-video lookup and title/description suggestions need backend; not fabricated by frontend |
| B3 Demo 1 PR nudge + watcher | PR scenario, Slack draft, watcher manager | `connections.github`, `watchers.manage`, `connections.telegram`; no real PR check |
| B3 Demo 2 job task | Intake, local file metadata, sample confirmed facts, five listings, reasons/unknowns, relocation, approval | `jobs.workflow`, `files.*`; no real search/scoring/parsing/application |
| B3 Demo 3 research | Three-source fictional table; isolated-browser task preview | `research.workflow`; values explicitly illustrative, no live source retrieval |
| B3 Demo 4 spreadsheet | Playground research/documents tab, exact total and rename preview | `stretch.sheets`; feasibility trial and API execution outstanding, stretch |
| B3 video script | App flows support screen walkthrough; sequence documented in source | Video production not delivered: outside frontend request; no footage/audio invented |
| B4.1 14 orb states and precedence | State selector, CSS orb states, task-derived preview states | `voice.session`, `task.events`; production must derive states from actual ordered signals, not timers. Concern shown as state preview/amber ring |
| B4.1 live tabs with privacy | BrowserTiles, enlargement, driving/offline withholding | `task.events`; no screenshots captured from real tabs; real 1/5fps contract documented |
| B4.1 timeline, transcript, goal/plan/progress, controls/cards | Assistant/task detail with plan steps/events, typed transcript, flags and controls | `task.*`, `approval.*`; timelines use explicit local steps |
| B4.1 Connections, Reader, History, spoken-line flag, privacy bar | Dedicated routes; global footer and reusable FlagButton | `connections.*`, `reader.speech`, `history.list`, `speech.flag`, `privacy.delete` |
| B4.2 extension toolbar, side panel, group, shortcut, muted tabs, debug Cancel | `/extension` website mockups and explainers | `browser.pair`, `browser.permissions`; muted tabs, global shortcut and debugger detach are extension work |
| B5.1 EU WebRTC pipeline, warm rotation, credits and timings | Voice handoff plus textual failure states | `voice.session`; 4G/relay selection and real timing instrumentation unproven |
| B5.2 voice/task loops, floor queue, one talking device, no approve tool | Architecture notes, voice API metadata; sample other-device decision | `voice.session`, `approval.commit`; server loops, priority queue and device arbitration unimplemented |
| B5.3 dip/hold/cut, interruption lexicon, backchannels, negation, heard words, >10min | Pause/resume/cancel, limited parser tests for don't stop/mat/backchannels; handoff | `task.control`, `voice.session`; no audio interruption timing; fully matching production grammar not claimed |
| B5.4 concerns at pause, important-only/off, ≤1/2min | Settings concern switch; amber orb preview | `voice.session`, `settings.save`; no actual contradiction detection |
| B5.5 say important things, honesty, whole sentences, dictionary and categories | Transcript, Reader original text, evidence labels, owner cases | `reader.speech`, `speech.harness`; no rewriting logic without measurement, no dictionary integration |
| B5.6 3 takes, 20–30s, random words/date/30s, server voice ID, deletion | Owner lab take selection, current IST date, fixed challenge clearly invalid/sample | `voice.clone`, `privacy.delete`; no recording/consent validation/clone |
| B5.7 per-person English vs Hindi-English hearing, English output | Settings profile/voice selector | `voice.session`; provider trial on 50 recordings not run; Hinglish output stretch only |
| B5.8 adapters, Gradium-only, text fallback, quotas, silence close, connection rotation | Handoff and failure tools; Settings usage | `voice.session`; no fake alternate audio provider or browser TTS |
| B6.1 levels, structural rules + model, stricter decision, identity/engagement/password/payment restrictions | Refusal, question, approve and safety presentation | `task.start`; backend request screen required before all tools; classifier is illustrative only |
| B6.2 frozen sites/steps/recipients, tainted external reports, research isolation, URL/private-network checks | Visible locked plan, public research preview, handoff | `task.start`, `research.workflow`, `browser.permissions`; no browser action enforcement client-only |
| B6.3 allowlist, no arbitrary scripts/coordinates/batches, commit park, local rules, tripwire, canary | Extension boundaries, failure tools, feature details | `browser.permissions`; real tripwire feasibility and canary not implemented; fail closed documented |
| B6.4 fresh exact snapshot, signed single-use 60s token, revision, 24h review, partial, 30min drafts, race | Sample exact draft fields, edit invalidation, refresh, expiry, selection, race toast | `approval.commit`; signatures, atomics, actual clocks and storage not implemented; race toast is informational, not race enforcement |
| B6.5 site/account/every value/files/uncertainty/declarations/code | Draft review card, resume/declaration attachment and code eligibility | `approval.commit`; hidden fields/page snapshots require extension; no false claim of complete real payload |
| B6.6 voice approval guard and tap-only cases | Single-low-risk code explanation; multi-item/document card tap-only | `approval.commit`; no voice-approve action exposed, echo/readback/window checks require actual pipeline |
| B6.7 facts once, reminder20s, park unanswered | Clarification card, Settings confirmed facts, reminder explanation | `approval.question`; real remembering/reminder/park timer are backend responsibilities |
| B6.8 connections, access not approval, consent full-page/task return, wrong account/revoked grant | Connections and onboarding, handoff panels, failure notices | `browser.*`, `files.drive`, `connections.*`; all provider callbacks/scopes pending |
| B7.1 cloud brain/local hands, two repos, generated shared types | About and handoff; new `one-for-all-web` folder; UI-only architecture | No `one-for-all-core` created because backend forbidden. Extension represented as website page, not functional extension folder |
| B7.2 responsibilities and workflows | Architecture and per-feature registry | No MCP/model/OpenClaw runtime included; documentation only |
| B7.3 Manifest V3, Nanobrowser fork, keys, group/rules, license duties | Extension mockups, About credits | `browser.pair`; actual fork/permissions/store package intentionally excluded |
| B7.4 budgets, human pace, one/site/account, challenges24h, ≤4 | Usage table, four-tab preview, challenge notice | `task.start`, `browser.permissions`; rate limiting and worker dispatch require backend/extension |
| B7.5 graph, checkpoint/rebrief, exactly-once ledger, queue | Plan/timeline, side-effect ledger, queue/add/replace preview | `task.control`, `approval.commit`; no real exactly-once guarantee; only local transition tests |
| B7.6 evidence A/B/C/D and held-for-review | History labels, tier selector, unknown outcome sample | `history.list`, `approval.commit`; no real receipts or links produced |
| B7.7 OpenClaw owner stretch | Owner connection card; companion handoff | `stretch.desktop`; OS control/Windows trial unimplemented |
| B7.8 own Telegram bot, code, signed init ≤5min, no group, no same-channel approve | Non-redeemable code, sample watcher notice | `connections.telegram`; no bot, voice notes or signed webapp auth |
| B7.9 watchers1min/10/5fail/7days/dedupe/notify-only | Validated manager and lifecycle controls | `watchers.manage`; local duplicates/cap only; server scheduler/revocation/notification needed |
| B7.10 paid providers, adapters, task/user/global cost caps | Settings usage and handoff | Provider selection and costs not inferred from fictional samples; no keys/calls |
| B7.11 Langfuse and trace masking/correlation | Handoff ordered event envelope and observability notes | `task.events`; no tracing pipeline, actual screenshot refs or AI evaluations |
| B8 conceptual data entities | Typed UI shapes, generated data-needs documentation | No DB schemas/storage implementation; source B8 entity list remains backend input |
| B9 job stages A–G | All seven stages represented across Playground and interactive task | `jobs.workflow`, `files.*`, `approval.*`, `history.list` |
| B10.1 contest dates/rules | About pre-window caveat, source reference | Rules/dates/entry/credit claims not independently verified; no contest submission |
| B10.2 guest Reader, unseen text/link/PDF, highlights, flags | Reader tabs, local TXT, PDF metadata and timing preview | `reader.speech`, `speech.flag`; no audio or PDF extraction |
| B10.3 harness categories3strategies3seeds/whole-chunk/independent scoring/blind rating/cache/nightly | Owner lab controls, eleven category examples, sample ratings, template export | `speech.harness`; not a functioning benchmark, no fake metrics/request IDs/audio |
| B10.4 Gradium feedback evidence/report headings | Downloadable feedback template, `GRADIUM_FEEDBACK.md` | `speech.harness`; all real request IDs/settings/audio pending, no measured claims |
| B11.1 quotas, bot/invites, global Reader-only, roles | Usage table, role presentation, failure notice | `auth.email`, `settings.save`; no enforcement from client |
| B11.2 safe sites, group, permissions, sensitive pictures, stop, injection, admin/supply chain | Settings blocklist, Extension and Privacy; handoff | `browser.permissions`; admin MFA/secret isolation/signed keys/dependency audit + extension review required |
| B11.3 privacy/data/delete/adult/terms/audit | One-page Privacy, consent/adult, terms notice, retention table and delete confirmation | `privacy.delete`, `approval.commit`; real controller contact/legal review/provider retention outstanding |
| B12 mic unsupported, no extension, asleep, manual input, tab removed, debug Cancel | Typed fallback, pair prompt, offline/driving/removed/debug mockups | `voice.session`, `browser.pair`, `task.control` |
| B12 login, CAPTCHA/rate-limit, changed page, worker, model, Gradium | Playground failure selector; fresh-review invalidation and retry preview | `browser.permissions`, `approval.commit`, `voice.session` |
| B12 two devices/browsers, away24h, borderline, expiry, costs | Primary sample browser, race notice, approval expiry, question, watcher expiry, usage | Backend synchronization, first-wins atomics and quota enforcement still required |
| B13 Playground surfaces, fake login/CAPTCHA/slow/attack, fault drivers | Sample job/social/public surfaces and scenario notices; no actual malicious pages | Real extension-loaded E2E, fake provider servers, 30 attacks, refusal corpus, recorded speech, nightly20 fault runs and live tests are excluded backend test infrastructure; documented handoff |
| B14.1 roadmap/store fallback | Onboarding install steps and About caveat | Store packaging/review/deploy/video not done; outside local frontend scope |
| B14.2 cut line | Must-haves UI; explicit stretch cards; post-iteration notes only | No extra post-hackathon capabilities invented |
| B14.3 judging runbook | BACKEND_HANDOFF operations section | No background job, deployment, provider renewal or funded account work |
| B14.4 weekly done criteria | FRONTEND execution report distinguishes completed UI from unrun production checks | No real-world definition-of-done claimed |
| B15 success criteria | Tests cover local transitions, labels, a11y, routes and sizes | All actual latency, gate/token security, attack, exactly-once, real-site reliability, cost and first-install targets need full-stack integration; not measurable here |
| Part C accounts, keys, hosting, privacy email, design, recordings, budgets, final tests | `.env.example` needs no keys; design-system folder and setup docs | No keys requested, accounts created, cloud expenses incurred or live recordings collected; backend outside scope |
| Part D D1–D19 decisions | Preserved in screen architecture, safety/connection handoff and documented stretch boundaries | Upstream/library legal review and provider/store trials delegated as documented requirements, not executed |
| Part E E1.1–15 trials | All 15 listed explicitly in BACKEND_HANDOFF | Unrun by design: would require real extension/backend/providers/accounts and some user presence |
| Part E E2/E3 unconfirmed claims/sources | Source claims kept distinct from measured results; README setup sources only | No provider/price/legal/contest truth asserted from old source citations |

## Additional execution-prompt deliverables

| Deliverable | Location |
| --- | --- |
| Complete frontend / reusable tokens and components | `src/app`, `src/components`, `docs/DESIGN_SYSTEM.md` |
| Screen / feature / role / journey inventory and assumptions | `docs/IMPLEMENTATION_PLAN.md` |
| Reusable backend information panels | `src/components/provider.tsx` → `FeatureDetails`, all nine required fields |
| Detailed backend handoff | `docs/BACKEND_HANDOFF.md`, `docs/proposed-contracts.json`, `/handoff` |
| Spec coverage | This file |
| Dependencies, isolated environment, setup and architecture | `README.md`, lockfile, `.venv`, project-local `node_modules` and browser cache |
| Verification, completed and unfinished with reasons | `docs/EXECUTION_REPORT.md` |

No original specification file is modified. There is no claim that this frontend's illustrative safety logic protects real accounts.
