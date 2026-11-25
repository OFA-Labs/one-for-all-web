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
  "current",
  "conflict",
  "withdrawn",
  "pending_verification",
  "unknown",
];
const BANDS: readonly ConfidenceBand[] = ["high", "moderate", "low", "unknown"];
const BASES: readonly EvidenceBasis[] = [
  "retrieval",
  "inference",
  "external",
  "unknown",
];
const CUTS: readonly RetrievalCut[] = ["authoritative", "projection", "unknown"];
const PROVENANCE_KINDS: readonly ProvenanceKind[] = [
  "first_party",
  "approved",
  "external",
  "derived",
  "unknown",
];
const TRANSITIONS: readonly ReceiptTransition[] = [
  "applied",
  "accepted_pending",
  "accepted_noncurrent",
  "conflict",
  "rejected",
  "unknown",
];
const STAGES: readonly ReceiptStage[] = [
  "generated",
  "sent",
  "ack",
  "client_reported_use",
  "unknown",
];
const ACK_STATES: readonly ReceiptEnvelope["ack"][] = [
  "verified",
  "unverified",
  "unknown",
];
const DEGRADATION_LEVELS: readonly DegradationLevel[] = [
  "none",
  "partial",
  "severe",
  "unavailable",
];
const PROPOSAL_STATUSES: readonly ProposalStatus[] = [
  "pending",
  "approved",
  "rejected",
  "stale",
  "unknown",
];
const EVIDENCE_STATUSES: readonly V3Limits["evidence_status"][] = [
  "measured",
  "unmeasured",
  "unknown",
];
const PLAN_MODES: readonly V3Limits["mode"][] = [
  "free",
  "paid",
  "company",
  "unknown",
];
const ERROR_CODES: readonly string[] = [
  "malformed",
  "unauthenticated",
  "forbidden",
  "not_found",
  "conflict",
  "payload_too_large",
  "unprocessable",
  "rate_limited",
  "unavailable",
];

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

/** Required text: non-empty, bounded and free of control characters. */
function isText(input: unknown, max = MAX_TEXT): input is string {
  return (
    typeof input === "string" &&
    input.length > 0 &&
    input.length <= max &&
    !CONTROL_CHARS.test(input)
  );
}

function isNullableText(input: unknown, max = MAX_TEXT): input is string | null {
  return input === null || isText(input, max);
}

/** Only same-origin absolute paths are allowed as processing URLs. */
function isProcessingUrl(input: unknown): input is string | null {
  if (input === null) return true;
  return (
    isText(input, 512) &&
    input.startsWith("/") &&
    !input.startsWith("//") &&
    !input.includes("\\") &&
    !CONTROL_CHARS.test(input)
  );
}

function isDigest(input: unknown): input is string {
  return typeof input === "string" && /^[a-f0-9]{8,128}$/i.test(input);
}

function isInteger(input: unknown, min = 0): input is number {
  return typeof input === "number" && Number.isInteger(input) && input >= min;
}

function isBoundedNumber(
  input: unknown,
  min: number,
  max: number,
): input is number {
  return (
    typeof input === "number" && Number.isFinite(input) && input >= min && input <= max
  );
}

function isIsoInstant(input: unknown): input is string {
  if (
    typeof input !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(input)
  ) {
    return false;
  }
  return Number.isFinite(Date.parse(input));
}

function isNullableIso(input: unknown): input is string | null {
  return input === null || isIsoInstant(input);
}

function isOneOf<T extends string>(
  input: unknown,
  options: readonly T[],
): input is T {
  return typeof input === "string" && options.some((option) => option === input);
}

function isBoolean(input: unknown): input is boolean {
  return typeof input === "boolean";
}

export function isConfidence(input: unknown): input is Confidence {
  if (!isRecord(input)) return false;
  if (!isBoundedNumber(input.score, 0, 1)) return false;
  if (!isOneOf(input.basis, BASES)) return false;
  if (!isOneOf(input.band, BANDS)) return false;
  const derived: ConfidenceBand =
    input.basis === "unknown"
      ? "unknown"
      : input.score >= 0.8
        ? "high"
        : input.score >= 0.5
          ? "moderate"
          : input.score >= 0.2
            ? "low"
            : "unknown";
  // A displayed band must agree with the score and basis: no fake "high".
  return input.band === derived;
}

export function isFreshness(input: unknown): input is Freshness {
  if (!isRecord(input)) return false;
  if (!isOneOf(input.state, ["current", "stale", "unknown"])) return false;
  if (!isNullableIso(input.observed_at)) return false;
  if (input.lag_seconds !== null && !isBoundedNumber(input.lag_seconds, 0, 1e9))
    return false;
  if (!isOneOf(input.cut, CUTS)) return false;
  if (input.state === "stale" && input.observed_at === null) return false;
  return true;
}

export function isProvenance(input: unknown): input is Provenance {
  if (!isRecord(input)) return false;
  if (!isText(input.source_id, 200)) return false;
  if (!isText(input.revision, 200)) return false;
  if (!isDigest(input.digest)) return false;
  if (!isNullableText(input.excerpt, 2000)) return false;
  if (!isOneOf(input.kind, PROVENANCE_KINDS)) return false;
  if (!isNullableText(input.annotation, 1000)) return false;
  const span = input.span;
  if (span !== null) {
    if (!isRecord(span)) return false;
    if (!isInteger(span.start, 0) || !isInteger(span.end, 0)) return false;
    if (span.end < span.start) return false;
  }
  return true;
}

export function isScalarValue(input: unknown): input is ScalarValue {
  if (!isRecord(input)) return false;
  const kind = input.kind;
  if (kind === "string" || kind === "code") return isText(input.value, 1000);
  if (kind === "number") {
    return typeof input.value === "number" && Number.isFinite(input.value);
  }
  if (kind === "boolean") return isBoolean(input.value);
  if (kind === "instant") return isIsoInstant(input.value);
  return false;
}

export function isFactAlternative(input: unknown): input is FactAlternative {
  if (!isRecord(input)) return false;
  if (!isText(input.fact_id, 200)) return false;
  if (!isScalarValue(input.value)) return false;
  if (!isProvenance(input.provenance)) return false;
  return isNullableText(input.annotation, 1000);
}

export function isV3Fact(input: unknown): input is V3Fact {
  if (!isRecord(input)) return false;
  if (!isText(input.fact_id, 200)) return false;
  if (!isText(input.predicate, 200)) return false;
  if (!isOneOf(input.state, FACT_STATES)) return false;
  const current = input.current_value;
  if (current !== null && !isScalarValue(current)) return false;
  // The central invariant: a scalar current value exists only for state=current.
  if (input.state === "current") {
    if (!isScalarValue(current)) return false;
    if (!Array.isArray(input.provenance) || input.provenance.length === 0)
      return false;
  } else if (current !== null) {
    return false;
  }
  if (input.intended_value !== null && !isScalarValue(input.intended_value)) {
    return false;
  }
  if (input.observed_value !== null && !isScalarValue(input.observed_value)) {
    return false;
  }
  if (!isConfidence(input.confidence)) return false;
  if (!isFreshness(input.freshness)) return false;
  if (
    !Array.isArray(input.provenance) ||
    input.provenance.length > 50 ||
    !input.provenance.every(isProvenance)
  ) {
    return false;
  }
  if (
    !Array.isArray(input.alternatives) ||
    input.alternatives.length > 20 ||
    !input.alternatives.every(isFactAlternative)
  ) {
    return false;
  }
  return isNullableText(input.claim_annotation, 1000);
}

export function isDegradation(input: unknown): input is Degradation {
  if (!isRecord(input)) return false;
  if (!isOneOf(input.level, DEGRADATION_LEVELS)) return false;
  if (
    !Array.isArray(input.reasons) ||
    input.reasons.length > 20 ||
    !input.reasons.every((reason) => isText(reason, 300))
  ) {
    return false;
  }
  if (
    !Array.isArray(input.omitted_facets) ||
    input.omitted_facets.length > 20 ||
    !input.omitted_facets.every((facet) => isText(facet, 300))
  ) {
    return false;
  }
  return isBoolean(input.index_lag) && isBoolean(input.pending_included);
}

export function isSnapshot(input: unknown): input is Snapshot {
  if (!isRecord(input)) return false;
  if (!isText(input.org_id, 200)) return false;
  if (!isInteger(input.knowledge_seq)) return false;
  if (!isBoolean(input.time_known)) return false;
  if (input.time_known) {
    if (!isIsoInstant(input.valid_at)) return false;
  } else if (input.valid_at !== null) {
    return false;
  }
  if (!isText(input.identity_generation, 200)) return false;
  if (!isText(input.policy_version, 200)) return false;
  if (!isText(input.auth_epoch, 200)) return false;
  if (!isNullableText(input.retrieval_generation, 200)) return false;
  return isNullableText(input.model_generation, 200);
}

export function isScope(input: unknown): input is Scope {
  if (!isRecord(input)) return false;
  return (
    isText(input.org_id, 200) &&
    isText(input.space_id, 200) &&
    isText(input.namespace, 200)
  );
}

export function scopeKey(scope: Scope): string {
  return `${scope.org_id}/${scope.space_id}/${scope.namespace}`;
}

export function isReceiptStatus(input: unknown): input is ReceiptStatus {
  if (!isRecord(input)) return false;
  if (!isText(input.op_id, 200)) return false;
  if (input.committed_seq !== null && !isInteger(input.committed_seq)) return false;
  if (!isOneOf(input.transition, TRANSITIONS)) return false;
  if (!isOneOf(input.stage, STAGES)) return false;
  if (!isProcessingUrl(input.processing_url)) return false;
  if (!isDigest(input.request_digest)) return false;
  if (!isNullableText(input.replay_marker, 200)) return false;
  if (!isNullableIso(input.acknowledged_at)) return false;
  if (!isNullableIso(input.client_reported_use_at)) return false;
  if (!isBoolean(input.projection_lag)) return false;
  if (input.stage === "ack" && input.acknowledged_at === null) return false;
  if (
    input.stage === "client_reported_use" &&
    (input.acknowledged_at === null || input.client_reported_use_at === null)
  ) {
    return false;
  }
  return true;
}

export function isReceiptEnvelope(input: unknown): input is ReceiptEnvelope {
  if (!isRecord(input)) return false;
  if (!isBoolean(input.generated) || !isBoolean(input.sent)) return false;
  if (!isOneOf(input.ack, ACK_STATES)) return false;
  if (!isBoolean(input.client_reported_use)) return false;
  if (!isOneOf(input.stage, STAGES)) return false;
  if (
    !Array.isArray(input.items) ||
    input.items.length > 100 ||
    !input.items.every(isReceiptStatus)
  ) {
    return false;
  }
  switch (input.stage) {
    case "generated":
      return !input.sent && !input.client_reported_use && input.ack === "unknown";
    case "sent":
      return (
        input.generated && !input.client_reported_use && input.ack === "unknown"
      );
    case "ack":
      return (
        input.generated &&
        input.sent &&
        input.ack === "verified" &&
        !input.client_reported_use
      );
    case "client_reported_use":
      return (
        input.generated &&
        input.sent &&
        input.ack === "verified" &&
        input.client_reported_use
      );
    case "unknown":
      return (
        !input.generated && !input.sent && !input.client_reported_use && input.ack === "unknown"
      );
    default:
      return false;
  }
}

export function isCursor(input: unknown): input is Cursor {
  if (!isRecord(input)) return false;
  if (!isText(input.scope, 300) || !isText(input.value, 1000)) return false;
  if (!isInteger(input.knowledge_seq)) return false;
  return isNullableIso(input.expires_at);
}

export function isV3Error(input: unknown): input is V3Error {
  if (!isRecord(input)) return false;
  if (!isOneOf(input.code, ERROR_CODES)) return false;
  if (!isText(input.message, 1000)) return false;
  if (!isText(input.request_id, 200)) return false;
  return isBoolean(input.retryable);
}

export function isV3Answer(input: unknown): input is V3Answer {
  if (!isRecord(input)) return false;
  if (input.schema !== 3) return false;
  if (!isOneOf(input.answer_status, ANSWER_STATUSES)) return false;
  if (!isText(input.question, 1000) || !isText(input.summary, MAX_TEXT)) return false;
  if (!isNullableText(input.intended_decision, 1000)) return false;
  if (!isNullableText(input.observed_value, 1000)) return false;
  if (
    !Array.isArray(input.facts) ||
    input.facts.length > 100 ||
    !input.facts.every(isV3Fact)
  ) {
    return false;
  }
  if (!isDegradation(input.degradation)) return false;
  if (!isSnapshot(input.snapshot)) return false;
  if (!isScope(input.scope)) return false;
  if (!isConfidence(input.confidence)) return false;
  if (!isFreshness(input.freshness)) return false;
  if (!isReceiptEnvelope(input.receipts)) return false;
  if (input.cursor !== null && !isCursor(input.cursor)) return false;
  if (input.error !== null && !isV3Error(input.error)) return false;
  if (input.error !== null && input.answer_status !== "unavailable") return false;
  // A pending/not_found answer must not silently flatten into current facts.
  if (
    (input.answer_status === "pending" || input.answer_status === "not_found") &&
    input.facts.some((fact) => isRecord(fact) && fact.state === "current")
  ) {
    return false;
  }
  if (
    isRecord(input.cursor) &&
    isRecord(input.scope) &&
    isScope(input.scope) &&
    input.cursor.scope !== scopeKey(input.scope)
  ) {
    return false;
  }
  return true;
}

export function isV3Proposal(input: unknown): input is V3Proposal {
  if (!isRecord(input)) return false;
  if (!isText(input.proposal_id, 200)) return false;
  if (!isInteger(input.version, 1)) return false;
  if (!isDigest(input.digest)) return false;
  if (!isOneOf(input.status, PROPOSAL_STATUSES)) return false;
  if (!isText(input.action, 500)) return false;
  if (!isText(input.impact, MAX_TEXT)) return false;
  if (!isIsoInstant(input.expires_at)) return false;
  if (!isText(input.steward_queue, 300)) return false;
  if (!isText(input.reviewer_authority, 300)) return false;
  if (!isBoolean(input.separation_of_duties)) return false;
  if (
    !Array.isArray(input.targets) ||
    input.targets.length > 50 ||
    !input.targets.every((target) => isText(target, 300))
  ) {
    return false;
  }
  if (
    !Array.isArray(input.evidence) ||
    input.evidence.length > 50 ||
    !input.evidence.every(isProvenance)
  ) {
    return false;
  }
  if (
    !Array.isArray(input.preconditions) ||
    input.preconditions.length > 50 ||
    !input.preconditions.every((item) => isText(item, 500))
  ) {
    return false;
  }
  return input.receipts === null || isReceiptEnvelope(input.receipts);
}

function isBudget(input: unknown): input is V3Budget {
  if (!isRecord(input)) return false;
  if (!isBoolean(input.measured)) return false;
  if (input.used !== null && !isInteger(input.used)) return false;
  if (input.limit !== null && !isInteger(input.limit)) return false;
  // An unmeasured budget must not display an invented usage number.
  if (!input.measured && (input.used !== null || input.limit === null)) return false;
  return true;
}

export function isV3Limits(input: unknown): input is V3Limits {
  if (!isRecord(input)) return false;
  if (input.schema !== 3) return false;
  if (!isText(input.plan_revision, 200)) return false;
  if (!isOneOf(input.mode, PLAN_MODES)) return false;
  if (!isText(input.tier, 200) || !isText(input.scope, 300)) return false;
  if (!isInteger(input.active_facts) || !isInteger(input.reserved)) return false;
  if (!isText(input.capacity_label, 300)) return false;
  if (!isOneOf(input.evidence_status, EVIDENCE_STATUSES)) return false;
  if (!isBoolean(input.capacity_measured)) return false;
  if (
    input.capacity_measured &&
    input.evidence_status !== "measured"
  ) {
    return false;
  }
  if (input.legacy_event_count !== null && !isInteger(input.legacy_event_count))
    return false;
  if (input.price !== null) {
    if (!isRecord(input.price)) return false;
    if (!isBoundedNumber(input.price.amount, 0, 1e12)) return false;
    if (!isText(input.price.currency, 3) || !/^[A-Z]{3}$/.test(input.price.currency))
      return false;
  }
  if (!isRecord(input.budgets)) return false;
  const budgetKeys = ["events", "bytes", "jobs", "rate", "api", "export"];
  for (const key of budgetKeys) {
    if (!isBudget(input.budgets[key])) return false;
  }
  return true;
}

export function guardV3Answer(input: unknown): GuardResult<V3Answer> {
  return isV3Answer(input)
    ? { ok: true, value: input }
    : { ok: false, reason: "Payload is not a valid schema-3 answer." };
}

export function guardV3Proposal(input: unknown): GuardResult<V3Proposal> {
  return isV3Proposal(input)
    ? { ok: true, value: input }
    : { ok: false, reason: "Payload is not a valid schema-3 proposal." };
}

export function guardV3Limits(input: unknown): GuardResult<V3Limits> {
  return isV3Limits(input)
    ? { ok: true, value: input }
    : { ok: false, reason: "Payload is not a valid schema-3 limits document." };
}

export function guardV3Error(input: unknown): GuardResult<V3Error> {
  return isV3Error(input)
    ? { ok: true, value: input }
    : { ok: false, reason: "Payload is not a valid schema-3 error." };
}
