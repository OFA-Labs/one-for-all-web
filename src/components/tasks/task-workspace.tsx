"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCheck,
  ChevronRight,
  Circle,
  FileText,
  Fingerprint,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  TriangleAlert,
} from "lucide-react";
import { useApp } from "@/app/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlagButton, IntegrationButton, Notice, Pill } from "@/components/common";
import { scenarios, type Task } from "@/lib/demo";
import { cn } from "@/lib/utils";
export function TaskControls() {
  const { task, act, integrate } = useApp();
  const [cancel, setCancel] = useState(false);
  if (!task) return null;
  const ended = ["completed", "cancelled", "declined"].includes(task.status);
  const paused = ["paused", "driving", "offline", "reconnecting"].includes(
    task.status,
  );
  return (
    <>
      <div className="task-controls">
        <Button
          variant="outline"
          disabled={ended}
          onClick={() =>
            integrate("task.control", () =>
              act({ type: paused ? "resume" : "pause" }),
            )
          }
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}{" "}
          {paused ? "Resume preview" : "Pause"}
        </Button>
        <Button
          variant="ghost"
          disabled={ended}
          onClick={() => setCancel(true)}
        >
          <Square size={14} /> Cancel
        </Button>
        <span className="keyboard-hint">Space to pause</span>
      </div>
      <Dialog open={cancel} onOpenChange={setCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this preview?</DialogTitle>
            <DialogDescription>
              Unused sample approvals will be revoked. Tabs are left as they
              are. Nothing already sent is undone automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="button-row">
            <Button variant="outline" onClick={() => setCancel(false)}>
              Keep task
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                act({ type: "cancel" });
                setCancel(false);
              }}
            >
              Cancel preview task
            </Button>
          </div>
          <IntegrationButton id="task.control" label="Pause and cancel details" />
        </DialogContent>
      </Dialog>
    </>
  );
}
export { BrowserTiles } from "./browser-decks";
export function TaskReview({ task }: { task: Task }) {
  const { act, integrate, notify } = useApp();
  const [answer, setAnswer] = useState("NCR only; no relocation to Pune");
  const [scope, setScope] = useState("once");
  const [edit, setEdit] = useState<string | null>(null);
  const [edited, setEdited] = useState("");
  if (task.status === "permission")
    return (
      <section className="review-panel">
        <div className="review-heading">
          <ShieldCheck size={21} />
          <div>
            <h2>Site access</h2>
            <p>
              Access request for {scenarios[task.scenario].sites.join(" and ")}
            </p>
          </div>
        </div>
        <p>
          A real agent asks for site access before it reads or prepares anything
          on these sites. This local preview contacts no site or account — and
          sending or submitting would still need a separate approval.
        </p>
        <fieldset className="choice-row">
          <legend className="sr-only">Permission duration</legend>
          {["once", "always"].map((s) => (
            <label key={s}>
              <input
                type="radio"
                name="scope"
                checked={scope === s}
                onChange={() => setScope(s)}
              />
              {s === "once" ? "Just this task" : "Always allow site access"}
            </label>
          ))}
        </fieldset>
        <Notice tone="warning">
          Automating some sites may break their terms. The risk to your account
          is yours. This local preview contacts no site or API.
        </Notice>
        <div className="button-row">
          <Button
            onClick={() =>
              integrate("browser.permissions", () => act({ type: "allow" }))
            }
          >
            Allow access
          </Button>
          <Button variant="ghost" onClick={() => act({ type: "cancel" })}>
            Not now
          </Button>
        </div>
        <IntegrationButton
          id="browser.permissions"
          label="Site permission details"
        />
      </section>
    );
  if (task.status === "question")
    return (
      <section className="review-panel">
        <Pill tone="warning">One quick question</Pill>
        <h2>Would you relocate to Pune?</h2>
        <p>
          The listing asks about relocation. Your confirmed preference is NCR. I
          won’t change that without you.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (answer.trim())
              integrate("approval.question", () =>
                act({ type: "answer", answer }),
              );
          }}
        >
          <label htmlFor="clarification">Your answer</label>
          <Textarea
            id="clarification"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
          />
          <p className="small muted">
            Sample reminder after 20 seconds; without an answer this item would
            park.
          </p>
          <Button type="submit">Use this answer in preview</Button>
        </form>
      </section>
    );
  if (task.status === "declined")
    return (
      <section className="review-panel refusal">
        <TriangleAlert size={24} />
        <h2>I can help you share. I can’t help you fake an audience.</h2>
        <p>
          Inventing people and manufacturing engagement can harm the channel. No
          tabs opened and no tools ran in this refusal preview.
        </p>
        <p>Try: “Share it from the accounts that are really mine.”</p>
        <IntegrationButton
          id="social.workflow"
          label="How real request screening must work"
        />
      </section>
    );
  if (task.status === "waiting")
    return (
      <section
        className="review-panel approval"
        aria-label="Sample approval card"
      >
        <div className="review-heading">
          <div className="approval-icon">
            <Fingerprint size={23} />
          </div>
          <div>
            <h2>Your final say</h2>
            <p>Exact sample values · revision {task.revision}</p>
          </div>
          <Pill tone="warning">Needs approval</Pill>
        </div>
        <p>
          Review what will leave your browser. Unticked items stay as sample
          drafts for 30 minutes.
        </p>
        {task.drafts.map((d) => (
          <div className="draft-item" key={d.id}>
            <div className="draft-title">
              <Checkbox
                id={`choose-${d.id}`}
                checked={d.selected}
                onCheckedChange={(v) =>
                  act({ type: "draft", id: d.id, selected: v === true })
                }
              />
              <label htmlFor={`choose-${d.id}`}>
                <strong>{d.action}</strong>
                <small>
                  {d.site} · {d.account}
                </small>
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEdit(d.id);
                  setEdited(d.text);
                }}
              >
                Edit
              </Button>
            </div>
            <div className="draft-body">{d.text}</div>
            {d.file && (
              <div className="attachment">
                <FileText size={16} />
                {d.file}
              </div>
            )}
            {d.declaration && (
              <Notice tone="warning">Declaration: {d.declaration}</Notice>
            )}
          </div>
        ))}
        <div className="approval-facts">
          <span>
            <LockKeyhole size={14} />
            {task.drafts.length === 1 && !task.drafts[0].file
              ? "Single low-risk sample · voice code 42"
              : "Tap only · files, declarations or several items"}
          </span>
          <span>Review: 24h · commit token: 60s</span>
        </div>
        {task.expired && (
          <Notice tone="warning">
            {task.events.at(-1)?.includes("expired")
              ? "This review has expired."
              : "The page or draft changed. Your previous approval is void."}{" "}
            Refresh the sample reading before approving.
          </Notice>
        )}
        <div className="button-row">
          {task.expired ? (
            <Button onClick={() => act({ type: "refresh" })}>
              <RotateCcw size={16} />
              Refresh sample reading
            </Button>
          ) : (
            <Button
              disabled={!task.drafts.some((d) => d.selected)}
              onClick={() =>
                integrate("approval.commit", () => act({ type: "approve" }))
              }
            >
              <Check size={16} />
              Approve selected preview
            </Button>
          )}
          <Button variant="outline" onClick={() => act({ type: "reject" })}>
            Reject
          </Button>
        </div>
        <details className="scenario-tools">
          <summary>Explore approval edge cases</summary>
          <div className="button-row">
            <Button
              variant="outline"
              size="sm"
              onClick={() => act({ type: "change-page" })}
            >
              Page changes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => act({ type: "expire" })}
            >
              Review expires
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                notify(
                  "Sample race: another device already decided. No second commit is allowed.",
                )
              }
            >
              Another device decides
            </Button>
          </div>
        </details>
        <IntegrationButton id="approval.commit" label="Approval and evidence details" />
        <Dialog
          open={!!edit}
          onOpenChange={(v) => {
            if (!v) setEdit(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit the sample draft</DialogTitle>
              <DialogDescription>
                Any edit invalidates the prior reading. A fresh review is
                required.
              </DialogDescription>
            </DialogHeader>
            <label htmlFor="edit-draft">Exact text</label>
            <Textarea
              id="edit-draft"
              value={edited}
              onChange={(e) => setEdited(e.target.value)}
              rows={7}
            />
            <Button
              disabled={!edited.trim()}
              onClick={() => {
                if (edit) act({ type: "draft", id: edit, text: edited });
                setEdit(null);
              }}
            >
              Save draft and invalidate review
            </Button>
          </DialogContent>
        </Dialog>
      </section>
    );
  if (task.status === "completed")
    return (
      <section className="review-panel complete">
        <div className="review-heading">
          <CheckCheck size={25} />
          <div>
            <h2>
              {task.evidence === "A"
                ? "That’s the shape of done."
                : "Evidence matters."}
            </h2>
            <p>
              {task.evidence === "A"
                ? "Sample verification, with a receipt to show for it."
                : task.evidence === "B"
                  ? "Submitted, not yet confirmed."
                  : "This sample outcome is not verified."}
            </p>
          </div>
          <Pill tone={task.evidence === "A" ? "success" : "warning"}>
            Tier {task.evidence}
          </Pill>
        </div>
        <p>
          {task.scenario === "research"
            ? "Three illustrative sources compared. These are not current provider prices."
            : `${task.approved.length} selected sample ${task.approved.length === 1 ? "action" : "actions"} illustrated. No real post, upload or application was made.`}
        </p>
        <div className="evidence-receipt">
          <span>
            <CheckCheck size={18} />
            Sample receipt
          </span>
          <strong>{task.id}</strong>
          <small>Evidence: {task.evidence} · fresh read-back illustrated</small>
        </div>
        <label htmlFor="evidence-tier">Inspect evidence tier</label>
        <select
          id="evidence-tier"
          value={task.evidence}
          onChange={(e) =>
            act({ type: "evidence", tier: e.target.value as Task["evidence"] })
          }
        >
          <option value="A">A — read back by ID / link</option>
          <option value="B">B — commit success, not confirmed</option>
          <option value="C">C — confirmation text only</option>
          <option value="D">D — worker claim, never verified</option>
          <option value="unknown">Unknown — inspect before retry</option>
        </select>
        <IntegrationButton id="history.list" label="History and evidence details" />
      </section>
    );
  if (
    ["offline", "driving", "reconnecting", "error", "paused"].includes(
      task.status,
    )
  )
    return (
      <section className="review-panel">
        <Pill tone="warning">
          {task.status === "driving"
            ? "You are driving"
            : task.status === "offline"
              ? "Your browser is offline"
              : task.status}
        </Pill>
        <h2>
          {task.status === "error"
            ? "The sample provider didn’t respond."
            : "The work can wait."}
        </h2>
        <p>
          {task.status === "offline"
            ? "Reader, chat previews and watchers remain available. Real browser work would resume only after a verified connection."
            : task.status === "driving"
              ? "The worker and live images are paused while you click or type. Continue only after reading the page again."
              : "No further action will start. Your plan and drafts are still here."}
        </p>
        <Button
          onClick={() =>
            act({ type: task.status === "error" ? "retry" : "resume" })
          }
        >
          {task.status === "error"
            ? "Preview worker re-brief"
            : "Confirm and resume preview"}
        </Button>
        <IntegrationButton id="task.control" label="Pause and resume details" />
      </section>
    );
  if (task.status === "cancelled")
    return (
      <Notice>
        Preview ended. Unused approvals revoked; no automatic undo was
        attempted.
      </Notice>
    );
  return (
    <div className="preparing-panel">
      <div className="subtle-spinner" />
      <h2>
        {task.status === "planning"
          ? "A clear plan, before the first click."
          : "Working through the sample steps…"}
      </h2>
      <p>
        Local simulation. No real browser, provider or account is connected.
      </p>
    </div>
  );
}
export function Plan({ task }: { task: Task }) {
  return (
    <section className="panel plan-panel">
      <div className="section-heading">
        <h2>Agent plan</h2>
        <Pill>
          <LockKeyhole size={12} />
          Frozen
        </Pill>
      </div>
      <p className="plan-intro">
        When you ask for something in a single sentence — “open GitHub with
        Claude, review PR #142, then send a summary to Slack” — a real agent uses
        AI to break it into the concrete steps you can see below, then waits for
        your approval before any of them act. This preview shows the shape of
        that plan with local, fictional steps. No site, account or API is
        contacted. The spec behind this is still a work in progress, but the
        direction is right.
      </p>
      <ol className="plan-list">
        {scenarios[task.scenario].steps.map((s, i) => (
          <li key={s}>
            <span
              className={cn(
                "step-marker",
                (task.status === "completed" || i === 0) && "done",
              )}
            >
              {task.status === "completed" || i === 0 ? (
                <Check size={13} />
              ) : (
                i + 1
              )}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <p className="small muted">
        Outside content can fill values, never add a site, step or recipient.
      </p>
      <IntegrationButton id="task.start" label="Plan and screening details" />
    </section>
  );
}
export function Timeline({ task }: { task: Task }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Activity timeline</h2>
        <span className="small muted">Local events</span>
      </div>
      <ol className="timeline">
        {task.events.map((event, i) => (
          <li key={`${i}-${event}`}>
            <span className="timeline-dot">
              {i === task.events.length - 1 ? (
                <Circle size={9} />
              ) : (
                <Check size={11} />
              )}
            </span>
            <div>
              <span>{event}</span>
              <small>Step {i + 1} · local event</small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function Transcript({ task }: { task: Task }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Conversation</h2>
        <Pill>Sample transcript</Pill>
      </div>
      <div className="transcript-line">
        <span className="transcript-speaker">You</span>
        <p>{task.goal}</p>
      </div>
      <div className="transcript-line">
        <span className="transcript-speaker one-for-all">ONE FOR ALL</span>
        <div>
          <p>
            {task.status === "declined"
              ? "I won’t invent identities or fake engagement. I can help share it from your own genuine accounts."
              : task.status === "waiting"
                ? "The draft is ready. Please review the exact text, account and destination before anything goes out."
                : task.status === "completed"
                  ? "The sample result is ready to inspect. No real action was performed."
                  : "I’ll stay inside your plan and ask before anything consequential."}
          </p>
          <small className="muted">Text preview · no audio generated</small>
        </div>
        <FlagButton id={`${task.id}-${task.status}`} />
      </div>
    </section>
  );
}
export function TaskLink({ task }: { task: Task }) {
  return (
    <Link href={`/tasks/${task.id}`} className="text-button">
      Open task details <ChevronRight size={16} />
    </Link>
  );
}
