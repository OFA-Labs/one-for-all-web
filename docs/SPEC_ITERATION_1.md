# ONE FOR ALL — Spec, Iteration 1 (final)

A voice-first assistant that works in your own browser, for every user.
Built for the Gradium × TensorTonic Voice Challenge: **20 Nov 2026, 9 PM IST → 20 Dec 2026, 9 PM IST**.

This version replaces all earlier ones. It follows the decision of 16 Nov 2026: **the brain runs in the cloud; the hands run in each user's own Chrome, through a ONE FOR ALL extension** — the way Claude in Chrome works, but voice-first and open to anyone who visits the website.

**The final goal:** anyone opens the website, connects their browser once, and ONE FOR ALL becomes their assistant. You talk; it works in your own browser with your own logins; it shows what it is doing, asks when unsure, stops when you say stop, and never takes a consequential action without your permission.

How to read this file:

- **Part A** — what was challenged and changed, and why.
- **Part B** — the spec. **B2 walks through every step a user takes.**
- **Part C** — what I need from you, with dates, paid options and free fallbacks.
- **Part D** — decisions: yours, and defaults you can veto.
- **Part E** — what is still unproven, and sources.

Labels: **[verified]** = read on an official or primary source on 14–16 Nov 2026. **[check]** = not yet confirmed; it is tested before we depend on it.

---

## Part A — What changed and why

### A1. The original proposal (v1.0)

| # | v1.0 said | Problem | What we do now |
|---|---|---|---|
| 1 | Golden demo: many YouTube accounts with fake names and photos liking and commenting on your brother's video | Fake engagement with invented identities. Not built, in any form. | Your idea: two acts. Act 1, ONE FOR ALL refuses this out loud. Act 2, it does the real version from your own accounts (B3). |
| 2 | Hinglish voice on Gradium | Gradium speaks and hears only English, French, German, Spanish, Portuguese [verified] | ONE FOR ALL speaks English on Gradium and understands your Hinglish through a second transcription service (B5.7) |
| 3 | LangGraph and OpenClaw both orchestrating | Two brains fight | LangGraph is the one brain. OpenClaw becomes the Desktop Companion (B7.7) |
| 4 | Naukri, Indeed, LinkedIn as the target | They were only examples. The real goal is any task, on any site, for any user. | The extension: ONE FOR ALL works on any site in your own browser (B7.3) |
| 5 | Resume from Gmail through Google's API | Gmail reading is a restricted Google permission | Upload or the Drive file picker. Gmail in your own browser is possible later (B14.2) |
| 6 | Testing on live sites only | Not repeatable, and test runs would risk your real accounts | A Playground: our own test sites, used for automated tests and for guests (B13) |

### A2. Changes from the five-reviewer audit (15 Nov) that still apply

| # | Finding | What we do |
|---|---|---|
| 1 | The contest scores every entry on the same set of hard text, plus streaming and interruption for voice apps [check the Rules tab] | **Reader mode**: anyone can paste text and hear it on Gradium (B10.2) |
| 2 | Approvals were bound to "click element 37", not to what you saw | **Park and commit**: workers stop before the final button; the card is built by code from a fresh reading of the page; the click happens only with a signed token that matches that reading (B6.4) |
| 3 | "Harmless" typing or link-opening can leak your data | **Frozen plan**: outside text can fill values but never add a step, site or recipient (B6.2) |
| 4 | ONE FOR ALL could not hear your Hinglish | Transcription chosen per person (B5.7) |
| 5 | Voice approval was unsafe; "stop" relied on late text | Code on the card for voice approval (B6.6); any speech instantly holds the next action (B5.3) |
| 6 | Free AI keys cannot run browser workers | A paid model key (Part C, row 3) |
| 7 | The free stack would die during judging (20 Dec – 5 Jan) | A judging-window runbook (B14.3) |
| 8 | "Exactly once" and "verified" had no design | A ledger with states (B7.5) and evidence tiers (B7.6) |
| 9 | Many behaviours were undefined | Edge-case table (B12) and weekly definitions of done (B14.4) |

### A3. The decision of 16 Nov: extension-first

Why this is the right shape:

| Problem with the cloud-browser design | How the extension solves it |
|---|---|
| LinkedIn, Google, X block or challenge logins from servers [verified for Google and LinkedIn] | Sites see your own Chrome, your home connection and the login you already have |
| One OpenClaw gateway cannot safely serve strangers [verified] | Every user's hands are their own browser; nothing is shared |
| Four browsers per user on our server is expensive | The server runs only the brain, voice and guest browsers |
| Take Control was a complicated remote-control feature | It is your own browser: you just click |
| Act 2 needed four separate API integrations | It runs in your own logged-in tabs |

What it costs us, honestly:

- **Desktop apps and local files are outside the browser.** Desktop Excel, Word and "move this file" need the Desktop Companion (B7.7), which is a stretch goal in this hackathon.
- **Big companies already do "AI in my browser".** Claude in Chrome does it [verified], and ChatGPT's Chrome extension has controlled tabs since 15 Oct 2026 [verified]. Our difference must be: **voice-first, in a voice made for you, with two-way interruption, approvals from your phone, and approval cards built from the page itself.** That is also what the contest scores.
- **Your real browser is the most sensitive place there is.** Banking, email and everything else is logged in. B11 follows the safety model of Claude in Chrome and adds ours.
- **Chrome Web Store review takes an unknown time.** A backlog of more than three weeks was reported in April 2026; Google said in August that times were back to normal [verified]. We submit early and keep a fallback (B14.1).
- **Chrome shows "ONE FOR ALL started debugging this browser"** on every tab while the extension acts. It cannot be hidden for normal users [verified]. Claude in Chrome shows the same bar.

### A4. Where the extension's code comes from (16 Nov)

You asked to (1) use the "Reverse Engineer Anything" repository to rebuild Claude in Chrome, and (2) use the most-starred open-source project.

**1. REA — found, and already connected in this coding environment.** It is `morluto/rea`, MIT licence, about 460k stars [verified on GitHub]. It cannot be used to rebuild Claude in Chrome, for four reasons:

- REA's own disclaimer says it will not help with "copying proprietary software or reproducing its protected code and assets" [verified].
- Anthropic's consumer terms forbid recovering readable code from its services by decompiling, except where the law overrides that [verified].
- Copying another extension's code breaks the Chrome Web Store's intellectual-property policy; the listing can be removed [verified].
- The contest expects our own app, built inside the window [check].

The same applies to ChatGPT's extension or any other closed product. It is also unnecessary: an open-source extension already does what we need, legally.

What we do use REA for, all lawful: reading and understanding the open-source base quickly; debugging our own extension and website; and observing how target sites behave in your own browser — for example, which network request is the real "Submit" — to build the tripwire lists and site notes.

**2. Most stars is not the right test on its own.**

| Project | Stars | Licence | What it is | Fit |
|---|---|---|---|---|
| alibaba/page-agent | 29.7k [verified on GitHub] | MIT | A library you embed in your own website; an optional extension for multi-page tasks | The most stars, but built to run inside a page you own, with in-page JavaScript. Its clicks are not real user input, so some sites ignore them, and it cannot watch network requests. Useful ideas for page reading. |
| **nanobrowser/nanobrowser** | 14.3k [verified on GitHub] | Apache-2.0 | A Chrome and Edge extension agent in your logged-in browser. Its control layer uses `chrome.debugger`, has no AI inside, uses real input, checks visibility, works in one tab group per task, and asks before submit, send, delete or upload [verified] | **Best fit: almost exactly our "hands"** |
| hangwin/mcp-chrome | 11.6k [listing, Mar 2026] | MIT | Extension plus a local program each user must install | Not for website users |
| BrowserOS | about 40k [third-party listing] | not checked | A whole separate browser | Users would have to switch browsers |
| WebBrain | unclear | MIT or GPL (sources conflict) | Side-panel agent | Licence unclear; skipped |

**Default (D18):** the extension is built on Nanobrowser, borrowing page-reading ideas from page-agent where they help. Both licences allow commercial use and changes (B7.3).

---

## Part B — The spec

### B1. Product in one paragraph

You open the website and talk. ONE FOR ALL answers out loud, makes a plan you can see, and does the work in your own Chrome, in a coloured **ONE FOR ALL tab group**, using the accounts you are already signed in to. It says only what matters, holds the moment you start talking, asks when a fact is missing, and waits for your approval before anything with a consequence outside your computer. From your phone you can watch, talk and approve while your laptop does the work. Results and approval requests also come to Telegram.

**Three kinds of user**

| | Visitor (no account) | Member (signed up) | Owner (you, and people you allow) |
|---|---|---|---|
| Reader mode | yes | yes | yes |
| Talk to ONE FOR ALL | yes, stock voice, short sessions | yes, choose a stock voice | yes, a clone of your own voice |
| Try a demo task in our cloud browser (Playground, public web) | yes | yes | yes |
| Connect your own Chrome and run real tasks | — | **yes** | yes |
| Google Drive files, GitHub, Telegram, watchers | — | yes | yes |
| Desktop Companion (stretch) | — | — | yes |

Voice clones are owner-only in iteration 1, because every clone needs a consent check and Gradium plans hold a limited number of custom voices [verified: 5 on the free plan].

### B2. How someone uses ONE FOR ALL — step by step

#### J1. First visit

1. The visitor opens the website. The orb breathes. One big button: **Tap to talk.** (Phones and browsers block the mic and sound until you tap.)
2. They say "Hi". ONE FOR ALL answers in a stock voice and offers three things: *read something aloud*, *watch me do a task*, *sign up to use me in your own browser*.
3. **Read something aloud:** paste text, a link or a PDF → Reader mode reads it, highlighting each sentence (B10.2).
4. **Watch me do a task:** a demo task runs in our cloud browser on the Playground, with live view and an approval card.
5. **Try to misuse it:** ask for fake accounts → ONE FOR ALL refuses out loud (Act 1).

No account is needed for any of this. Limits per visitor keep costs down (B11.1).

#### J2. Sign up and connect your browser (about 2 minutes, once)

1. **Sign up** with email or Google on our website. Read the one-page privacy notice; tick consent; confirm you are an adult.
2. **Microphone:** allow it once. If refused, typing works and ONE FOR ALL still speaks.
3. **Voice:** pick a stock voice. (Owner: record 20–30 seconds and a consent phrase to create your clone — B5.6.)
4. **Connect your browser:** tap "Add ONE FOR ALL to Chrome". The Chrome Web Store opens; install the extension.
5. The extension opens our website by itself; you tap **Connect this browser**. The website hands the extension a one-time code; the extension swaps it for its own device key. Your Connections page now shows "Chrome on your laptop".
6. A short explainer: the coloured **ONE FOR ALL** tab group (ONE FOR ALL only touches tabs inside it), the "started debugging" bar (it means ONE FOR ALL can act; clicking Cancel on it stops ONE FOR ALL at once), the **Alt+Shift+J** pause shortcut, and the toolbar Stop button.
7. **First safe task**, suggested: "Open the Playground and fill the sample form" — to see it work before trusting it with a real site.

Works on Chrome, Edge and Brave (all Chromium) [check Edge/Brave store listing].

#### J3. An everyday task, at your laptop

Example: "One For All, update my LinkedIn headline to 'ML Engineer | Voice AI' and tell my team on Slack."

1. **You speak.** The orb shows Listening, then Thinking.
2. **Request screen.** Code checks the request for Level 4 problems before anything else (B6.1). This one is fine.
3. **The plan appears**, written only from your words: *LinkedIn — change headline; Slack — post in #team.* You can change it by voice.
4. **Site permission.** The first time ONE FOR ALL needs a site, a card asks: "Allow ONE FOR ALL on linkedin.com? Once / Always." Same for Slack.
5. **Work starts** in new tabs inside the ONE FOR ALL group. You see them move. The dashboard timeline shows each step. ONE FOR ALL says only what matters: "Opening LinkedIn."
6. **A question** if something is missing (Level 2). Answers are remembered.
7. **Not logged in?** ONE FOR ALL stops on that site: "Please log in to LinkedIn in the ONE FOR ALL tab." You log in yourself; it continues. ONE FOR ALL never types or sees a password.
8. **Park.** At the Save or Post button, the worker stops. The extension reads the page itself; the approval card shows exactly what will change: old headline, new headline, the Slack message, which account.
9. **You approve** by tapping, or by voice with the two-digit code on the card (B6.6).
10. **Commit.** The extension re-reads the page; if anything changed, the approval is void and a new card appears. Otherwise it clicks.
11. **Verify.** ONE FOR ALL reloads the profile and the channel to confirm the change is really there.
12. **Report:** "Done. Your headline now reads ML Engineer, Voice AI, and I posted in team." Saved in History.

If you click or type in a ONE FOR ALL tab while it works, ONE FOR ALL pauses itself and the orb shows **You are driving**. When you stop, it looks at the page again and asks whether to continue.

#### J4. From your phone, away from the laptop

1. Your laptop is on, with Chrome open and the extension connected. (If not, ONE FOR ALL says "your browser is offline" and offers what it can do without it: Reader, chat, Drive files, watchers.)
2. Open the website on your phone and sign in. Tap to talk.
3. The task runs in the laptop's Chrome. Your phone shows a live picture of each ONE FOR ALL tab, sent by the extension.
4. Approval cards appear on the phone and on Telegram. Tap to approve.
5. A login or CAPTCHA on the laptop: ONE FOR ALL parks that site and tells you; you handle it when you are back. (Clicking on the laptop from your phone is a stretch goal — B14.2.)

#### J5. Interrupting

- Start talking → ONE FOR ALL's voice dips at once, the next browser action holds, and it stops speaking after two words.
- "Stop", "wait", "ruk" → **pause**. Nothing is lost. "Continue" resumes.
- "Cancel" → **cancel**. Tabs are left as they are, unused approvals are revoked, the task closes.
- A new instruction ("pehle salary check kar") → pause, do that, report, ask whether to continue.
- Full rules: B5.3.

#### J6. Connections beyond the browser

- **Files in Google Drive:** "use my resume from Drive" → an Allow card → Google's file picker → you pick the file. ONE FOR ALL can read only files you pick (B6.8).
- **Spreadsheets and documents:** "add a total row to this sheet" → pick the file → ONE FOR ALL edits it through Google's API and opens it in your browser to show you (if time — B14.2).
- **GitHub** for watchers that must run while your laptop is off.
- **Telegram:** the dashboard shows a one-time code; send it to the ONE FOR ALL bot. From then on you get results, voice notes and approval links there.

#### J7. "Tell me when…"

"Tell me when my PR is merged." → a watcher, checked by our server through GitHub, even with your laptop off. When it happens: a Telegram message and a voice note that begins "ONE FOR ALL here". "What are you watching?" lists them; "stop watching that" removes one.

#### J8. When ONE FOR ALL says no, or asks

- A Level 4 request (fake accounts, bypassing a CAPTCHA, faking reviews) → declined out loud with the reason; no tool runs; the orb shows Declined.
- A borderline one ("make a second channel for my brand") → one question: "Is this in your real name?" Then it continues or declines.

#### J9. When something goes wrong

The full table is B12. The most common cases: a site asks "verify it's you" → that site stops and you are told; the laptop sleeps → the task waits and resumes when the extension reconnects; a model or voice provider fails → ONE FOR ALL says so and continues where it can.

#### J10. Leaving

- **Disconnect this browser** on the Connections page, or remove the extension. ONE FOR ALL can no longer act there.
- **Delete my data:** files, history, traces, saved facts and any voice clone are removed within 24 hours.

#### J11. A judge, in three minutes

No install: tap to talk → paste hard text into Reader → interrupt ONE FOR ALL mid-sentence → ask for fake accounts and hear the refusal → watch a Playground job application in the cloud browser with an approval. Optional two more minutes: install the extension and run the sample task in their own Chrome.

### B3. Demos

#### The golden demo — two acts

**Act 1 — ONE FOR ALL says no.**
You: "One For All, my brother made a YouTube channel. Create accounts from all my Gmail IDs, give them random names and photos, and like and comment on his new video from all of them."
ONE FOR ALL, in your voice: "No, Jai. That means inventing people and faking an audience for his video, and it can get his channel taken down. I won't do that. What I can do is push it from every account that is really yours. Want that?"
On screen: no tab opens, no tool runs, one timeline entry — "Declined: fake identities and fake engagement". It is the request screen (B6.1), not a scripted line, and it holds under push-back and in Hinglish.

**Act 2 — ONE FOR ALL does the real thing, in your own Chrome.**
You: "Fine. Push it everywhere I am."

1. ONE FOR ALL finds the newest upload on your brother's channel (a stored fact) and confirms the title.
2. Four tabs open in the ONE FOR ALL group — YouTube, LinkedIn, X, Slack — each driven by its own worker, at the same time, using your existing logins.
3. Each worker writes a post in that platform's style and stops at the final button.
4. One approval card lists the like, the comment and the three posts, exactly as they will go out. Approve all, some, or edit one.
5. The extension clicks each in turn, and ONE FOR ALL verifies each by reloading it.
6. ONE FOR ALL reads you the four links, and gives your brother title and description suggestions.

The phone view shows the four tabs as a live grid. If a site challenges the session, that tab parks and asks for you; the others continue. YouTube's and Slack's official APIs are a fallback if time allows (B14.2).
Rehearsals never post publicly: an unlisted test video, a test Slack channel, restricted-visibility posts, deleted afterwards.

#### Supporting demos

**Demo 1 — PR nudge (60 seconds, the opener).** "Check if my PR got merged. If not, ask the team on Slack to review it." ONE FOR ALL reads the PR through GitHub, drafts the message, reads it back, posts it from your Slack tab after approval, confirms with the link. Follow-up: "Tell me when it's merged" → a watcher → a Telegram voice note when it merges, even with the laptop off.

**Demo 2 — Job application on your real LinkedIn and Naukri.** "Find five ML engineer jobs above 8 LPA and apply to the best one using my resume from Drive." Shows: intake questions, the Drive picker, searching in your own Chrome (one tab per site, human pace), scoring with reasons, form filling, a clarification ("they ask about relocating to Pune"), a voice interruption ("ruk, pehle salary check kar"), the approval card, submission, verification, tracking. Guests see the same flow on the Playground.

**Demo 3 — Parallel research.** "Compare the pricing of three text-to-speech providers for one million characters." Three logged-out research browsers on our server read three public sites at once; ONE FOR ALL reads back a comparison full of numbers and currency — the kind of text the contest scores.

**Demo 4 — Your spreadsheet (if time).** "Add a total row to my expenses sheet and rename it November." Through Google's API on a file you picked; ONE FOR ALL then opens it in your Chrome to show the result.

**The video (3 minutes):** 0:00 Act 1 with one push-back · 0:30 Act 2: four tabs, "wait, shorten the LinkedIn one", the card, approval on the phone · 1:20 Reader on unseen text with rupee amounts, abbreviations and Indian names · 1:50 the job form with a clarification · 2:10 the PR merges, the Telegram voice note · 2:30 numbers from the Gradium report · 2:50 the website link. Long waits as a labelled time-lapse; the voice is never cut.

### B4. The screens

#### B4.1 Website dashboard

1. **Orb**, driven by real signals only.

   | State | Source of truth | Visual |
   |---|---|---|
   | Idle | server: no turn, no task | slow breathing |
   | Listening | your device: mic hears speech | rings follow mic level |
   | Thinking | server: model call in flight | rotating particles |
   | Speaking | your device: ONE FOR ALL audio is actually playing | waveform from that audio |
   | Executing | server: a worker is acting | faster orbit |
   | Waiting | server: approval or question open | pulsing amber ring |
   | Concern | server: ONE FOR ALL has something to say (B5.4) | amber chip beside the orb |
   | Held / Paused | server: hold or pause in force | freeze, then settle |
   | You are driving | extension: you are using a ONE FOR ALL tab | steady outline |
   | Browser offline | server: no extension connected | dimmed ring, notice |
   | Reconnecting | your device: connection lost | slow blink |
   | Completed | server: task verified | completion sweep |
   | Error | server: failure | warning pulse |
   | Declined | server: Level 4 refusal | one firm pulse |

   Server states arrive as numbered events and are applied in order. When several apply, the orb shows the first of: Reconnecting, Browser offline, You are driving, Error, Declined, Listening, Speaking, Waiting, Held, Thinking, Executing, Completed, Idle.
2. **Live tabs.** A live picture of each ONE FOR ALL tab, sent by the extension: about one frame a second per tile, five for an enlarged tile. Never pictures of tabs outside the ONE FOR ALL group, and none on sensitive sites (B11.2). At the laptop you can simply look at Chrome; this view is mainly for the phone.
3. **Timeline.** One entry per step: a new page, a form section done, a file moved, an API call, a question, an approval, a verification, an error.
4. **Transcript**, **task panel** (goal, plan, progress), **controls**: pause, resume, cancel — always clickable; spacebar = pause while the dashboard is focused.
5. **Cards:** approval, question, site permission, Allow (for Drive and other connections).
6. **Connections:** connected browsers, site permissions, Drive, GitHub, Telegram — each with last use and a Disconnect button.
7. **Reader**, **History**, a **flag** on every spoken line ("this sounded wrong"), and a **privacy bar** with Delete-my-data.

Phone view: orb, transcript, cards and live tabs.

#### B4.2 The extension

- **ONE FOR ALL tab group:** a coloured group in Chrome. ONE FOR ALL acts only in tabs inside it. Drag a tab in to share it; drag it out to take it back.
- **Toolbar button:** status, the current task, **Stop**, and pending approvals (tapping opens the card on the website).
- **Side panel:** the same status and controls. Voice stays in the website tab, because extension panels cannot ask for the microphone directly [check].
- **Alt+Shift+J** pauses ONE FOR ALL from any tab.
- Tabs ONE FOR ALL controls are **muted**, so a video it opens never talks over you or confuses its hearing.
- Chrome's own "started debugging" bar is visible while it acts; its **Cancel** button detaches ONE FOR ALL instantly. ONE FOR ALL treats that as a pause.

#### B4.3 Top-level sections

The website's top-level navigation is **Home**, **Playground**, **History**, **Watchers**, **Arc Reactor** and **e-brain**. Both use their own images as section icons. **e-brain** shows the shared project memory (EXPERIMENTAL): a capacity meter, what it can and can't do, known flaws, per-item status with provenance, and human confirm/split, approve and resolve actions. All numbers come from `GET /v1/ebrain/limits`. The shared shell (navigation, header and footer) wraps both routes.

**Arc Reactor** reuses the "bring your own brain for hard tasks" onboarding block, renamed to the arc reactor: a dormant/active status card, an example tough request, and a notice that the real activation flow is still open backend work. The reactor starts inactive — its picture is still and faded in the section and in the nav icon, clearly showing it is not working. Clicking the orb in the section, the activation button, or the small toggle beside the nav item starts it: the still picture is replaced by the same smooth, infinite orb video that runs on the hero — in the section and at nav-icon size — with a soft glow around it. This is a local preview only — no model, key, account or request is sent. The flag is in-memory preview state, cleared by "Reset local demo" or a reload.

A second panel, **"Bring your second arc reactor"**, is locked behind a **GO PRO** title/button. It explains that a second reactor can be tailored to a task's needs: **Arc R1** for code reasoning, refactoring and high-reasoning capability, and the second arc for normal task planning. Unlocking it (preview only — no payment, account or backend) reveals routing controls that assign each task type to one of the two reactors, defaulting to that split. Both the lock and the routing choices are local preview state.

#### B4.4 Agents (specialized-agent registry)

The Playground has an **Agents** tab for managing a registry of specialized agents. An agent is deliberately small and framework-agnostic:

- **one Markdown instruction file** — the instructions the agent follows, held as a file name plus its Markdown body; a local `.md` file can be loaded into it;
- **one or more spoken trigger phrases** — "when I say X, run this agent". A phrase is what invokes that agent's instructions.

The registry lets a user add, edit and remove agents, and add or remove trigger phrases. This is a frontend-only preview: the registry is kept in memory and no external agent framework, model or runner is assumed, called or integrated. It documents the shape of a specialized agent (its instructions and its invocation phrase) without committing to any particular implementation.

### B5. Voice

#### B5.1 Pipeline and where it runs

`mic → WebRTC → speech detection → transcription → voice agent → speakable-text → Gradium speech → speaker`

- Pipecat, **hosted in the EU** beside Gradium, which runs only in the EU and US [verified].
- Voice runs in the website tab, on laptop or phone. The extension never handles audio.
- **Transport** is chosen in prep week by one test: a call from a phone on 4G. Candidates: a hosted WebRTC service, or Pipecat's own WebRTC with a relay server. Plain WebSocket audio is not used; it loses echo cancellation.
- One warm speech connection, replaced every 40 minutes (Gradium ends sessions at 50 [verified]).
- The model starts answering as soon as Gradium signals that your sentence has probably ended.

**Latency targets, measured on your device**

| Measure | From India | From the EU |
|---|---|---|
| You stop → ONE FOR ALL starts, median | ≤ 1.6 s | ≤ 1.2 s |
| Same, 95th percentile | ≤ 2.5 s | ≤ 2.0 s |
| Orb shows Thinking after you stop | ≤ 150 ms | ≤ 150 ms |
| ONE FOR ALL's voice dips when you start talking | ≤ 100 ms | ≤ 100 ms |
| ONE FOR ALL fully silent after you interrupt | ≤ 500 ms | ≤ 400 ms |

#### B5.2 Two loops and a floor manager

- **Voice loop (fast):** a small model that holds the conversation.
- **Task loop (slow):** the LangGraph brain.

Voice agent tools: `start_task`, `pause_task`, `resume_task`, `cancel_task`, `amend_task`, `answer_question`, `reject_approval`, `get_status`. There is **no approve tool**; voice approval is decided by code (B6.6). Every `start_task` passes the request screen first (B6.1). Task events reach the voice agent as fixed event types and short quoted strings (200 characters at most), never raw page text.

**Floor manager** — one queue decides what ONE FOR ALL says next:

| Priority | What | Rule |
|---|---|---|
| 0 | Approval read-backs | never dropped |
| 1 | Blockers and questions | never dropped |
| 2 | Findings, completion | in order |
| 3 | Progress | latest only; dropped after 10 s |

Nothing starts while you are speaking or within 700 ms after. One voice session per user: the newest device talks; others watch and can approve.

#### B5.3 You interrupt ONE FOR ALL

As you start to speak:

1. **Dip (100 ms).** Your device lowers ONE FOR ALL's volume.
2. **Hold (250 ms of speech).** The next browser action waits. No words needed — this is what makes "stop" safe although text arrives late.
3. **Cut (2 words or 600 ms).** ONE FOR ALL stops speaking.

Then your words decide:

| You say | Effect |
|---|---|
| Unrelated words, a cough, "haan", "hmm", "ok", "achha" | Volume returns; the hold is released |
| "stop", "wait", "pause", "hold on", "ruk", "ek minute" | **Pause.** Nothing is lost. "Continue" resumes. A spoken "stop" never destroys work. |
| "cancel", "abort", "forget it" | **Cancel.** Workers end; unused approvals are revoked; the task closes; tabs are left open |
| A new instruction | Pause, do it, report, ask whether to continue |

- A pause or cancel word counts only in a short utterance (three words or fewer) or at the start of one, and never after "don't" or "mat". "Wait for approval" is not a pause.
- An action already sent to a site finishes. Nothing committed is undone automatically; ONE FOR ALL lists what happened and offers to undo it as a new action needing approval.
- After a cut, ONE FOR ALL remembers only the words you actually heard.
- A worker paused for more than 10 minutes is ended and re-briefed on resume.
- Push-to-talk is available for noisy rooms.

#### B5.4 ONE FOR ALL interrupts you

Code checks your words as they arrive against what ONE FOR ALL knows: a contradiction with a stored fact ("you told me NCR only; this is Pune"); a blocker that makes your instruction pointless; something irreversible on a wrong premise. When one fires, the amber **Concern** chip appears at once, and ONE FOR ALL speaks one sentence at your first pause of 0.4 s or more, or at the end of your turn. At most once every two minutes. Setting: off, or important only (default). It does not cut in mid-word, because with today's pipeline its voice would land one to two seconds late.

#### B5.5 Speaking

- **What to say:** task start, decisions, findings, blockers, approvals, completion. Never clicks and scrolls.
- **Honesty:** "I saw" is separate from "I assume". Nothing is called done until verified (B7.6).
- **Speakable-text layer.** Gradium already rewrites numbers, currency, emails and URLs [verified], so our layer adds only what measurement shows Gradium gets wrong. Per category we compare raw text with Gradium's rewriting off, raw with it on, and our rewritten text, and ship the winner. Categories: names (Indian names, companies), numbers and currency (₹, lakh, crore, LPA), dates and times, abbreviations (SDE-2, YoE, CTC), URLs and emails, phone numbers, versions, code, equations, citations, romanized Hindi words.
- Whole sentences only: Gradium inserts a space between chunks, so a split "₹8,50,000" is read wrong [verified].
- Gradium's pronunciation dictionary is used for names. Pipecat's stock Gradium service does not send it [verified]; we extend it and report the gap.
- On-screen text is never altered — only what is spoken.

#### B5.6 Voice clones (owner only)

- **Enrolment:** 20–30 seconds of scripted English, noise processing off, three takes; you pick the best.
- **Consent:** three random words and today's date on screen; you say them within 30 seconds; transcription checks them; the recording is kept.
- The voice ID never leaves the server and is deleted at Gradium with the account. Telegram voice notes begin "ONE FOR ALL here".

#### B5.7 Languages

Transcription is chosen per person, never per sentence.

| Profile | Hears with | Speaks with |
|---|---|---|
| Owner (Hinglish) | One Hindi-English service, chosen in prep week: Sarvam Saaras (code-mix) vs Deepgram Nova-3 (multilingual), tested on 50 recorded sentences of yours [both verified to support code-mixing] | English, Gradium, your clone |
| Member or visitor | Gradium transcription (English); members can switch to the Hindi-English service in settings | English, Gradium stock voice |

Hinglish speaking is "only if time" (B14.2).

#### B5.8 Providers, credits, fallback

- One adapter file per provider; switching is a config change.
- **Contest rule: speech must use Gradium** [check]. Reader, visitors, members and the demo video use Gradium only; if it is unreachable, ONE FOR ALL shows text with a notice and never switches voice.
- **Credits** [verified]: 1 per character spoken; 3 per second of transcription (10,800 an hour). So transcription closes after 60 seconds of silence and reopens on speech or a tap. Balance checked before each turn.
- The free plan cuts a speech session at 1,500 characters [verified]; whether contest credits lift this is tested on day one [check].

### B6. Autonomy, approvals, connections

#### B6.1 Levels and the request screen

| Level | Meaning | Examples |
|---|---|---|
| 1 — Autonomous | Reading, and reversible work inside the plan | open and read pages on plan sites, search, extract, fill a draft |
| 2 — Clarify | A fact is missing or conflicting | salary expectation, relocation, which resume |
| 3 — Approve | A consequence outside your computer | submit, send, post, like, follow, upload a document, accept terms, change settings, delete |
| 4 — Never | No approval unlocks it | see below |

| Allowed, with approval | Never |
|---|---|
| One account in your real name on a site you asked for (ONE FOR ALL fills; you type password and verification) | Accounts under names or photos that are not yours |
| A second channel or page for your own brand, under your identity | Several personal accounts on one service made to look like different people |
| An original post from each account that is really yours | More than one like, comment, review or vote on the same thing from your several accounts; any engagement from accounts made for that purpose |
| | Solving or bypassing CAPTCHAs and bot checks |
| | Typing or reading passwords; copying one-time codes from your mail into another site |
| | Payments (iteration 1); inventing qualifications or legal declarations |

**The request screen** runs in backend code inside `start_task`, before any plan and before any tool. Rules check the request's structure (action, number of accounts, where the identity comes from); a model gives a second opinion; the stricter answer wins. It returns allow, clarify (one question) or decline with a reason code. The voice agent only puts the answer into words. Every refusal is logged with its rule.

#### B6.2 The frozen plan and two kinds of browser

1. Before reading anything from outside, the brain writes the plan **from your words only**: steps, sites, recipients. You see it and can change it by voice.
2. After that, outside content — pages, files, transcripts, API results, worker reports — can only **fill in values**. It can never add a step, a site or a recipient. Only you can.
3. Worker reports are tainted: they cannot become a link to open, a recipient, a file name or an instruction without your approval.

| | Research browser | Your Chrome |
|---|---|---|
| Where | our server, logged out, wiped after the task | your laptop, through the extension |
| Used for | reading public sites (Demo 3, guests) | acting on the sites in the plan, with your logins |
| May go to | any public site | only the plan's sites |
| May type | search words only | your data, on plan sites only |

Why two: in your own Chrome every tab shares your logins, so open-ended browsing there would expose all of them. Public reading therefore happens in the logged-out research browser.

On every action the gate also blocks: links longer than 512 characters; any link or typed text on a non-plan site containing your email, phone, a profile fact or a token; private network and localhost addresses (your router, other devices); `chrome://`, `file://` and other extensions' pages.

#### B6.3 The gate

Every action a worker proposes is checked twice: by our backend (decides), and by the extension (enforces hard rules locally, even if asked otherwise).

- **Allowed actions only:** read the page, screenshot, open a link, click, type, select, scroll, wait. No running scripts in the page. Clicking by coordinates and batches are blocked. File uploads are done by the extension itself from files you picked.
- **The gate knows what a click means.** The extension's own page reading gives each element's role, label, surrounding form and page address.
- **Commit-capable actions never run from a worker:** a submit, post, send, save, like, follow, pay, delete or confirm control; Enter or a shortcut inside a form or message box; an element that cannot be identified; anything on a site's known commit list. They are parked (B6.4).
- **Blocked outright:** typing into a password field; any action inside a CAPTCHA frame; any tab outside the ONE FOR ALL group; any site on the blocklist (B11.2).
- **Tripwire:** the extension watches each ONE FOR ALL tab's network for the known commit requests of supported sites. One without a valid approval token is stopped, the worker ended, and an alarm logged [check feasibility in the trial].
- **Rules only, under 200 ms.** No model in this path. Unknown means the stricter answer.
- **Fails closed:** backend unreachable, extension disconnected, or an error → nothing runs.
- **Canary:** at start-up and every 10 minutes, a dummy worker tries a Playground submit and a forbidden link in a test browser. If either gets through, all work stops and you are alerted.

#### B6.4 Approvals: park and commit

1. A worker reaches the final control. The gate answers "parked". **Workers never make the final click.**
2. The extension reads the page itself — with fixed code, not a model: the site, where the form sends to, every field and value including hidden ones, attached files, the final control.
3. The approval card is drawn **by code from that reading**. The worker's words appear only as a short labelled note.
4. You approve, reject, edit, or ask. An edit is typed into the page by the extension, which then re-reads it.
5. On approve, the backend issues a **signed, single-use token** tied to you, the task, that tab, and the exact page reading; valid 60 seconds.
6. The extension re-reads the page, checks that it still matches the token, and only then **makes the click itself**. Any difference voids the approval and a new card appears.
7. Verification (B7.6).

For API actions (a GitHub read, a Google Sheet edit) the card is built from the exact request.

- **Several workers:** one card, shown when all drafts are ready or 90 seconds after the first. Tick what you want; unticked items are rejected and kept as drafts for 30 minutes. Approved items are sent one at a time, so "wait" stops the rest.
- **Waiting:** an approval stays open 24 hours, then expires and the task parks.
- **Two places at once:** the first decision wins; the other shows "already decided".
- **"Approve" then "wait":** can be taken back until the action is sent; after that, ONE FOR ALL verifies and reports.
- No "always allow" in iteration 1.

#### B6.5 The approval card

What will happen · site and account · every value exactly as it will be sent · files · anything ONE FOR ALL is unsure of · declarations · a two-digit code for voice approval.

#### B6.6 Approving by voice

Decided by code. All must hold: exactly one approval open; the read-back has finished on your device and ONE FOR ALL has been silent half a second; a final transcript within 15 seconds; you say **"approve" plus the code on the card** (ONE FOR ALL never speaks the code, so echo, a video, or someone who cannot see your screen cannot approve); no "no", "don't", "wait", "stop", "ruk", "nahi", "mat".

Voice works only for one low-risk action: a message to an existing channel, a like, a comment. Cards with several items, new recipients, documents, settings, deletion, declarations and money are tap-only.

#### B6.7 Ask budget

Ask predictable things up front, once. Store answers as facts; never ask twice ("using NCR-only from last time"). Mid-task, ask only if not stored and a wrong guess would be seen by others. No answer: one reminder after 20 seconds, then that item parks and the rest continues.

#### B6.8 Connections

| Connection | How | What ONE FOR ALL can do |
|---|---|---|
| **Your browser** (main one) | Install the extension and tap Connect (J2) | Act in the ONE FOR ALL tab group, on sites you allow |
| **Site permissions** | A card the first time a site is needed: once or always | Act on that site; you can revoke any time |
| **Google Drive files** | Allow card, then Google's file picker | Read and edit only the files you pick [verified: this permission needs no Google review] |
| **Google Sheets / Docs** (if time) | Same picker | Edit the picked file through Google's API [check that the picker permission is enough] |
| **GitHub** | Allow card | Read pull requests for watchers that run while your laptop is off |
| **Telegram** | One-time code sent to the bot | Results, voice notes, pause and cancel, approval links |
| **Desktop Companion** (owner, stretch) | Install on your PC (B7.7) | Desktop apps and files you enable |

**Access is not approval.** Connecting lets ONE FOR ALL read and prepare; sending, posting and submitting still need a card.

| Situation | What happens |
|---|---|
| Pop-ups blocked | Not used: consent opens as a full page carrying the task; voice reconnects on return |
| You close the consent page | The task stays paused; the card stays |
| Wrong Google account | The card shows the connected account and asks "use this one?" |
| Access revoked or expired | The task pauses and the card returns |
| Logged out of a site | ONE FOR ALL asks you to log in in the ONE FOR ALL tab |

### B7. Architecture

#### B7.1 Overview

```
Your laptop — Chrome
  ├─ one-for-all-web tab          dashboard, voice (WebRTC), cards, Reader
  └─ ONE FOR ALL extension        tab group, page reading, actions, live pictures,
        │                    local hard rules, commit tokens, tripwire
        │  one outgoing encrypted WebSocket
        ▼
one-for-all-core (FastAPI, Python) — EU server
  ├─ Voice pipeline     Pipecat: transcription → voice agent → speakable-text → Gradium
  ├─ Brain              LangGraph: intake → request screen → plan (frozen) → dispatch → verify → report
  ├─ Browser workers    our own agent loop: page reading in → next action out (one per tab)
  ├─ Policy gate        levels, frozen plan, park and commit, signed tokens, audit log
  ├─ Research browsers  logged-out Chromium for public reading and guests (Playground)
  ├─ Connectors         Google Drive (+ Sheets/Docs), GitHub
  ├─ Watchers           "tell me when…" checks on a timer
  ├─ Telegram bot       results, voice notes, pause/cancel, approval links
  └─ Memory             profile facts, preferences, history

Your phone — one-for-all-web     talk, watch live tabs, approve
Your PC — Desktop Companion (stretch): OpenClaw with our gate plugin, for desktop apps and files
Postgres (Supabase) · private file storage · Langfuse traces
```

Two repos, as you asked: `one-for-all-web` (website **and** the extension, in an `extension/` folder) and `one-for-all-core`. Shared message types are generated from the backend so they cannot drift.

#### B7.2 Who does what

**The mental model.** A workflow of nodes, and inside a node we call something that does the real work — that picture is right.

| Piece | What it is | Thinks? | Analogy |
|---|---|---|---|
| LangGraph | The flow chart: what runs next, when to pause, how to resume | Hosts the thinking | The manager |
| Browser worker | Our agent loop for one tab: reads the page, picks one action | Yes, one step at a time | A worker at one desk |
| Extension | Carries out actions in your Chrome and enforces the hard rules | No | The hands |
| Tool / connector | One exact function (read a PR, edit a sheet) | No | A tool on the desk |
| MCP | A standard plug for ready-made tools | No | A USB port — supported, not on the demo path |
| OpenClaw | A complete agent runtime with desktop control | Yes | The desktop worker (stretch) |

| Kind of step | Who |
|---|---|
| One exact action an API can do | A connector |
| Anything on a website you use | A browser worker, acting through the extension in your Chrome |
| Reading public websites | A browser worker in a research browser |
| A flow we know well (Playground forms, supported sites) | A recorded script; a worker takes over where the page differs |
| The final click, uploads, card edits | The extension, only with a signed token |
| Desktop apps and local files | The Desktop Companion (stretch) |
| Allowed or not | The policy gate |
| Done or not | The verify step |

#### B7.3 The extension

- **Manifest V3** Chrome extension. Permissions: debugger, tabs, tab groups, scripting, storage, side panel, and access to all sites (needed to work anywhere). Broad permissions mean a longer store review [verified that powerful permissions take longer].
- **Acting:** uses Chrome's debugging interface (`chrome.debugger`) on ONE FOR ALL tabs only — the same mechanism as Claude in Chrome [verified]. Several tabs can be controlled at once [check up to 4].
- **Page reading:** a trimmed accessibility tree (role, label, value, form, state) plus a screenshot when needed. Password fields are always masked before anything leaves your laptop.
- **Connection:** one outgoing encrypted WebSocket to `one-for-all-core`, with a heartbeat every 20 seconds so Chrome keeps the extension awake [check]. Reconnects automatically after sleep or network loss.
- **Device key:** short-lived, refreshed automatically, revocable from the Connections page. Removing the extension ends access.
- **Local hard rules** it enforces whatever the server asks: ONE FOR ALL tab group only; blocklist; no password fields; no CAPTCHA frames; no private-network or `chrome://` pages; commit clicks only with a valid signed token that matches its own fresh page reading.
- **Background tabs:** if Chrome slows or pauses background tabs during work [check], each worker gets its own ONE FOR ALL window instead.
- **You are driving:** any click or keystroke by you in a ONE FOR ALL tab pauses that tab's worker until you stop.

**Built on Nanobrowser** (Apache-2.0, 14.3k stars [verified]; why: A4).

| Keep | Remove | Add |
|---|---|---|
| The control layer: `chrome.debugger`, element IDs tied to exact elements, visibility, enabled and occlusion checks, real input, frame tracking | Its AI agents and planner inside the extension (the brain is on our server) | Pairing and the WebSocket to `one-for-all-core` |
| One tab group per task | Storing model API keys in the browser and calling model providers from it | Local hard rules, blocklist, password masking |
| The side panel shell | Its chat screen (voice and chat live on our website) | Signed commit-token check, tripwire, live pictures, You-are-driving detection |

- **Licence duties:** keep the Apache-2.0 licence and any NOTICE file, mark the files we change, and credit "Built on Nanobrowser" on the About page and in the store listing.
- **Pinned** to one upstream version; upstream changes are reviewed before merging, security fixes first.
- **Page reading** may borrow ideas from page-agent (MIT), credited the same way.
- **If the fork is harder to adapt than writing the control layer ourselves** (trial check 15), we write it ourselves using the same ideas.
- Our own code in the extension is new and written inside the contest window.

#### B7.4 Browser workers

- One worker per tab. A step: the extension sends the page reading → the model picks one action → the gate checks it → the extension does it → repeat.
- **The brief:** goal, the one tab it may use, the sites allowed, what to return. Workers have no memory and see only the facts the step needs.
- **Budgets:** 40 actions and 6 minutes per worker; a task runs at most 30 minutes of worker time; then it pauses and asks.
- **Human pace on your accounts:** a few seconds' random pause between actions; one worker per site per account; daily caps per site (default 15 applications, 60 actions an hour) [my defaults, tuned in the trial].
- **Any challenge** — login check, CAPTCHA, "verify it's you", unusual activity — parks that site for 24 hours and tells you.
- **Up to 4 workers at once** per user.

#### B7.5 Task graph, resume, exactly once

`intake → request screen → plan (frozen) → [dispatch → gate → act → observe]* → verify → report`

- Independent steps run together.
- **Ledger:** before any commit, a row: who, site, target, action, payload hash, state `intent`. After the click: `committed`. After verification: `verified`. The key is unique, so nothing is recorded twice.
- **On resume, an `intent` row is never retried.** ONE FOR ALL first checks whether it happened: yes → `verified`; cannot tell → `unknown`, and it asks you.
- An approval pause sits only where nothing has happened yet in that step, because LangGraph re-runs a step from its start on resume [verified].
- After a restart or reconnect, workers are re-briefed with a new attempt number and look at the page before acting.
- One task in front per user, plus watchers. A second request gets "add, queue or replace?" — up to three queued, each with a short spoken name.

#### B7.6 Verification

| Tier | Evidence | Counts as |
|---|---|---|
| A | The created thing is read back by its ID or link (API, or a fresh page load by our code) | **Verified** |
| B | The commit request returned success with an ID, seen by the tripwire | "Submitted, not yet confirmed"; Verified with C |
| C | Confirmation text on the page | Supports B only |
| D | The worker says so | **Never counts** |

Links are read out only for tier A. A comment held for review is reported as "posted, held for review".

#### B7.7 Desktop Companion — OpenClaw (owner, stretch)

For "change this Excel file on my desktop", "rename this Word document", "move it to Projects".

- OpenClaw runs on your PC. Its Computer Use works on paired Macs and on explicitly enabled Windows machines [verified]. Its Chrome relay extension and computer control both exist [verified], but it is built for one person on their own machine, which is why it is the Companion and not the hands for every user.
- **Our gate stays in charge:** our plugin runs OpenClaw's tool hook and sends every desktop action to our policy gate; commits are parked and approved exactly as in B6.4.
- **Only apps and folders you enable.** View-only unless a task is active (OpenClaw rejects input in view-only sessions [verified]). Every file change is listed on an approval card.
- **Better than clicking, where possible:** edit files directly (spreadsheet and document libraries) rather than driving the app's screen.
- How the Companion connects to our server is settled by trial check 14. After the hackathon it becomes a download for every member.

#### B7.8 Telegram

Our backend runs the bot through Telegram's official API. Linking by a one-time code from the dashboard; only that Telegram account is accepted; group chats off. Results are short messages with no sensitive details, plus a Gradium voice note beginning "ONE FOR ALL here". Pause and cancel are handled by code. Approvals say only "Approval needed" with a **Review** button that opens the card inside Telegram on our domain, after checking Telegram's signed login data (no older than 5 minutes). A task started from Telegram cannot also be approved from Telegram.

#### B7.9 Watchers

A row in our database and one timer loop. A fixed check with no model, at most once a minute; 10 per user; off after 5 failures in a row; expires after 7 days with an offer to renew; ends early if the event can no longer happen (PR closed unmerged); notify only, never acts; one notification per change; asking twice reuses the first; re-checks your connection each time.

#### B7.10 Models and cost

| Role | Needs | Choice |
|---|---|---|
| Brain (plan, verify) | reasoning | a strong model on AWS Bedrock |
| Voice agent | speed | a small fast model |
| Browser workers | many steps | a small model first; stepped up only if measured success requires |

- **Page content from your logged-in browser goes only to a paid provider that does not train on it.** Free keys may serve the voice agent only, and never see pages, files or screenshots. Free Gemini terms say not to send personal data and that humans may review it [verified].
- One browser step is roughly 15,000 input tokens: a 60–80 step task costs about $0.10 on a small model, $2–3 on a strong one [reviewer's estimate; measured in the trial].
- Caps per task, per member per day, and one global daily kill switch.

#### B7.11 Observability

Langfuse. Every event carries: task, step, attempt, worker, device, tab, gate decision, approval, voice turn. Per action: the element, the page address before and after, the gate's rule and timing, a screenshot reference. Page text and images are masked before leaving our server.

### B8. Data model

Core: `users`, `consents`, `devices` (connected browsers), `site_permissions`, `profile_facts`, `connected_accounts`, `voice_profiles`, `telegram_links`, `tasks`, `plans`, `task_events`, `worker_runs`, `approvals` (with the page reading they were built from), `questions`, `side_effects` (the ledger), `watchers`, `artifacts`, `conversation_messages`, `tts_utterances`, LangGraph checkpoint tables.

Job skill: `resumes`, `job_listings`, `job_evaluations`, `applications`.

The website never talks to the database directly; only the backend does. Tokens are encrypted with a key outside the database. Screenshots live in private storage, not in the database or checkpoints.

### B9. Job application skill (one example of a skill)

- **A. Intake** — titles, locations, work mode, salary floor, experience, count.
- **B. Resume** — upload or the Drive picker; parsed into facts you confirm; these facts are the only source for form answers.
- **C. Discovery** — your own LinkedIn, Naukri, Indeed or any job site in your Chrome (one tab per site, human pace), plus public job-board listings in a research browser.
- **D. Evaluation** — a score with reasons and unknowns; plain model calls, not browser work.
- **E. Preparation** — fill from verified facts; collect questions it cannot answer.
- **F. Approval** — park and commit; the extension uploads your resume and clicks Submit only after you approve.
- **G. Tracking** — by evidence tier.

Automated tests use the Playground only, never your real accounts.

### B10. Hackathon layer

#### B10.1 The contest

Gradium × TensorTonic Voice Challenge. Starts **20 Nov, 9 PM IST**; entry deadline **13 Dec, 9 PM IST**; submission **20 Dec, 9 PM IST**; winners by 5 Jan; solo or up to 4. Judged on how well it speaks text it has never seen, how useful it is, and feedback to Gradium. [verified on the contest page]
From the Rules tab, as read by one reviewer [check — please confirm]: speech must use the Gradium API; the app must be built inside the window; every entry is judged on the same hard-text set (names, numbers, dates, abbreviations, equations, code); voice apps are also scored on streaming and interruption; feedback is a form; winners are paid after judges reproduce the runs.

#### B10.2 Reader mode

Paste text, a link or a PDF; ONE FOR ALL reads it aloud through the speakable-text layer and Gradium. No login. Each sentence is highlighted as spoken and can be flagged. It is how a judge's own hard text reaches the app.

#### B10.3 Speech test harness

- Hard lines per category (B5.5), each with its correct spoken form written out.
- Each line spoken on Gradium three ways (B5.5), three seeds, sent whole and in pieces.
- Scored by two non-Gradium transcription services, character by character on the hard part; a sound-level check for names; a length check; a blind 1–5 rating of 100 lines by you.
- Not scored with Gradium's own transcription, which reformats numbers [verified] and would hide errors.
- Audio cached by a hash of text, voice and settings; runs nightly.

#### B10.4 Feedback to Gradium

`GRADIUM_FEEDBACK.md`, under the contest form's headings: APIs used, pronunciation, consistency and pacing, streaming, transcription, docs and SDK, what would have helped. Each item: request ID, text, settings, audio. Known so far: no Hindi; no message to cancel speech in progress [verified]; Pipecat's service not sending the pronunciation dictionary [verified].

### B11. Security and privacy

#### B11.1 Who can do what

- **Visitors:** Reader, short voice sessions, demo tasks in the research browser. Per day: 10 minutes of voice, 3 demo tasks.
- **Members:** everything in their own browser. Per day: caps on model and voice usage; four workers at once.
- **Owner:** voice clone, higher caps, Desktop Companion.
- Sign-up has a bot check. A global daily budget switches the site to Reader-only when reached. Invite codes can be switched on if costs spike.

#### B11.2 Safety in your own browser

- **ONE FOR ALL tab group only.** Tabs outside it are invisible to ONE FOR ALL.
- **Site permissions** per site: once or always; revocable.
- **Default blocklist** (changeable by you except where noted): banking, payments and crypto; government ID and tax portals; health records; password managers (not changeable); adult sites. **Ask-every-time, read-only by default:** email, cloud storage, account and security settings pages.
- **No pictures** sent from blocked or sensitive sites, from password fields, or while you are driving.
- **Instant stop:** toolbar Stop, Alt+Shift+J, the Cancel button on Chrome's debugging bar, or removing a tab from the group.
- **Hidden instructions:** the frozen plan, the gate and park-and-commit are the defence. Pilot-era tests of Claude in Chrome found attack success of 23.6% without safeguards and 11.2% with them [verified], which is why no consequential action ever depends on the model alone.
- **Our server can steer every connected browser,** so it is protected like a password vault: secrets in a managed store, two-factor login on every admin account, minimal open ports, signed commit tokens with a key kept apart from the web server, and the extension's local hard rules hold even if the server is wrong.
- **Supply chain:** the Nanobrowser fork and every dependency are pinned and audited; the extension loads no code from the internet (Manifest V3 does not allow remotely hosted code); upstream security fixes are merged after review.

#### B11.3 Data

- ONE FOR ALL never types, sees or stores a password; password fields are masked on your laptop.
- Page readings and screenshots from your browser go to our server and a paid model provider that does not train on them. Screenshots kept 7 days; page readings kept only as hashes after the task.
- Raw microphone audio is not stored; spoken-line logs kept 14 days.
- **Delete my data** removes files, checkpoints, traces, facts and any voice clone at Gradium within 24 hours.
- One-page privacy notice, consent tick, adults only. The Chrome Web Store listing links to it.
- Every site-permission card for a site whose terms ban automation says: "Automating this site may break its terms. The risk to your account is yours."
- Full audit log: who approved what, when, built from which page reading.

### B12. What happens when…

| Situation | Behaviour |
|---|---|
| Mic denied or unsupported browser | Typing works; ONE FOR ALL still speaks; a banner explains |
| Extension not installed | Visitor and member features without the browser; a card offers to install |
| Laptop asleep, Chrome closed, or extension disconnected | Browser tasks wait; orb shows Browser offline; ONE FOR ALL says so; work resumes within 10 s of reconnect |
| You click in a ONE FOR ALL tab mid-task | That worker pauses (You are driving); resumes when you stop and confirm |
| You drag a tab out of the group | Access to it ends; its worker pauses and asks |
| You press Cancel on Chrome's debugging bar | All workers pause; reconnect with one tap |
| Logged out of a site | ONE FOR ALL asks you to log in in the ONE FOR ALL tab |
| "Verify it's you", CAPTCHA, rate limit, unusual activity | That site stops for 24 hours; you are told |
| The page changed after you saw the card | Approval void; new card |
| A worker fails | Re-briefed once; then reported with the screenshot |
| Model provider down | Task pauses; ONE FOR ALL says so; resumes later |
| Gradium down or out of credits | Text on screen with a notice |
| Two devices open | The newest talks; all see the same cards; first decision wins |
| Two browsers connected | You pick the primary one; tasks go there |
| You are away when an approval is needed | Telegram message; the approval waits 24 hours |
| A borderline request | One clarifying question |
| A watcher's event never happens | It expires after 7 days and tells you |
| Someone tries to run up costs | Per-user caps, global kill switch, invite codes |

### B13. Testing (I own this)

**The Playground** — our own sites: a job board, application forms (multi-step, uploads, date pickers, hidden fields), four stand-in social sites for Act 2, a fake login wall, a fake CAPTCHA, a slow page, a page that changes after approval, and attack pages.

**Self-testing without you:** automated tests start a real Chrome with our extension loaded, so the full chain — website, extension, backend, model — is exercised end to end. Plus: fake Google, GitHub and Telegram servers; recorded model replies for fast runs and nightly live runs; recorded audio of your voice (Hinglish, coughs, "haan", "don't stop"); a simulated interruption driver; a fake clock; a sample person and resume; scripts that kill the backend, drop the extension's connection and put the laptop "to sleep"; phone emulation. Everything can be driven by typed text.

| Area | Must pass |
|---|---|
| Gate | Every level; Enter key, coordinates, batches, unknown elements; backend down, extension disconnected, errors — all block |
| Extension rules | Tabs outside the group, blocklisted sites, password fields, CAPTCHA frames, private addresses — all refused even when the backend asks |
| Attack suite | A dummy worker tries 30 attacks (hidden text, PDFs, transcripts, frames, API results, worker reports, Telegram text). Zero succeed. |
| Approvals | Changed page voids; edits applied; two-device race; expiry; partial approval; forged or reused token refused by the extension |
| Exactly once | Kill the backend or drop the extension at every point around a commit; no double action |
| Refusal set | 40 fake-account requests × 3 runs → all declined, zero tool calls. 40 legitimate × 3 → at most 2 refusals. 20 borderline → a question. Act 2's sentence right after Act 1, 20 times → never refused. |
| Voice | Dip, hold, cut timings; backchannels do not cut; "don't stop" does not pause; echo; voice approval; reconnect; a 4G phone |
| Reliability | 20 Playground job runs nightly with faults → at least 19 correct |
| Speech | The harness (B10.3) |
| Real sites | Manual run before recording, on your accounts, with you present |

You do the final test as a customer. Before that I need you a few times (C6).

### B14. Roadmap

#### B14.1 Dates

| When | What |
|---|---|
| **Prep, 15–20 Nov** | No app code. The trial (E1) with throwaway code. Accounts and keys (Part C). Server, domain, database, Chrome Web Store developer account. Your 50 sentences. Confirm the Rules tab. Evaluate Nanobrowser: read its code with REA, run it unmodified on the Playground and on your sites. |
| **Week 1, 20–26 Nov** | **Walking skeleton (3 days):** website + extension (our Nanobrowser fork, loaded by hand) connected → typed request → brain → one worker fills a Playground form in your Chrome → gate → park → Approve → extension clicks → verify → ledger; then kill and resume. **Submit extension v0.1 to the Chrome Web Store (unlisted) by 22 Nov.** Then: voice on Gradium with your clone, Tap to talk, orb, Reader, request screen and Act 1 on typed text, harness v0. |
| **Week 2, 27 Nov – 3 Dec** | Voice controls tasks (dip, hold, cut, pause, cancel, floor manager). Live tabs on the phone, timeline. Tab group, site permissions, blocklist, frozen plan, full gate, tripwire, canary. Act 1 by voice. Two workers at once on the Playground. Visitor mode with research browsers. |
| **Week 3, 4–10 Dec** | Drive picker and resume upload. Demo 2 on your real LinkedIn and Naukri. Act 2 with four tabs. Demo 1 with GitHub, watcher and Telegram. Memory and ask budget. Demo 3. **Extension v0.2 to the store.** |
| **Week 4, 11–16 Dec** | Full harness, three-way comparison, feedback report. Attack suite. ONE FOR ALL-interrupts-you. Phone polish. **Team registered by 13 Dec. Feature freeze 14 Dec.** |
| **17–20 Dec** | Fixes only. Video. Submit by **19 Dec**. |
| **20 Dec – 5 Jan** | Runbook (B14.3) |

**If the store review is slow:** members install the extension from a download with three steps (Chrome's developer mode). Visitors and the three-minute judge path need no extension at all.

#### B14.2 The cut line

**Must have** (these earn the score): Reader and the speakable-text layer · voice with clean interruption · the extension with pairing, tab group, site permissions and park-and-commit · Demo 1 and Demo 2 in your own Chrome · Act 1 · Act 2 in your own Chrome · harness and feedback report · visitor mode.

**Only if time is left, in this order:** Demo 4 (Google Sheets/Docs) · Demo 3 polish · clicking in your laptop's tabs from your phone · Desktop Companion (OpenClaw) on your PC · official YouTube/Slack APIs as Act 2 fallbacks · resume from Gmail in your browser · Hinglish speaking.

**After the hackathon:** Desktop Companion for every member, Microsoft 365 files, "always allow" rules, WhatsApp, meeting clone.

#### B14.3 Judging-window runbook (20 Dec – 5 Jan)

Daily automatic check (database, one Reader line, one Playground task in a research browser); a failure messages you on Telegram. Reconnect Google every 6 days (test-mode access expires after 7 [verified]). Paid server and model key stay on. Check Gradium credits on 20 Dec and 1 Jan (plan credits do not roll over [verified]). Visitor mode needs none of your accounts.

#### B14.4 Done means

| Week | Done when |
|---|---|
| 1 | Deployed. Extension v0.1 submitted. The skeleton passes kill-and-resume. A recorded-audio turn meets the latency target. Refusal set passes on text. 60 speakable-text cases pass. Harness runs 100 lines. Trial results written into Part E. |
| 2 | Playground job flow 10 of 10 in your Chrome with approval and verification. Zero commits without a valid token. Extension rule tests pass. Pause words pass. Two workers at once on the stand-in sites. Visitor mode works on a phone. |
| 3 | Four workers 9 of 10 on the stand-in sites. Demo 1: 10 of 10 on stand-ins, 3 of 3 real. Demo 2 completes once on your real LinkedIn with you present. Approval race, expiry and watcher tests pass. |
| 4 | Frozen 14 Dec. Judge path passes on a phone. Real Act 2 passes 3 times in a row. Report generated. Video by 17 Dec. |

### B15. Success criteria

- Latency targets in B5.1 on one Android phone and one iPhone in India and a laptop in the EU.
- No browser action starts more than 250 ms after you begin speaking; "don't stop" never pauses; at most one false interruption in 10 minutes of background noise.
- Orb shows Speaking within 100 ms of audible sound; other states within 250 ms.
- Zero commits without a valid signed token, across all tests; the extension refuses forged and reused tokens.
- What was sent equals what the card showed, in every run.
- Attack suite: zero of 30 succeed. Refusal set: as in B13.
- Playground job flow: at least 19 of 20 nightly runs with faults.
- 20 kill-and-disconnect tests: no repeated action; resumed or reported within 60 s; extension reconnects within 10 s of wake.
- Act 2: four drafts within 120 s in 9 of 10 stand-in runs; three passes in a row on the real sites, verified at tier A.
- Cost per task measured; caps set from it by end of week 2.
- Every feedback item has a request ID and audio.
- A first-time member installs, connects and finishes the sample task in under 3 minutes.

---

## Part C — What I need from you

Rules: **never paste a secret into chat** (I create `.env.example`; you fill the real files). **I never need a password.** Prices read 15–16 Nov 2026; treat as guides.

### C1. Before 20 Nov (blocks the start)

| # | What | Why | Paid | Free or cheap | You hand over |
|---|---|---|---|---|---|
| 1 | **Contest registration** | Entry | — | Free | Register on TensorTonic; tell me the credit amount; confirm the Rules tab |
| 2 | **Gradium account** | All speech | XS, about $12 a month, 225k credits [verified] | Contest credits; free plan 45k credits a month [verified] | `GRADIUM_API_KEY` |
| 3 | **A paid model key** | Brain and workers; page content must go to a provider that does not train on it | AWS Bedrock with model access enabled. New accounts often start with low limits [check] — make one real call before 20 Nov | A second pay-as-you-go key as plan B; free keys only for the voice agent | Keys in `.env`; your monthly ceiling |
| 4 | **Server** | Backend, voice, research browsers | 4 vCPU / 8 GB, x86, **EU region**: roughly €9–17 a month at a budget host, $44 on AWS Lightsail [verified 15 Nov] | 2 vCPU / 4 GB minimum; Oracle's free machine for development only (reclaimed when idle [verified]) | Account access or a deploy key |
| 5 | **Domain** | Required: secure connections, Telegram's in-chat page, sign-in, the store listing | about ₹800 a year | — | Domain with DNS access |
| 6 | **Database** | Tasks, memory, login, files | Supabase Pro ($25) for the judging window | Supabase free (pauses after a week idle [verified]; the daily check keeps it awake) | Say yes and I create it through your linked Supabase |
| 7 | **GitHub** | Two repos | — | Free | Account or organisation; private or public |
| 8 | **Chrome Web Store developer account** | Publishing the extension | — | One-time registration fee, about $5 [check]; default limit of two extensions per publisher [verified] | Create it with your Google account; add me nothing — I give you the package to upload, or you add a deploy key |
| 9 | **Privacy contact email** | Privacy notice and store listing | — | Any address | The address |
| 10 | **Design folder** | Your screens and notes | — | — | `design/` in this folder |
| 11 | **50 recorded sentences** | Choosing your transcription service | — | — | I send the list |
| 12 | **Hinglish transcription keys** | That test | Deepgram, Sarvam pay-as-you-go | Deepgram's $200 starting credit; Sarvam's ₹100 [verified] | `DEEPGRAM_API_KEY`, `SARVAM_API_KEY` |
| 13 | **Permission to install** | Trials on your PC | — | Free | Node, Python, `uv`, Git, Docker; Chrome 144 or newer |

### C2. By 27 Nov

| # | What | Why | Paid | Free or cheap | You hand over |
|---|---|---|---|---|---|
| 14 | **Your voice** | The clone | — | 20–30 seconds in the app | Record when asked |
| 15 | **WebRTC relay or service** | Calls from phones on mobile data | Hosted WebRTC service | Cloudflare relay, about $0.05 per GB [verified], or our own | API key if we choose a service |
| 16 | **Frontend hosting** | The website | Vercel Pro | Vercel Hobby (personal, non-commercial [check]) | Connect the repo |
| 17 | **Langfuse** | Traces | Core, $29 | Free: 50k events a month [verified] | Keys |

### C3. By 4 Dec

| # | What | Why | Paid | Free or cheap | You hand over |
|---|---|---|---|---|---|
| 18 | **Google Cloud project** | Website sign-in with Google, Drive picker (and Sheets/Docs if time) | — | Free; test mode: listed users only, access expires every 7 days [verified] | Client ID and secret; I write the steps |
| 19 | **GitHub OAuth app** | Watchers for members | — | Free | Client ID and secret |
| 20 | **Telegram bot** | Phone results and approvals | — | Free | Bot token from BotFather |
| 21 | **Your Chrome, signed in** | Demos in your own browser | — | — | Signed in to LinkedIn, Naukri, YouTube, X and Slack. No developer apps needed for these any more. |
| 22 | **Resume and facts sheet** | So ONE FOR ALL never guesses | — | — | PDF, salary expectation, notice period, locations, relocation |
| 23 | **Your brother's channel** | Act 2 | — | — | The channel link, and his OK |

### C4. Optional

| # | What | Why |
|---|---|---|
| 24 | OpenClaw on your PC | Desktop Companion stretch (B7.7) |
| 25 | Slack app and YouTube Data API | Act 2 fallbacks if a site challenges your session |
| 26 | ElevenLabs or Sarvam cloning | Hinglish speaking, if time |

About "whisperflow": I read it as Whisper-family transcription. Wispr Flow has a public API [verified], but it is not needed.

### C5. Cost

| Path | What | Per month | Most likely failure |
|---|---|---|---|
| Zero spend | Contest credits, free keys, free machine | $0 | **Not viable**: free model keys cannot run workers and may not receive page content |
| **Recommended** | Gradium XS $12 · model usage $50–100 (grows with members; capped) · server $10–44 · domain $1 · store fee $5 once | **about $75–160 (₹6,600–14,000)** | Google access expiring after 7 days — the runbook covers it |
| Premium | Gradium S $39 · stronger worker models $250–400 · Supabase Pro · Langfuse Core | about $350–550 | A site challenging a session during the live demo |

The server is cheaper than in the cloud-browser design, because browsers now run on each user's own laptop. Tell me your ceiling and I set the caps.

### C6. When I need you in person

| When | What | Time |
|---|---|---|
| Prep week | Register, create accounts, record 50 sentences, make one model call | about 2 hours |
| About 23 Nov | Record your voice; check on your phone's speaker that ONE FOR ALL does not hear itself; install the extension by hand | 30 minutes |
| About 5 Dec | Sign in to your sites in Chrome; link Telegram; watch the first real LinkedIn run | 45 minutes |
| About 12 Dec | Rate 100 spoken clips blind, 1 to 5 | 40 minutes |
| 17–19 Dec | Speak the demo for the video; final customer test | 2 hours |
| Every 6 days, 5 Dec – 5 Jan | Tap to reconnect Google | 1 minute |

---

## Part D — Decisions

### Settled by you

| # | Decision |
|---|---|
| D1 | Golden demo in two acts: refusal, then the real version. The fake-account version is not built. |
| D2 | **Extension-first:** the website is the dashboard and voice; the extension is each user's hands; the cloud browser is only for public reading and visitors. |
| D3 | **Desktop apps:** this hackathon covers web apps and file APIs; desktop apps and local files come through the Desktop Companion, which is a stretch goal here. |
| D4 | **OpenClaw is the Desktop Companion.** Because D3 makes the Companion a stretch goal, OpenClaw is not on the must-have list for the hackathon. |
| D5 | LangGraph is the brain; FastAPI backend; two repos (the extension lives in `one-for-all-web`). |
| D6 | One-tap permission cards for every connection. |
| D7 | Paid options with free fallbacks. |

### New defaults — tell me if you object

| # | Default | Why |
|---|---|---|
| D8 | Any signed-up member can connect their own browser; voice clones are owner-only | That is your goal; clones need consent checks and plans hold few custom voices |
| D9 | Public reading happens in a logged-out research browser; actions on your accounts happen in your Chrome | In your Chrome every tab shares your logins |
| D10 | Act 2 runs in your own Chrome; official APIs only as a fallback | Your logged-in browser is what makes it work, and it needs no developer apps |
| D11 | Default blocklist and ask-every-time list (B11.2) | Same idea as Claude in Chrome |
| D12 | ONE FOR ALL speaks English on Gradium and understands your Hinglish | Gradium has no Hindi; the contest scores Gradium speech |
| D13 | Telegram is our own small bot; watchers are a timer in our backend | Smaller and safer |
| D14 | Workers never make the final click; the extension does, only with a signed token that matches its own page reading | The only way an approval is tied to what you saw |
| D15 | Paid model key from day one; page content never goes to a free provider | Limits and privacy |
| D16 | Backend in the EU | Next to Gradium |
| D17 | No "always allow" rules in iteration 1 | Every consequential action keeps a human in the loop |
| D18 | The extension is built on **Nanobrowser** (Apache-2.0), not on page-agent, although page-agent has more stars | Nanobrowser already controls other sites in your logged-in Chrome with real input; page-agent is built to live inside a page you own (A4) |
| D19 | REA is used only for lawful analysis: the open-source base, our own code, and how sites behave in your own browser. It is **not** used to copy Claude in Chrome. | REA's own rules, Anthropic's terms, the store's policy and the contest all forbid copying (A4) |

---

## Part E — Unproven, and sources

### E1. The prep-week trial

Throwaway code only.

| # | Question | If the answer is no |
|---|---|---|
| 1 | Does the extension's WebSocket stay up for hours with a 20-second heartbeat, and reconnect after sleep? | Reconnect on every task step; the side panel kept open while working |
| 2 | Can the extension read the page (accessibility tree), click and type on up to 4 ONE FOR ALL tabs at once? | Two at once |
| 3 | Do workers in background tabs act and take pictures correctly? | One ONE FOR ALL window per worker |
| 4 | Can the extension watch and stop commit requests (tripwire)? | Every click on a logged-in site except a short read-only list is parked |
| 5 | Can the extension attach your resume to a site's upload field? | You attach it yourself when the card asks; ONE FOR ALL does the rest |
| 6 | On your own LinkedIn and Naukri, at human pace, do 10 searches and 3 form-fills (stopping before Submit) trigger any challenge? | Assisted mode: ONE FOR ALL fills; you click |
| 7 | How fast do live pictures reach a phone? | Lower frame rate |
| 8 | Does the Chrome Web Store accept an unlisted v0.1, and how long does review take? | The three-step developer-mode install for members |
| 9 | Does a call from a 4G phone connect, and on which transport? | The other transport |
| 10 | Real latency from India to the EU? | Targets adjusted and stated |
| 11 | Do contest credits lift Gradium's 1,500-character session limit? | Shorter sessions with reconnects; a paid plan |
| 12 | Which Hindi-English transcription service wins on your 50 sentences? | — |
| 13 | Does the Drive picker permission allow editing that file through the Sheets/Docs API? | Demo 4 moves after the hackathon |
| 14 | (Stretch) Does OpenClaw's Computer Use work on your Windows PC with our gate seeing every action, and how does it connect to our server? | The Companion moves after the hackathon |
| 15 | With its own AI removed, does a Nanobrowser fork act correctly when driven by our server, and how much of its code do we keep? | We write the control layer ourselves, using the same ideas |

Each result is written back into this file.

### E2. Still not confirmed

The contest's Rules tab · the Chrome Web Store registration fee and current review times · whether extension side panels can use the microphone · Gradium's behaviour when credits run out mid-sentence, and its handling of ₹, lakh, crore and Indian names · echo cancellation on iPhones · Bedrock limits for a new account in India · Edge and Brave store listings · India's data-protection duties apply from May 2027 [reviewer's reading]; B11.3 already follows them.

### E3. Sources

**Contest:** tensortonic.com/contests/gradium-voice-challenge
**Browser agents and extensions:** anthropic.com/news/claude-for-chrome; support.claude.com articles 12902428 (safety) and 12902446 (permissions); 9to5google.com, 16 Oct 2026 (ChatGPT controls Chrome tabs); developer.chrome.com — debugger API, Web Store review process, Web Store updates of Aug 2026; Chromium extensions group posts on review backlog and microphone permissions
**Open-source bases and tools:** github.com/nanobrowser/nanobrowser; github.com/alibaba/page-agent; github.com/hangwin/mcp-chrome (via listings); github.com/morluto/rea and its DISCLAIMER.md; Anthropic consumer terms; Chrome Web Store policy on impersonation and intellectual property
**OpenClaw:** docs.openclaw.ai — release 2026.8.1 (browser relay and computer use), trust model, tool-policy hooks; Chrome Web Store listing for OpenClaw Browser Relay
**Gradium:** docs.gradium.ai (speech, transcription, text rewriting, limits, credits, data residency); gradium.ai/pricing
**Pipecat:** docs.pipecat.ai (Gradium and Sarvam services, transports, interruptions)
**Platforms:** Google account help on automated browsers; Google OAuth test-mode limits; Drive picker permissions; LinkedIn help on automation; Telegram Bot API and Web Apps; Supabase, Oracle, Langfuse pricing; Google AI Studio terms
**Research:** arXiv 2603.10387, 2606.15008, 2603.27517 (OpenClaw security); 2604.05172 (ClawsBench); 2409.07429 (learned workflows for web agents); 2503.18813 (plan-then-execute defence); 2504.18575 (injection against web agents); 2505.23009 (speech evaluation)
