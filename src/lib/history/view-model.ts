/**
 * Wire (snake_case) → view-model (camelCase) mapping, the status-mapping mirror, and the
 * honest evidence copy. The only place the backend's JSON shape is known.
 */
import type {
  CalendarSummary,
  DisplayStatus,
  EvidenceStatus,
  HistoryApproval,
  HistoryDetail,
  HistoryEvidence,
  HistoryItem,
  HistoryPage,
  HistoryPeriod,
  LedgerEntry,
  TaskState,
  Tier,
} from "./contracts";

/**
 * TypeScript mirror of the backend's `display_status()` (backend/history/models.py). Both are
 * tested against the same fixture table; change them together. Returns null for states
 * History never shows (planning/executing).
 */
export function displayStatus(
  state: TaskState,
  tier: Tier,
  evidenceStatus: EvidenceStatus,
): DisplayStatus | null {
  if (state === "waiting" || state === "permission" || state === "question")
    return "Needs review";
  if (state === "paused") return "Paused";
  if (state === "declined") return "Declined";
  if (state === "cancelled") return "Cancelled";
  if (state === "error") return "Error";
  if (state === "unknown") return "Unknown";
  if (state !== "completed") return null;
  // A Tier-D worker claim never counts; only Tier A with verified evidence is "Verified".
  if (tier === "D") return "Unknown";
  if (tier === "A" && evidenceStatus === "verified") return "Verified";
  if (evidenceStatus === "held" || tier === "C") return "Needs review";
  if (
    (tier === "A" || tier === "B") &&
    (evidenceStatus === "verified" || evidenceStatus === "submitted")
  )
    return "Submitted";
  return "Unknown";
}

/** What the evidence tier honestly means; shown verbatim in the detail view. */
export function tierCopy(tier: Tier): string {
  switch (tier) {
    case "A":
      return "Verified — the created item was read back.";
    case "B":
      return "Submitted, not yet confirmed.";
    case "C":
      return "Confirmation text only; supports B.";
    case "D":
      return "Worker claim only. Never counts as evidence.";
    case "unknown":
      return "The outcome needs inspection. Do not retry blindly.";
    default:
      return "No evidence was recorded for this task.";
  }
}

// ---- wire shapes ------------------------------------------------------------------------
export type ApiItem = {
  task_id: string;
  title: string;
  subtitle: string;
  goal: string;
  scenario: string;
  state: TaskState;
  display_status: DisplayStatus;
  tier: Tier;
  evidence_status: EvidenceStatus;
  occurred_at: number;
  duration_ms: number | null;
  is_sample: boolean;
  result_url: string | null;
  summary: string | null;
};
export type ApiPage = {
  items: ApiItem[];
  next_cursor: string | null;
  total: number;
};
export type ApiPeriod = { items: ApiItem[]; total: number; truncated: boolean };
export type ApiCalendar = {
  days: { date: string; count: number; by_status: Record<string, number> }[];
};
type ApiEvidence = {
  tier: Tier;
  status: EvidenceStatus;
  item_id: string | null;
  url: string | null;
  readback: string | null;
  snapshot_hash: string | null;
  captured_at: number;
  verified_at: number | null;
  expires_at: number | null;
};
export type ApiDetail = {
  task: Omit<ApiItem, "result_url"> & {
    mode: "personal" | "playground";
    revision: number;
    created_at: number;
    ended_at: number | null;
    attempt: number;
    gate_reason: string | null;
  };
  plan: {
    version: number;
    hash: string;
    steps: string[];
    sites: string[];
    recipients: string[];
  };
  events: { seq: number; at: number; type: string; message: string }[];
  evidence: ApiEvidence | null;
  ledger: {
    idempotency_key: string;
    site: string;
    target: string | null;
    action: string;
    payload_hash: string;
    state: LedgerEntry["state"];
    created_at: number;
    transitions: {
      seq: number;
      at: number;
      from: string | null;
      to: string;
      note: string | null;
    }[];
  }[];
  approvals: {
    approval_id: string;
    page_url: string;
    plan_version: number;
    payload_hash: string;
    exact_text: string;
    decision: HistoryApproval["decision"];
    decided_at: number;
    expires_at: number | null;
    note: string | null;
  }[];
};

// ---- mappers ----------------------------------------------------------------------------
export function toItem(api: ApiItem): HistoryItem {
  return {
    id: api.task_id,
    title: api.title,
    subtitle: api.subtitle,
    goal: api.goal,
    scenario: api.scenario,
    state: api.state,
    status: api.display_status,
    tier: api.tier,
    evidenceStatus: api.evidence_status,
    occurredAt: api.occurred_at,
    durationMs: api.duration_ms,
    isSample: api.is_sample,
    resultUrl: api.result_url,
    summary: api.summary,
  };
}
export const toPage = (api: ApiPage): HistoryPage => ({
  items: api.items.map(toItem),
  nextCursor: api.next_cursor,
  total: api.total,
});
export const toPeriod = (api: ApiPeriod): HistoryPeriod => ({
  items: api.items.map(toItem),
  total: api.total,
  truncated: api.truncated,
});
export const toCalendar = (api: ApiCalendar): CalendarSummary => ({
  days: api.days.map((d) => ({
    date: d.date,
    count: d.count,
    byStatus: d.by_status,
  })),
});
const toEvidence = (e: ApiEvidence): HistoryEvidence => ({
  tier: e.tier,
  status: e.status,
  itemId: e.item_id,
  url: e.url,
  readback: e.readback,
  snapshotHash: e.snapshot_hash,
  capturedAt: e.captured_at,
  verifiedAt: e.verified_at,
  expiresAt: e.expires_at,
});
export function toDetail(api: ApiDetail): HistoryDetail {
  const t = api.task;
  return {
    task: {
      id: t.task_id,
      title: t.title,
      subtitle: t.subtitle,
      goal: t.goal,
      scenario: t.scenario,
      state: t.state,
      status: t.display_status,
      tier: t.tier,
      evidenceStatus: t.evidence_status,
      occurredAt: t.occurred_at,
      durationMs: t.duration_ms,
      isSample: t.is_sample,
      summary: t.summary,
      mode: t.mode,
      revision: t.revision,
      createdAt: t.created_at,
      endedAt: t.ended_at,
      attempt: t.attempt,
      gateReason: t.gate_reason,
    },
    plan: api.plan,
    events: api.events,
    evidence: api.evidence ? toEvidence(api.evidence) : null,
    ledger: api.ledger.map((l) => ({
      idempotencyKey: l.idempotency_key,
      site: l.site,
      target: l.target,
      action: l.action,
      payloadHash: l.payload_hash,
      state: l.state,
      createdAt: l.created_at,
      transitions: l.transitions,
    })),
    approvals: api.approvals.map((a) => ({
      approvalId: a.approval_id,
      pageUrl: a.page_url,
      planVersion: a.plan_version,
      payloadHash: a.payload_hash,
      exactText: a.exact_text,
      decision: a.decision,
      decidedAt: a.decided_at,
      expiresAt: a.expires_at,
      note: a.note,
    })),
  };
}
