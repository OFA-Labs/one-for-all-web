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
