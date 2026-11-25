/**
 * Schema-3 (V3) wire contract for E-Brain.
 *
 * Browser code must never coerce an unknown payload into a "current" answer.
 * Every shape below is accepted only through a runtime guard; the guards fail
 * closed on missing fields, unknown enum members, unsafe text and impossible
 * state/value combinations (for example a pending fact with a current value).
 * There are deliberately no `as` casts in this module.
 */

export type AnswerStatus =
  | "complete"
  | "partial"
  | "ambiguous"
  | "pending"
  | "not_found"
  | "unavailable";

export type FactState =
  | "absent"
  | "current"
  | "conflict"
  | "withdrawn"
  | "pending_verification"
  | "unknown";

export type ConfidenceBand = "high" | "moderate" | "low" | "unknown";
export type EvidenceBasis = "retrieval" | "inference" | "external" | "unknown";

/** Retrieval confidence. It is evidence about a lookup, not a truth claim. */
export type Confidence = {
  score: number;
  band: ConfidenceBand;
  basis: EvidenceBasis;
};

export type RetrievalCut = "authoritative" | "projection" | "unknown";

/** Source freshness, kept separate from the authoritative fact state. */
export type Freshness = {
  state: "current" | "stale" | "unknown";
  observed_at: string | null;
  lag_seconds: number | null;
  cut: RetrievalCut;
};

export type ProvenanceKind =
  | "first_party"
  | "approved"
  | "external"
  | "derived"
  | "unknown";

/** Sanitized source snapshot: bounded text, checked digest and ordered span. */
export type Provenance = {
  source_id: string;
  revision: string;
  digest: string;
  span: { start: number; end: number } | null;
  excerpt: string | null;
  kind: ProvenanceKind;
  annotation: string | null;
};

/** Exactly one typed scalar. Arrays/multi-valued writes are not current. */
export type ScalarValue =
  | { kind: "string"; value: string }
  | { kind: "number"; value: number }
  | { kind: "boolean"; value: boolean }
  | { kind: "instant"; value: string }
  | { kind: "code"; value: string };

export type FactAlternative = {
  fact_id: string;
  value: ScalarValue;
  provenance: Provenance;
  annotation: string | null;
};

export type V3Fact = {
  fact_id: string;
  predicate: string;
  state: FactState;
  /** Non-null only when state is "current". */
  current_value: ScalarValue | null;
  /** The decision someone intended, kept distinct from what was observed. */
  intended_value: ScalarValue | null;
  observed_value: ScalarValue | null;
  confidence: Confidence;
  freshness: Freshness;
  provenance: Provenance[];
  alternatives: FactAlternative[];
  claim_annotation: string | null;
};

export type DegradationLevel = "none" | "partial" | "severe" | "unavailable";

export type Degradation = {
  level: DegradationLevel;
  reasons: string[];
  omitted_facets: string[];
  index_lag: boolean;
  pending_included: boolean;
};

/** `time_known: false` makes an unknown legacy time explicit. */
export type Snapshot = {
  org_id: string;
  knowledge_seq: number;
  valid_at: string | null;
  time_known: boolean;
  identity_generation: string;
  policy_version: string;
  auth_epoch: string;
  retrieval_generation: string | null;
  model_generation: string | null;
};

export type Scope = {
  org_id: string;
  space_id: string;
  namespace: string;
};

export type ReceiptTransition =
  | "applied"
  | "accepted_pending"
  | "accepted_noncurrent"
  | "conflict"
  | "rejected"
  | "unknown";

export type ReceiptStage =
  | "generated"
  | "sent"
  | "ack"
  | "client_reported_use"
  | "unknown";

export type ReceiptStatus = {
  op_id: string;
  committed_seq: number | null;
  transition: ReceiptTransition;
  stage: ReceiptStage;
  processing_url: string | null;
  request_digest: string;
  replay_marker: string | null;
  acknowledged_at: string | null;
  client_reported_use_at: string | null;
  projection_lag: boolean;
};

/** Generated/sent are separate from authenticated ack and reported use. */
export type ReceiptEnvelope = {
  generated: boolean;
  sent: boolean;
  ack: "verified" | "unverified" | "unknown";
  client_reported_use: boolean;
  stage: ReceiptStage;
  items: ReceiptStatus[];
};

export type Cursor = {
  scope: string;
  value: string;
  knowledge_seq: number;
  expires_at: string | null;
};

export type V3Error = {
  code: string;
  message: string;
  request_id: string;
  retryable: boolean;
};

export type V3Answer = {
  schema: 3;
  answer_status: AnswerStatus;
  question: string;
  summary: string;
  intended_decision: string | null;
  observed_value: string | null;
  facts: V3Fact[];
  degradation: Degradation;
  snapshot: Snapshot;
  scope: Scope;
  confidence: Confidence;
  freshness: Freshness;
  receipts: ReceiptEnvelope;
  cursor: Cursor | null;
  error: V3Error | null;
};

export type ProposalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "stale"
  | "unknown";

export type V3Proposal = {
  proposal_id: string;
  version: number;
  digest: string;
  status: ProposalStatus;
  action: string;
  targets: string[];
  evidence: Provenance[];
  preconditions: string[];
  impact: string;
  expires_at: string;
  steward_queue: string;
  reviewer_authority: string;
  separation_of_duties: boolean;
  receipts: ReceiptEnvelope | null;
};

export type V3Budget = {
  used: number | null;
  limit: number | null;
  measured: boolean;
};

export type V3Limits = {
  schema: 3;
  plan_revision: string;
  mode: "free" | "paid" | "company" | "unknown";
  tier: string;
  scope: string;
  active_facts: number;
  reserved: number;
  capacity_label: string;
  evidence_status: "measured" | "unmeasured" | "unknown";
  capacity_measured: boolean;
  price: { amount: number; currency: string } | null;
  budgets: {
    events: V3Budget;
    bytes: V3Budget;
    jobs: V3Budget;
    rate: V3Budget;
    api: V3Budget;
    export: V3Budget;
  };
  legacy_event_count: number | null;
};

export type GuardResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };

const MAX_TEXT = 4000;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const ANSWER_STATUSES: readonly AnswerStatus[] = [
  "complete",
  "partial",
  "ambiguous",
  "pending",
  "not_found",
  "unavailable",
];
const FACT_STATES: readonly FactState[] = [
  "absent",
