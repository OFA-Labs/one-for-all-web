/**
 * History client contract. These are the camelCase view models the UI uses; the HTTP client
 * maps the backend's snake_case wire shapes into them at one boundary (see view-model.ts).
 */
export type HistoryMode = "live" | "preview";

export const DISPLAY_STATUSES = [
  "Verified",
  "Needs review",
  "Submitted",
  "Declined",
  "Paused",
  "Cancelled",
  "Unknown",
  "Error",
] as const;
export type DisplayStatus = (typeof DISPLAY_STATUSES)[number];
export type Tier = "A" | "B" | "C" | "D" | "unknown" | "none";
export type EvidenceStatus =
  "verified" | "submitted" | "held" | "unknown" | "none";
export type TaskState =
  | "planning"
  | "executing"
  | "waiting"
  | "permission"
  | "question"
  | "paused"
  | "completed"
  | "declined"
  | "cancelled"
  | "error"
  | "unknown";

export type HistoryItem = {
  id: string;
  title: string;
  subtitle: string;
  goal: string;
  scenario: string;
  state: TaskState;
  status: DisplayStatus;
  tier: Tier;
  evidenceStatus: EvidenceStatus;
  occurredAt: number;
  durationMs: number | null;
  isSample: boolean;
  resultUrl: string | null;
  summary: string | null;
};

export type HistoryPage = {
  items: HistoryItem[];
  nextCursor: string | null;
  total: number;
};
export type HistoryPeriod = {
  items: HistoryItem[];
  total: number;
  truncated: boolean;
};
export type CalendarDay = {
  date: string;
  count: number;
  byStatus: Record<string, number>;
};
export type CalendarSummary = { days: CalendarDay[] };

export type HistoryEvent = {
  seq: number;
  at: number;
  type: string;
  message: string;
};
export type HistoryEvidence = {
  tier: Tier;
  status: EvidenceStatus;
  itemId: string | null;
  url: string | null;
  readback: string | null;
  snapshotHash: string | null;
  capturedAt: number;
  verifiedAt: number | null;
  expiresAt: number | null;
};
export type LedgerTransition = {
  seq: number;
  at: number;
  from: string | null;
  to: string;
  note: string | null;
};
export type LedgerEntry = {
  idempotencyKey: string;
  site: string;
  target: string | null;
  action: string;
  payloadHash: string;
  state: "intent" | "committed" | "verified" | "unknown" | "failed";
  createdAt: number;
  transitions: LedgerTransition[];
};
export type HistoryApproval = {
  approvalId: string;
  pageUrl: string;
  planVersion: number;
  payloadHash: string;
  exactText: string;
  decision: "approved" | "rejected" | "expired" | "revoked";
  decidedAt: number;
  expiresAt: number | null;
  note: string | null;
};
export type HistoryDetail = {
  task: Omit<HistoryItem, "resultUrl" | "tier"> & {
    tier: Tier;
    mode: "personal" | "playground";
    revision: number;
    createdAt: number;
    endedAt: number | null;
    attempt: number;
    gateReason: string | null;
  };
  plan: {
    version: number;
    hash: string;
    steps: string[];
    sites: string[];
    recipients: string[];
  };
  events: HistoryEvent[];
  evidence: HistoryEvidence | null;
  ledger: LedgerEntry[];
  approvals: HistoryApproval[];
};

export type Filters = {
  q?: string;
  /** A display status, or undefined/"all" for no filter. */
  status?: string;
  includeSample?: boolean;
};
export type ListParams = Filters & {
  state?: string;
  tier?: string;
  from?: string;
  to?: string;
  tz?: string;
  cursor?: string;
  limit?: number;
  sort?: "newest" | "oldest";
};
/** A civil-date range, `to` exclusive, in an IANA zone. */
export type RangeParams = Filters & { from: string; to: string; tz: string };

export interface HistoryClient {
  readonly mode: HistoryMode;
  listTasks(params: ListParams, signal?: AbortSignal): Promise<HistoryPage>;
  getPeriod(params: RangeParams, signal?: AbortSignal): Promise<HistoryPeriod>;
  getCalendar(
    params: RangeParams,
    signal?: AbortSignal,
  ): Promise<CalendarSummary>;
  getTask(id: string, signal?: AbortSignal): Promise<HistoryDetail>;
  exportTask(id: string, signal?: AbortSignal): Promise<Blob>;
}

/** A failed History request. `status` 0 means the network or proxy was unreachable. */
export class HistoryHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HistoryHttpError";
  }
}
