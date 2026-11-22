# ONE FOR ALL frontend implementation plan

## Current visual revision
The implementation plan below records the initial product scaffold. The user's later revision renames the product and project folder to **ONE FOR ALL** / `one-for-all-web`, replaces the CSS orb with the supplied recording, and applies the charcoal patterned theme across the website. **Tap to talk** now starts the muted visual directly; actual voice integration remains separate. The idle display is a still poster and playback has explicit pause behavior. See [CHANGE_REPORT.md](CHANGE_REPORT.md), [THEME_REFRESH.md](THEME_REFRESH.md), and [VIDEO_ASSET.md](VIDEO_ASSET.md) for the current implementation and verification.

Media preparation uses a freshly created project-local `.venv` with `imageio-ffmpeg==0.8.1`; the previous media environment is preserved as the sibling `.previous-media-venv` outside the project. The 4K export improves presentation through cleanup and scaling; it does not restore native 4K source detail.

## Scope and source
Source: ../spec_ite1.md, iteration 1, all Parts A–E. The supplied execution prompt explicitly narrows the deliverable to a frontend representation. No FastAPI app, database, API routes, server actions, real authentication, model calls, speech services, extension control, or cloud infrastructure will be built. The spec's contest dates, prices, citations and trial outcomes are source claims, not independently verified results. Building this preview before 20 November must not be presented as contest-eligible work; contest eligibility needs independent confirmation.

## People and journeys
Visitor: enter → type or inspect voice preview → Reader or Playground → sign-up preview.
Member preview: sign-in → privacy/adult consent → voice → browser pairing explainer → safe sample task → monitor → clarify/permit/approve → evidence → history.
Owner preview: member flow plus voice-consent UI, speech harness and Desktop Companion information. Role selection is a demo control, not authorization.
Phone: same website, responsive navigation, task cards and tab previews; laptop unavailable is an explicit state.

## Screen inventory and navigation
| Route | Purpose / roles | Interactions |
| --- | --- | --- |
| / | Assistant, all | User-triggered sculpture video, separate status previews, typed requests, scenario runner, queue/replace, plan, transcript, pause/resume/cancel, browser tiles, recent activity |
| /sign-in, /sign-up, /recover | Entry, all | Labelled validated forms, Google integration panel, reset panel, explicit demo entry |
| /onboarding | Member/owner preview | Consent, adult confirmation, stock voice, microphone explanation, pairing, safe task |
| /reader | All | Text/link/PDF tabs, file metadata, sentence highlighting, seek/speed, flagging, simulated playback, speech handoff |
| /playground | All | Job intake, resume facts, scored listings, clarification, approvals, 4-site drafts, research comparison, failure scenarios |
| /tasks/[id] | Task detail, all sample data | Frozen plan, event timeline, transcript flags, approval selections/edit/expiry/page change, evidence and ledger |
| /history | Members (sample visible to visitors) | Search, status filters, sort, pagination, details and repeat preview |
| /watchers | Members | Validated PR watcher editor, 10-watch limit, pause, stop, renew and sample event |
| /connections | Members | Browsers, primary device, permissions, Drive, GitHub, Telegram code preview, disconnect confirmation |
| /settings | Members/owner | Profile facts, language, voice, interruption, notification settings, local preferences, blocklist and usage preview |
| /privacy | All | One-page notice, retention, delete-data integration panel and reset local demo |
| /extension | Members | Website-hosted toolbar and side-panel mockups, debugging bar, tab group and shortcut explainer; no real extension permissions |
| /voice-lab | Owner | Three-take clone and consent UI; speech category/strategy/rating preview; no recordings or scoring claimed |
| /handoff | Engineers | Searchable feature registry, all nine handoff fields, proposed contracts; documentation export |
| /about | All | Scope, architecture, credits, roadmap and explicit stretch items |
| unknown route | All | Accessible 404 and return link |

## Feature architecture
Next.js App Router + TypeScript + React; Tailwind and shadcn/ui primitives. Framework serves UI only. Pure typed domain reducers model local task transitions. One provider holds ephemeral sample session/task/notification state and optional non-sensitive local preferences. Stable IDs map UI controls to structured integration metadata. Documentation is generated from that same metadata to prevent drift.

Frontend state: routing, forms, validation, search/filter/sort/pagination, sample questions, sample plan, simulated approvals, sample evidence, Reader highlighting, voice-state controls, demo settings. Server-dependent actions open the shared handoff panel before an explicitly named local preview is offered. Nothing makes network requests to invented endpoints. All illustrative statuses say sample/preview.

## Historical first-build design plan and critique
This section explains the original light workbench and CSS orb. It is retained as design history; the current dark palette and supplied-video presentation are documented in the revision references above.
Direction: a calm personal workbench, not a sci-fi control room. One memorable element: a sculpted teal voice orb with orbital rings. Quiet surrounding surfaces and varied information density: open hero, thin activity rows, structured review sheets, browser-window previews.
Palette: paper #F6F8FA, surface #FFFFFF, ink #172B3A, muted #526474, deep teal #006C70, amber #8A5A0A. Dark navy navigation uses white text. Semantic warning/error/success include words and icons.
Type: Manrope for headings and DM Sans for reading, self-hosted from npm. 12/14/16/20/28/36 scale; 16px mobile inputs; tabular figures only where useful. Rounded 6px inputs, 10px panels, pill statuses; no identical card grid.
Layout: left-aligned workbench with desktop sidebar, mobile drawer and five-item quick navigation; main voice workspace and narrower browser/activity rail. Reader uses a reading measure; approvals use a diff-style review.
Critique: the skill's generic landing/video pattern is less useful than the actual interactive workbench. Keep its flat teal productivity palette and performance/accessibility guidance, adapt typography and layout to voice-first work. Gradients are confined to the orb where they explain a three-dimensional object. No glass backgrounds or ornamental dashboard stats.

## Development sequence
1. Isolated local dependencies, design system and reusable accessible primitives.
2. Typed sample data, task transitions and feature integration registry.
3. Shell, entry/onboarding, assistant and task review.
4. Reader, Playground/jobs, history, watchers, connections and settings.
5. Extension surfaces, privacy, owner lab and handoff browser.
6. Coverage matrix and generated backend handoff.
7. Typecheck, lint, production build, browser interactions, accessibility and responsive screenshots; fix failures.

## Assumptions
- The original build preserved the source specification. The subsequent user-requested rebrand updates the product name in both `../spec_ite1.md` and `docs/SOURCE_SPEC.md`; the project now lives in the independent `one-for-all-web` folder.
- Node packages are project-local in node_modules; Python tools use .venv. Node does not run inside a Python virtual environment.
- No credentials are needed for this frontend. Only non-sensitive demo preferences may persist locally; files, transcripts and approvals remain in-memory.
- Owner, member and visitor are explicit preview roles with no security boundary.
- All live-browser pictures, audio-level signals, task timings, balances, verification evidence, watcher events and provider reports remain fictional samples. The sculpture video itself comes from the user's actual supplied recording and is decorative visual playback, not live task or audio evidence.
- Extension is represented by browser UI mockups, not a functional manifest, fork, pairing channel or store package.
- Stretch features have explanatory UI/handoff coverage, not functional integration. Post-hackathon capabilities are documented only.

## Quality criteria
Accessible modal focus trap/restore and Escape; labelled forms, keyboard navigation, reduced motion, visible focus, sample-data banner. Test full local journeys, state-invalidating approvals, stop semantics, role-specific presentation, links/deep routes, empty/error states and mobile/tablet widths. No real safety/latency/security claim can be validated in a frontend-only build.
