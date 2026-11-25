# Local execution integration handoff

Branch: `feat/local-execution-foundation`, matching the API repository.

In the shared workspace, active feature checkouts are `.worktrees/local-execution-web/` and `.worktrees/local-execution-api/`. Original checkouts are being used by a concurrent E-Brain workflow; keep this feature isolated there. After a normal pull, ordinary repository paths apply.

The current milestone is the local deterministic browser/Windows execution foundation in the sibling API repository's `ofa_execution` package. The web preview, voice/dictation work and E-Brain interfaces are preserved. No public sign-in, model connection, cloud infrastructure or unfinished frontend feature is needed to run the executor's own local control page.

Start at `one-for-all-api/docs/local-execution/README.md`. Its `contracts.py` and local API provide the future frontend boundary: capability discovery, typed/structured plans, task snapshots/progress, structural observations, questions, approvals, errors and pause/resume/cancel/stop/Continue. Model providers supply plans later; the separate voice pipeline supplies final transcripts/control signals later. Neither integration can bypass the single gate or replace readback verification.

Do not show successful AI reasoning from fixture execution. Do not expose a local API credential in a public frontend bundle or add production pairing/auth claims. Local credentials are session-generated, not product identity. Production remote integration requires its own reviewed security work.

This branch adds only this feature handoff to the web repository; the implementation and real-hand tests are in the matching API branch. Existing unrelated web changes must not be included in the feature PR.
