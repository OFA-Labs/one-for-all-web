"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Code2,
  Download,
  FileText,
  Monitor,
  Search,
  Square,
} from "lucide-react";
import { useApp, FeatureDetails } from "./provider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  EmptyState,
  IntegrationButton,
  Notice,
  PageTitle,
  Pill,
} from "./common";
import { Brand } from "./shell";
import { features, type Feature } from "@/lib/integrations";
import { downloadFile } from "@/lib/utils";
export function Handoff() {
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("all");
  const [selected, setSelected] = useState<Feature | null>(null);
  const filtered = features.filter(
    (f) =>
      (module === "all" || f.module === module) &&
      `${f.id} ${f.name} ${f.spec} ${f.purpose}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        title="A clear place to pick up the work."
        description={`${features.length} backend features, one shared source of truth. Every contract is proposed; no endpoint exists in this build.`}
        action={
          <Button
            variant="outline"
            onClick={() =>
              downloadFile(
                "one-for-all-proposed-contracts.json",
                JSON.stringify(
                  {
                    notice: "Proposed contracts only; no endpoints implemented",
                    features,
                  },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            <Download size={16} />
            Export contracts
          </Button>
        }
      />
      <Notice>
        The same structured registry powers these panels and{" "}
        <code>docs/BACKEND_HANDOFF.md</code>. Start with account ownership,
        numbered task events, pairing, and park-and-commit before enabling any
        real action.
      </Notice>
      <div className="search-bar mt-6">
        <div className="search-input">
          <Search />
          <Input
            aria-label="Search integration features"
            placeholder="Find a feature, contract, or spec section…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter integration module"
          value={module}
          onChange={(e) => setModule(e.target.value)}
        >
          <option value="all">All modules</option>
          {Array.from(new Set(features.map((f) => f.module))).map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <p className="small muted">
        {filtered.length} of {features.length} features · backend not connected
      </p>
      <div className="integration-list">
        {filtered.map((f) => (
          <button key={f.id} onClick={() => setSelected(f)}>
            <Code2 size={20} className="text-foreground" />
            <div>
              <strong>{f.name}</strong>
              <p>{f.purpose}</p>
            </div>
            <span className="feature-id">{f.id}</span>
            <Pill>{f.module}</Pill>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
      {!filtered.length && (
        <EmptyState
          icon={Search}
          title="No matching handoff feature."
          description="Try a module name, an action, or a specification section."
        />
      )}
      <Dialog
        open={!!selected}
        onOpenChange={(v) => {
          if (!v) setSelected(null);
        }}
      >
        <DialogContent className="integration-dialog">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              Feature-level backend handoff. Proposed contracts only.
            </DialogDescription>
          </DialogHeader>
          {selected && <FeatureDetails feature={selected} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
export function Privacy() {
  const { integrate, reset } = useApp();
  const [confirm, setConfirm] = useState(false);
  const [typed, setTyped] = useState("");
  return (
    <div className="privacy-document">
      <PageTitle
        title="Your browser is a personal place."
        description="It should stay that way. Here’s what the intended product can access, and what this preview actually does."
      />
      <Notice>
        This is a product privacy preview, not an operational service policy. No
        account, provider or privacy-contact email is configured. The production
        notice needs a real controller/contact and legal review before sign-up
        is enabled.
      </Notice>
      <section>
        <h2>A small, visible circle of access</h2>
        <p>
          ONE FOR ALL will act only in the coloured ONE FOR ALL tab group, on sites in
          your frozen plan, with site permission. Tabs outside it are invisible.
          Password fields are masked on your laptop. Password managers remain
          blocked.
        </p>
        <p>
          Banking, payments, crypto, government ID, tax, health records and
          adult sites are blocked by default. Email, storage and
          account/security pages ask every time and start read-only. No
          sensitive-site pictures, password-field images or pictures while you
          are driving are sent.
        </p>
      </section>
      <section>
        <h2>You decide before anything leaves</h2>
        <p>
          Sending, posting, submitting, uploading, changing settings and
          deleting need a review card. It shows the account, recipient, exact
          values, files and declarations from a fresh page reading. Access never
          means approval. You can pause, use Alt+Shift+J, cancel Chrome’s
          debugging bar, or take a tab out of the group.
        </p>
      </section>
      <section>
        <h2>Where information will go</h2>
        <p>
          In the intended product, page readings and permitted screenshots go to
          our EU backend and a paid model provider that does not train on them.
          Provider and transport choices require trials. The voice runs in the
          website, not the extension. Production must disclose its actual
          processors and regions.
        </p>
        <p>
          In this build, no account, file, transcript or approval is sent to an
          API. Uploaded files remain local. Non-sensitive demo preferences can
          be saved in this browser; task state, filenames, flags, watcher edits
          and connection edits are held in memory.
        </p>
      </section>
      <section>
        <h2>Keep only what is needed</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Intended production data</th>
                <th>Retention requirement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Raw microphone audio</td>
                <td>Not stored (voice-consent evidence is separate)</td>
              </tr>
              <tr>
                <td>Spoken-line logs</td>
                <td>14 days</td>
              </tr>
              <tr>
                <td>Permitted screenshots</td>
                <td>7 days in private storage</td>
              </tr>
              <tr>
                <td>Page readings</td>
                <td>Only hashes after the task</td>
              </tr>
              <tr>
                <td>Files, history, facts, checkpoints, traces, voice clone</td>
                <td>Remove within 24 hours of verified deletion request</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2>A voice clone needs real consent</h2>
        <p>
          Clones are owner-only in iteration 1. Enrolment needs three actual
          20–30 second takes and a spoken challenge of three random words plus
          today’s date within 30 seconds. The provider voice ID stays on the
          server and is deleted at Gradium with the account.
        </p>
      </section>
      <section>
        <h2>Leave with your data, not loose ends</h2>
        <p>
          Disconnecting must revoke access immediately and pause related tasks.
          Deletion requires recent authentication and backend/provider erasure,
          with a receipt. Resetting this demo is separate and cannot erase any
          external account.
        </p>
        <div className="button-row">
          <Button
            variant="destructive"
            onClick={() => {
              setTyped("");
              setConfirm(true);
            }}
          >
            Request account deletion
          </Button>
          <Button variant="outline" onClick={reset}>
            Reset local demo only
          </Button>
          <IntegrationButton id="privacy.delete" />
        </div>
      </section>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review account deletion</DialogTitle>
            <DialogDescription>
              No live account exists in this preview. Type DELETE to inspect the
              proposed deletion workflow. This will not submit a request.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="delete-confirm">Confirmation</label>
          <Input
            id="delete-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
          />
          <Button
            variant="destructive"
            disabled={typed !== "DELETE"}
            onClick={() => {
              setConfirm(false);
              integrate("privacy.delete");
            }}
          >
            Review deletion requirements
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export function ExtensionPreview() {
  const { integrate, notify } = useApp();
  const [paused, setPaused] = useState(false);
  const [shared, setShared] = useState(true);
  return (
    <>
      <PageTitle
        title="The hands stay in your browser."
        description="A website-hosted preview of the extension toolbar, side panel, tab group and instant stop controls."
        action={<Pill>UI mockup · not an installable extension</Pill>}
      />
      <Notice>
        No manifest, debugger permission, tab access or browser automation is
        installed. Nanobrowser adaptation, pairing and local hard rules belong
        to the implementation handoff.
      </Notice>
      <div className="extension-browser mt-6">
        <div className="extension-tabs">
          <span>Personal tab · private</span>
          <span className="tab-group-label">ONE FOR ALL</span>
          <span>
            {shared ? "Playground application" : "Tab taken out of group"}
          </span>
        </div>
        <div className="extension-debugbar">
          <span>
            “ONE FOR ALL” started debugging this browser · illustrative bar
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPaused(true);
              notify(
                "Debugging-bar Cancel preview: all workers pause immediately. No debugger was attached.",
              );
            }}
          >
            Cancel
          </Button>
        </div>
        <div className="extension-toolbar">
          <div className="toggle-group">
            <Monitor size={20} />
            <strong>ONE FOR ALL toolbar</strong>
            <Pill tone={paused ? "warning" : "success"}>
              {paused ? "Paused" : "Preparing"} · sample
            </Pill>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setPaused(true);
              notify(
                "Toolbar Stop preview pauses work. It does not cancel or destroy the task.",
              );
            }}
          >
            <Square size={14} />
            Stop
          </Button>
        </div>
        <div className="extension-body">
          <div className="extension-demo-page">
            <FileText size={40} className="text-foreground" />
            <h2>Sample application page</h2>
            <p>
              Only this shared tab could be controlled. Other tabs, passwords
              and sensitive pages remain private.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setShared((v) => !v);
                setPaused(true);
              }}
            >
              {shared ? "Take tab out of the group" : "Share sample tab again"}
            </Button>
          </div>
          <aside className="extension-sidepanel">
            <Brand />
            <p>
              Voice stays in the website tab. The extension handles browser
              work, not audio.
            </p>
            <div className="list-row">
              <span>Current task</span>
              <Pill>Job application</Pill>
            </div>
            <div className="list-row">
              <span>Review needed</span>
              <button
                className="text-button"
                onClick={() => integrate("approval.commit")}
              >
                Open sample card
              </button>
            </div>
            <div className="button-row">
              <Button
                onClick={() => {
                  if (!shared) {
                    notify("Share the sample tab before resuming.");
                    return;
                  }
                  setPaused((v) => !v);
                }}
              >
                {paused ? "Confirm & resume" : "Pause preview"}
              </Button>
            </div>
            <p className="small mt-5">
              Alt+Shift+J: pause from any tab. Real shortcut registration
              belongs in Manifest V3.
            </p>
          </aside>
        </div>
      </div>
      <div className="panel-grid mt-6">
        <section className="panel">
          <h2>Boundaries, enforced twice.</h2>
          <p className="mt-3">
            Server policy decides; extension hard rules hold locally. Group tabs
            only, no passwords or CAPTCHA, no private-network addresses, no
            arbitrary scripts, no commit without a fresh signed token.
          </p>
          <IntegrationButton id="browser.permissions" />
        </section>
        <section className="panel">
          <h2>Connect once. Revoke any time.</h2>
          <p className="mt-3">
            One-time code → device key → encrypted outgoing connection.
            Heartbeats, wake behaviour and four-tab concurrency remain trial
            items.
          </p>
          <IntegrationButton id="browser.pair" />
        </section>
      </div>
    </>
  );
}
export function About() {
  return (
    <>
      <PageTitle
        title="A little less busywork."
        description="ONE FOR ALL is a voice-first assistant that plans visibly, works in your own browser, and waits for your final say."
      />
      <div className="panel-grid">
        <section className="panel">
          <h2>The brain in the cloud. The hands with you.</h2>
          <div className="architecture-flow">
            <span>Website · voice + review</span>
            <ChevronRight size={16} />
            <span>FastAPI · LangGraph + gate</span>
            <ChevronRight size={16} />
            <span>Your Chrome · extension</span>
          </div>
          <p>
            The website here is a complete local frontend preview. Everything
            beyond its visual interactions remains a backend or extension
            deliverable.
          </p>
          <div className="button-row">
            <Button variant="outline" asChild>
              <Link href="/handoff">Explore the handoff</Link>
            </Button>
          </div>
        </section>
        <section className="panel">
          <h2>Three ways to use it</h2>
          <div className="list-row">
            <span>Visitor</span>
            <span className="small muted">Reader, voice and Playground</span>
          </div>
          <div className="list-row">
            <span>Member</span>
            <span className="small muted">Own browser, files and watchers</span>
          </div>
          <div className="list-row">
            <span>Owner</span>
            <span className="small muted">Consented clone and lab</span>
          </div>
          <p className="small mt-4">
            Use the header role selector to inspect presentation. It is not real
            authorization.
          </p>
        </section>
        <section className="panel panel-wide">
          <h2>What still belongs to the real product</h2>
          <div className="roadmap-list">
            <div>
              <strong>Must have</strong>
              <p>
                Real Gradium speech and interruption; authenticated browser
                pairing; local hard rules; signed park-and-commit; job and PR
                flows; four-site drafts; privacy, actual evidence and
                reproducible speech tests.
              </p>
            </div>
            <div>
              <strong>Stretch</strong>
              <p>
                Picked Sheets/Docs edits, polished research, remote phone input,
                owner Desktop Companion, official YouTube/Slack API fallbacks,
                Gmail-in-browser resume and Hinglish speech.
              </p>
            </div>
            <div>
              <strong>After iteration 1</strong>
              <p>
                Companion for members, Microsoft 365, always-allow rules,
                WhatsApp and meeting clone. These are roadmap notes only and are
                not added to this scaffold.
              </p>
            </div>
          </div>
          <Notice tone="warning">
            The source spec says contest app code starts on 20 November 2026.
            This preview is created before that window. Contest eligibility,
            dates, provider limits and source claims must be confirmed
            independently; no contest submission or readiness is claimed.
          </Notice>
        </section>
        <section className="panel">
          <h2>Original UI. Open foundations.</h2>
          <p className="mt-3">
            Built with Next.js, React, Tailwind, shadcn/ui, Radix and Lucide.
            Both installed design skills guided the visual system and review.
          </p>
          <p>
            The intended extension may be built on Nanobrowser (Apache-2.0),
            with page-agent ideas where appropriate. This frontend contains no
            forked extension code and does not claim that integration exists.
            Preserve upstream licenses, NOTICE files and modified-file
            attributions when a fork is introduced.
          </p>
        </section>
        <section className="panel">
          <h2>A good place to begin</h2>
          <p className="mt-3">
            Try the assistant, paste some difficult text into Reader, then walk
            through a Playground approval. On a phone, the same review cards and
            tab tiles stay within reach.
          </p>
          <div className="button-row">
            <Button asChild>
              <Link href="/playground">Open the Playground</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/voice-lab">Owner lab preview</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
