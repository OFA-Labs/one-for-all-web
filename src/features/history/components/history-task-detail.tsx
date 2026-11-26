"use client";
import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { EmptyState, Notice, PageTitle, Pill } from "@/components/common";
import { Button } from "@/components/ui/button";
import { DEFAULT_TIME_ZONE } from "@/lib/history/civil";
import type { HistoryClient, DisplayStatus } from "@/lib/history/contracts";
import { tierCopy } from "@/lib/history/view-model";
import { downloadFile } from "@/lib/utils";
import { useHistoryDetail } from "../hooks/use-history-data";
import { describeError, formatDuration, formatInstant } from "../lib/format";
import { ApprovalsPanel, EvidencePanel, LedgerPanel } from "./history-evidence";
import "./history-detail.css";

const statusTone = (status: DisplayStatus) =>
  status === "Verified"
    ? "success"
    : status === "Error"
      ? "danger"
      : status === "Declined" || status === "Paused" || status === "Cancelled"
        ? "neutral"
        : "warning";

/**
 * Read-only audit record for one stored task. It renders only what the server returned
 * (the frozen plan, ordered events, evidence, ledger and approvals), never the current
 * scenario copy, so an old record cannot change when the product copy does.
 */
export function HistoryTaskDetail({
  client,
  id,
  timeZone = DEFAULT_TIME_ZONE,
}: {
  client: HistoryClient;
  id: string;
  timeZone?: string;
}) {
  const { state, retry } = useHistoryDetail(client, id);
  const [exportError, setExportError] = useState(false);

  if (state.status === "idle" || state.status === "loading")
    return (
      <div className="hc-empty-period" role="status" aria-busy="true">
        <h3>Loading task…</h3>
      </div>
    );
  if (state.status === "error") {
    const missing = (state.error as { status?: number })?.status === 404;
    return missing ? (
      <EmptyState
        title="Task not found."
        description="This task doesn’t exist in your history, or you don’t have access to it."
      >
        <Button asChild variant="outline">
          <Link href="/history">Back to History</Link>
        </Button>
      </EmptyState>
    ) : (
      <div role="alert" className="hc-empty-period">
        <h3>Couldn’t load this task.</h3>
        <p>{describeError(state.error)}</p>
        <button className="hc-button" onClick={retry}>
          Try again
        </button>
      </div>
    );
  }

  const { task, plan, events, evidence, ledger, approvals } = state.data;
  const verifiedLink =
    evidence?.tier === "A" && evidence.status === "verified"
      ? evidence.url
      : null;
  const exportRecord = async () => {
    setExportError(false);
    try {
      downloadFile(
        `${task.id}.json`,
        await (await client.exportTask(task.id)).text(),
        "application/json",
      );
    } catch {
      setExportError(true);
    }
  };

  return (
    <>
      <PageTitle
        title={task.title}
        description={`${task.id} · ${task.isSample ? "demo record · no real websites or accounts used" : "read-only audit record"}`}
        action={
          <Button variant="outline" onClick={exportRecord}>
            Download audit record
          </Button>
        }
      />
      {exportError && (
        <div role="alert" className="hd-alert">
          The export could not be downloaded. Try again.
        </div>
      )}
      <Notice>
        {task.isSample
          ? "Fictional demo record. No real website or account was used."
          : "Read-only audit record."}
      </Notice>
      <div className="active-task-grid">
        <div>
          <section className="panel" aria-labelledby="hd-summary">
            <div className="section-heading">
              <h2 id="hd-summary">Outcome</h2>
              <Pill tone={statusTone(task.status)}>{task.status}</Pill>
              {task.isSample && <Pill>Demo record</Pill>}
            </div>
            <p className="small">{task.goal}</p>
            {task.summary && <p className="mt-3">{task.summary}</p>}
            <p className="small mt-3">{tierCopy(task.tier)}</p>
            {verifiedLink && (
              <p className="small mt-3">
                <a
                  href={verifiedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open the verified result
                </a>
              </p>
            )}
            <dl className="hd-facts">
              <div className="hd-fact">
                <dt>When</dt>
                <dd>{formatInstant(task.occurredAt, timeZone)}</dd>
              </div>
              <div className="hd-fact">
                <dt>Duration</dt>
                <dd>{formatDuration(task.durationMs)}</dd>
              </div>
              <div className="hd-fact">
                <dt>Attempt</dt>
                <dd>{task.attempt}</dd>
              </div>
              {task.gateReason && (
                <div className="hd-fact">
                  <dt>Safety level</dt>
                  <dd>{task.gateReason}</dd>
                </div>
              )}
            </dl>
          </section>
          <EvidencePanel evidence={evidence} timeZone={timeZone} />
          <LedgerPanel ledger={ledger} timeZone={timeZone} />
          <ApprovalsPanel approvals={approvals} timeZone={timeZone} />
        </div>
        <div>
          <section className="panel plan-panel" aria-labelledby="hd-plan">
            <div className="section-heading">
              <h2 id="hd-plan">Frozen plan</h2>
              <Pill>Plan v{plan.version}</Pill>
            </div>
            <p className="small muted">
              Frozen at approval. This is the plan as it was, not today’s copy.
            </p>
            <ol className="plan-list">
              {plan.steps.map((step, index) => (
                <li key={`${index}-${step}`}>
                  {/* The frozen plan has no per-step outcome, so never imply completion. */}
                  <span className="step-marker">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            {plan.sites.length > 0 && (
              <p className="small">Sites: {plan.sites.join(", ")}</p>
            )}
            {plan.recipients.length > 0 && (
              <p className="small">Recipients: {plan.recipients.join(", ")}</p>
            )}
            <p className="small muted">
              <code title={plan.hash}>{plan.hash.slice(0, 19)}…</code>
            </p>
          </section>
          <section className="panel" aria-labelledby="hd-timeline">
            <div className="section-heading">
              <h2 id="hd-timeline">Activity timeline</h2>
              <span className="small muted">{events.length} events</span>
            </div>
            <ol className="timeline">
              {events.map((event) => (
                <li key={event.seq}>
                  <span className="timeline-dot">
                    <Check size={11} aria-hidden="true" />
                  </span>
                  <div>
                    <span>{event.message}</span>
                    <small>
                      #{event.seq} · {event.type} ·{" "}
                      {formatInstant(event.at, timeZone)}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
