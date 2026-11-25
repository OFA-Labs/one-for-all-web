"use client";

import type {
  V3Budget,
  V3Error,
  V3Limits,
  V3Proposal,
  ProposalStatus,
} from "@/lib/ebrain/v3-contracts";
import {
  V3Badge,
  V3ErrorState,
  V3LoadingState,
  V3Meta,
  V3PreviewNote,
  V3Receipts,
  V3Status,
} from "./v3-shared";
import "../e-brain.css";

/** Supplied by the caller from an authenticated server session, never from
 * browser localStorage. */
export type V3Reviewer = {
  authority: string;
  canReview: boolean;
};

export type V3ReviewPanelProps = {
  proposal: V3Proposal | null;
  limits: V3Limits | null;
  reviewer?: V3Reviewer | null;
  loading?: boolean;
  busy?: boolean;
  error?: V3Error | null;
  status?: string | null;
  onApprove?: (proposalId: string, digest: string) => void;
  onReject?: (proposalId: string, digest: string) => void;
  onRetry?: () => void;
};

function proposalStatusText(status: ProposalStatus): string {
  switch (status) {
    case "pending":
      return "Pending review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "stale":
      return "Stale — digest no longer current";
    case "unknown":
      return "Unknown";
  }
}

function proposalTone(status: ProposalStatus) {
  if (status === "approved") return "success";
  if (status === "stale" || status === "rejected") return "danger";
  return "warning";
}

function BudgetRow({
  label,
  budget,
}: {
  label: string;
  budget: V3Budget;
}) {
  const value = budget.measured
    ? `${budget.used ?? 0} / ${budget.limit === null ? "no stated limit" : budget.limit}`
    : "unmeasured";
  return (
    <li>
      <span>{label}</span>
      <span>{value}</span>
    </li>
  );
}

function PlanUsage({ limits }: { limits: V3Limits }) {
  return (
    <section className="panel v3-plan" aria-label="Capacity and plan usage">
      <h3>Capacity and plan usage</h3>
      <dl className="v3-meta">
        <V3Meta label="Plan revision">{limits.plan_revision}</V3Meta>
        <V3Meta label="Mode">{limits.mode}</V3Meta>
        <V3Meta label="Tier">{limits.tier}</V3Meta>
        <V3Meta label="Scope">{limits.scope}</V3Meta>
        <V3Meta label="Active facts">
          {limits.active_facts} / {limits.capacity_label}
        </V3Meta>
        <V3Meta label="Capacity evidence">
          {limits.capacity_measured
            ? "measured"
            : `unmeasured · ${limits.evidence_status}`}
        </V3Meta>
        <V3Meta label="Reservations">{limits.reserved}</V3Meta>
        <V3Meta label="Price">
          {limits.price === null
            ? "Price not set"
            : `${limits.price.amount} ${limits.price.currency}`}
        </V3Meta>
        <V3Meta label="Legacy event count">
          {limits.legacy_event_count === null
            ? "not provided"
            : limits.legacy_event_count}
        </V3Meta>
      </dl>
      {!limits.capacity_measured && (
        <V3Status>
          Capacity label is configuration, not a measured guarantee: unmeasured
          even when usage is below the label.
        </V3Status>
      )}
      <h4>Separate budgets</h4>
      <ul className="v3-list">
        <BudgetRow label="Events" budget={limits.budgets.events} />
        <BudgetRow label="Bytes" budget={limits.budgets.bytes} />
        <BudgetRow label="Jobs" budget={limits.budgets.jobs} />
        <BudgetRow label="Rate" budget={limits.budgets.rate} />
        <BudgetRow label="API" budget={limits.budgets.api} />
        <BudgetRow label="Export" budget={limits.budgets.export} />
      </ul>
    </section>
  );
}

function V3ReviewBody({
  proposal,
  limits,
  reviewer,
  busy,
  status,
  onApprove,
  onReject,
}: {
  proposal: V3Proposal;
  limits: V3Limits | null;
  reviewer: V3Reviewer | null | undefined;
  busy: boolean;
  status: string | null;
  onApprove?: (proposalId: string, digest: string) => void;
  onReject?: (proposalId: string, digest: string) => void;
}) {
  const authorityOk =
    reviewer !== null &&
    reviewer !== undefined &&
    reviewer.canReview &&
    reviewer.authority === proposal.reviewer_authority &&
    proposal.status !== "stale" &&
    proposal.status !== "approved" &&
    proposal.status !== "rejected";
  const canAct = authorityOk && !busy;

  return (
    <div className="v3-review-body">
      <dl className="v3-meta" aria-label="Proposal summary">
        <V3Meta label="Proposal">{proposal.proposal_id}</V3Meta>
        <V3Meta label="Version">{proposal.version}</V3Meta>
        <V3Meta label="Digest">
          <code className="v3-digest">{proposal.digest}</code>
        </V3Meta>
        <V3Meta label="Status">
          <V3Badge
            label={proposalStatusText(proposal.status)}
            tone={proposalTone(proposal.status)}
          />
        </V3Meta>
        <V3Meta label="Action">{proposal.action}</V3Meta>
        <V3Meta label="Impact">{proposal.impact}</V3Meta>
        <V3Meta label="Expiry">{proposal.expires_at}</V3Meta>
        <V3Meta label="Steward queue">{proposal.steward_queue}</V3Meta>
        <V3Meta label="Required authority">
          {proposal.reviewer_authority}
        </V3Meta>
        <V3Meta label="Separation of duties">
          {proposal.separation_of_duties ? "Enforced" : "Not recorded"}
        </V3Meta>
        <V3Meta label="Viewer authority">
          {reviewer === null || reviewer === undefined
            ? "Not established"
            : reviewer.authority}
        </V3Meta>
      </dl>

      <h3>Targets</h3>
      <ul className="v3-list">
        {proposal.targets.map((target) => (
          <li key={target}>
            <code>{target}</code>
          </li>
        ))}
      </ul>

      <h3>Evidence</h3>
      <ul className="v3-source-list">
        {proposal.evidence.map((source) => (
          <li key={`${source.source_id}-${source.revision}`}>
            <code>{source.source_id}</code>
            <span>revision {source.revision}</span>
            <span className="v3-digest">digest {source.digest}</span>
            <span>{source.kind}</span>
          </li>
        ))}
      </ul>

      <h3>Preconditions</h3>
      <ul className="v3-list">
        {proposal.preconditions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <V3Receipts receipts={proposal.receipts} />

      <h3>Review action</h3>
      <V3Status>
        {authorityOk
          ? "Authority established for this preview session."
          : "Authority not established — approval disabled. A server session must supply it; a localStorage role is not evidence."}
      </V3Status>
      {status !== null && <V3Status>{status}</V3Status>}
      {busy && <V3LoadingState />}
      <p className="v3-honesty">
        These buttons only send a request. The server rechecks authority,
        digest and expiry before any change; hiding a button is not enforcement.
      </p>
      <div className="v3-review-actions">
        <button
          type="button"
          disabled={!canAct || onApprove === undefined}
          onClick={() => onApprove?.(proposal.proposal_id, proposal.digest)}
        >
          Approve proposal
        </button>
        <button
          type="button"
          disabled={!canAct || onReject === undefined}
          onClick={() => onReject?.(proposal.proposal_id, proposal.digest)}
        >
          Reject proposal
        </button>
      </div>

      {limits !== null && <PlanUsage limits={limits} />}
    </div>
  );
}

export function V3ReviewPanel({
  proposal,
  limits,
  reviewer = null,
  loading = false,
  busy = false,
  error = null,
  status = null,
  onApprove,
  onReject,
  onRetry,
}: V3ReviewPanelProps) {
  return (
    <section
      className="panel v3-review-panel"
      aria-labelledby="v3-review-title"
      aria-busy={loading || busy}
    >
      <h2 id="v3-review-title">V3 proposal review</h2>
      <V3PreviewNote />
      {loading && <V3LoadingState />}
      {!loading && error !== null && (
        <V3ErrorState error={error} onRetry={onRetry} />
      )}
      {!loading && error === null && proposal === null && limits === null && (
        <V3Status>No validated proposal or limits document to display.</V3Status>
      )}
      {!loading &&
        error === null &&
        proposal !== null && (
          <V3ReviewBody
            proposal={proposal}
            limits={limits}
            reviewer={reviewer}
            busy={busy}
            status={status}
            onApprove={onApprove}
            onReject={onReject}
          />
        )}
      {!loading &&
        error === null &&
        proposal === null &&
        limits !== null && <PlanUsage limits={limits} />}
    </section>
  );
}
