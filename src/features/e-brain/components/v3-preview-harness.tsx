"use client";

/**
 * Isolated preview harness for the V3 web slice. Fixtures are synthetic and
 * validated at runtime with the same guards a live client must use. No fetch,
 * no localStorage roles and no secrets are involved.
 */

import { useState } from "react";
import {
  guardV3Answer,
  guardV3Error,
  guardV3Limits,
  guardV3Proposal,
} from "@/lib/ebrain/v3-contracts";
import { V3AnswerPanel } from "./v3-answer-panel";
import { V3ReviewPanel } from "./v3-review-panel";
import "../v3-ebrain.css";

const DIGEST = "abcd1234abcd1234";
const OBSERVED = "2026-01-02T10:00:00Z";

function source(sourceId: string, digest = DIGEST) {
  return {
    source_id: sourceId,
    revision: "rev-1",
    digest,
    span: { start: 0, end: 24 },
    excerpt: "Sanitized snapshot excerpt.",
    kind: "first_party",
    annotation: null,
  };
}

function confidence(score: number, band: string, basis = "retrieval") {
  return { score, band, basis };
}

function freshness(
  state: string,
  observedAt: string | null = OBSERVED,
  lagSeconds: number | null = 0,
  cut = "authoritative",
) {
  return {
    state,
    observed_at: observedAt,
    lag_seconds: lagSeconds,
    cut,
  };
}

const SNAPSHOT = {
  org_id: "org-preview",
  knowledge_seq: 42,
  valid_at: "2026-01-01T00:00:00Z",
  time_known: true,
  identity_generation: "identity-3",
  policy_version: "policy-3",
  auth_epoch: "auth-7",
  retrieval_generation: "retrieval-2",
  model_generation: null,
};

const SCOPE = {
  org_id: "org-preview",
  space_id: "space-main",
  namespace: "engineering",
};

const CURSOR = {
  scope: "org-preview/space-main/engineering",
  value: "opaque-scoped-cursor-value",
  knowledge_seq: 42,
  expires_at: "2026-12-01T00:00:00Z",
};

const SENT_RECEIPTS = {
  generated: true,
  sent: true,
  ack: "verified",
  client_reported_use: true,
  stage: "client_reported_use",
  items: [
    {
      op_id: "op-42",
      committed_seq: 42,
      transition: "applied",
      stage: "client_reported_use",
      processing_url: "/ebrain/ops/op-42",
      request_digest: DIGEST,
      replay_marker: "replay-42",
      acknowledged_at: OBSERVED,
      client_reported_use_at: "2026-01-02T11:00:00Z",
      projection_lag: true,
    },
  ],
};

const GENERATED_RECEIPTS = {
  generated: true,
  sent: false,
  ack: "unknown",
  client_reported_use: false,
  stage: "generated",
  items: [],
};

const MIXED_FACTS = [
  {
    fact_id: "fact-current",
    predicate: "auth token TTL",
    state: "current",
    current_value: { kind: "string", value: "30 minutes" },
    intended_value: { kind: "string", value: "30 minutes" },
    observed_value: { kind: "string", value: "30 minutes" },
    confidence: confidence(0.92, "high"),
    freshness: freshness("current"),
    provenance: [source("approved-doc")],
    alternatives: [],
    claim_annotation: "Approved first-party claim.",
  },
  {
    fact_id: "fact-stale-current",
    predicate: "deployment port",
    state: "current",
    current_value: { kind: "number", value: 8080 },
    intended_value: { kind: "number", value: 8080 },
    observed_value: { kind: "number", value: 8080 },
    confidence: confidence(0.6, "moderate"),
    freshness: freshness("stale", OBSERVED, 900, "projection"),
    provenance: [source("stale-index-doc")],
    alternatives: [],
    claim_annotation: null,
  },
  {
    fact_id: "fact-pending",
    predicate: "session expiry",
    state: "pending_verification",
    current_value: null,
    intended_value: { kind: "string", value: "45 minutes" },
    observed_value: { kind: "string", value: "45 minutes" },
    confidence: confidence(0.1, "unknown"),
    freshness: freshness("unknown", null, null, "unknown"),
    provenance: [source("pending-doc")],
    alternatives: [],
    claim_annotation: "Verification not complete.",
  },
  {
    fact_id: "fact-conflict",
    predicate: "OTP length",
    state: "conflict",
    current_value: null,
    intended_value: null,
    observed_value: { kind: "number", value: 8 },
    confidence: confidence(0.55, "moderate", "external"),
    freshness: freshness("current"),
    provenance: [source("otp-doc")],
    alternatives: [
      {
        fact_id: "fact-conflict-alt",
        value: { kind: "number", value: 4 },
        provenance: source("otp-alt-doc"),
        annotation: "Alternative from a second source.",
      },
    ],
    claim_annotation: null,
  },
  {
    fact_id: "fact-withdrawn",
    predicate: "old API host",
    state: "withdrawn",
    current_value: null,
    intended_value: null,
    observed_value: null,
    confidence: confidence(0, "unknown", "unknown"),
    freshness: freshness("unknown", null, null, "unknown"),
    provenance: [],
    alternatives: [],
    claim_annotation: "Withdrawn by a reviewed decision.",
  },
  {
    fact_id: "fact-unknown",
    predicate: "billing contact",
    state: "unknown",
    current_value: null,
    intended_value: null,
    observed_value: null,
    confidence: confidence(0, "unknown", "unknown"),
    freshness: freshness("unknown", null, null, "unknown"),
    provenance: [],
    alternatives: [],
    claim_annotation: null,
  },
];

const MIXED_ANSWER = {
  schema: 3,
  answer_status: "partial",
  question: "What do we know about auth and deployment?",
  summary:
    "A partial answer: one approved value is current, one source is stale, and several facts cannot be treated as current.",
  intended_decision: "Use the approved 30-minute TTL.",
  observed_value: "Some sources still show a different TTL.",
  facts: MIXED_FACTS,
  degradation: {
    level: "partial",
    reasons: ["index lag on one source"],
    omitted_facets: ["history"],
    index_lag: true,
    pending_included: true,
  },
  snapshot: SNAPSHOT,
  scope: SCOPE,
  confidence: confidence(0.6, "moderate"),
  freshness: freshness("stale", OBSERVED, 8, "projection"),
  receipts: SENT_RECEIPTS,
  cursor: CURSOR,
  error: null,
};

const PENDING_ANSWER = {
  ...MIXED_ANSWER,
  answer_status: "pending",
  summary: "No scalar current value is claimed while verification is pending.",
  intended_decision: "Use 45 minutes after verification.",
  observed_value: "45 minutes was observed but not verified.",
  facts: [
    {
      ...MIXED_FACTS[2],
      predicate: "session expiry (pending)",
      freshness: freshness("unknown", null, null, "unknown"),
    },
    MIXED_FACTS[5],
  ],
  degradation: {
    level: "severe",
    reasons: ["verification pending"],
    omitted_facets: ["history", "conflicts"],
    index_lag: false,
    pending_included: true,
  },
  receipts: GENERATED_RECEIPTS,
};

const CONFLICT_ANSWER = {
  ...MIXED_ANSWER,
  answer_status: "ambiguous",
  summary: "Two sources disagree; no scalar current value is available.",
  intended_decision: null,
  observed_value: "8 and 4 were both observed.",
  facts: [MIXED_FACTS[3], MIXED_FACTS[5]],
  degradation: {
    level: "severe",
    reasons: ["conflict between sources"],
    omitted_facets: ["history"],
    index_lag: false,
    pending_included: false,
  },
};

const UNKNOWN_ANSWER = {
  ...MIXED_ANSWER,
  answer_status: "partial",
  summary: "The requested fact has no established state.",
  intended_decision: null,
  observed_value: null,
  facts: [MIXED_FACTS[5]],
  degradation: {
    level: "partial",
    reasons: ["state unknown"],
    omitted_facets: [],
    index_lag: false,
    pending_included: false,
  },
};

/** Deliberately unsafe: a pending fact carrying a scalar current value. */
const MALFORMED_ANSWER = {
  ...MIXED_ANSWER,
  facts: [
    {
      ...MIXED_FACTS[2],
      current_value: { kind: "string", value: "45 minutes" },
    },
    ...MIXED_FACTS.slice(1),
  ],
};

const ERROR_PAYLOAD = {
  code: "unavailable",
  message: "Schema-3 service is unavailable. Nothing was changed.",
  request_id: "req-503-preview",
  retryable: true,
};

const PROPOSAL = {
  proposal_id: "prop-7",
  version: 3,
  digest: DIGEST,
  status: "pending",
  action: "Demote the superseded TTL claim",
  targets: ["fact-current"],
  evidence: [source("proposal-evidence")],
  preconditions: ["Snapshot knowledge_seq must still be 42"],
  impact: "Changes which value may be shown as current after approval.",
  expires_at: "2026-12-01T00:00:00Z",
  steward_queue: "engineering-stewards",
  reviewer_authority: "schema3.review.approve",
  separation_of_duties: true,
  receipts: {
    generated: true,
    sent: true,
    ack: "verified",
    client_reported_use: false,
    stage: "ack",
    items: [
      {
        op_id: "op-prop-7",
        committed_seq: null,
        transition: "unknown",
        stage: "ack",
        processing_url: "/ebrain/ops/op-prop-7",
        request_digest: DIGEST,
        replay_marker: null,
        acknowledged_at: OBSERVED,
        client_reported_use_at: null,
        projection_lag: false,
      },
    ],
  },
};

const LIMITS = {
  schema: 3,
  plan_revision: "plan-4",
  mode: "company",
  tier: "company-config-50k",
  scope: "org-preview/space-main/engineering",
  active_facts: 412,
  reserved: 6,
  capacity_label: "50,000 facts (config capacity)",
  evidence_status: "unmeasured",
  capacity_measured: false,
  price: null,
  budgets: {
    events: { used: null, limit: 10000, measured: false },
    bytes: { used: null, limit: 100000000, measured: false },
    jobs: { used: null, limit: 100, measured: false },
    rate: { used: null, limit: 60, measured: false },
    api: { used: null, limit: 1000, measured: false },
    export: { used: null, limit: 10, measured: false },
  },
  legacy_event_count: 5000,
};

type ScenarioKey =
  | "mixed"
  | "pending"
  | "conflict"
  | "unknown"
  | "malformed"
  | "error"
  | "loading";

const SCENARIOS: readonly { key: ScenarioKey; label: string }[] = [
  { key: "mixed", label: "Load mixed" },
  { key: "pending", label: "Load pending" },
  { key: "conflict", label: "Load conflict" },
  { key: "unknown", label: "Load unknown" },
  { key: "malformed", label: "Load malformed" },
  { key: "error", label: "Load error" },
  { key: "loading", label: "Simulate loading" },
];

const ANSWER_WIRES: Record<ScenarioKey, unknown> = {
  mixed: MIXED_ANSWER,
  pending: PENDING_ANSWER,
  conflict: CONFLICT_ANSWER,
  unknown: UNKNOWN_ANSWER,
  malformed: MALFORMED_ANSWER,
  error: MIXED_ANSWER,
  loading: MIXED_ANSWER,
};

export function V3PreviewHarness() {
  const [scenario, setScenario] = useState<ScenarioKey>("mixed");
  const [previewAuthority, setPreviewAuthority] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);

  const answerResult = guardV3Answer(ANSWER_WIRES[scenario]);
  const errorResult = guardV3Error(ERROR_PAYLOAD);
  const proposalResult = guardV3Proposal(PROPOSAL);
  const limitsResult = guardV3Limits(LIMITS);

  const loading = scenario === "loading";
  const error = scenario === "error" && errorResult.ok ? errorResult.value : null;
  const answer =
    !loading && error === null && answerResult.ok ? answerResult.value : null;
  const rejection =
    !loading && error === null && !answerResult.ok ? answerResult.reason : null;

  function retry() {
    setScenario("mixed");
    setReviewStatus(null);
  }

  function queued(action: string, id: string, digest: string) {
    setReviewStatus(
      `Preview ${action} request queued for ${id} at digest ${digest}; no server action was run.`,
    );
  }

  return (
    <section className="v3-preview" aria-label="V3 preview harness">
      <div className="v3-preview-banner" role="note">
        <strong>PREVIEW — E-Brain V3 web slice</strong>
        <p>
          Synthetic mock fixtures only. No live service, no secrets and no
          authorization from localStorage. Approval authority below is a
          preview-only prop, not a real grant.
        </p>
      </div>
      <div className="v3-preview-bar" role="group" aria-label="Preview scenarios">
        {SCENARIOS.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={scenario === item.key}
            onClick={() => {
              setScenario(item.key);
              setReviewStatus(null);
            }}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={previewAuthority}
          onClick={() => setPreviewAuthority(!previewAuthority)}
        >
          {previewAuthority
            ? "Revoke preview authority"
            : "Grant preview authority"}
        </button>
      </div>
      <p className="v3-preview-scenarios">Selected scenario: {scenario}</p>

      {rejection !== null && (
        <div className="v3-rejection" role="alert">
          Rejected unsafe V3 answer payload: {rejection} No Current badge was
          rendered from it.
        </div>
      )}

      <V3AnswerPanel
        answer={answer}
        loading={loading}
        error={error}
        onRetry={retry}
      />
      <V3ReviewPanel
        proposal={proposalResult.ok ? proposalResult.value : null}
        limits={limitsResult.ok ? limitsResult.value : null}
        reviewer={
          previewAuthority
            ? { authority: "schema3.review.approve", canReview: true }
            : null
        }
        status={reviewStatus}
        onApprove={(id, digest) => queued("approval", id, digest)}
        onReject={(id, digest) => queued("rejection", id, digest)}
        onRetry={retry}
      />
    </section>
  );
}
