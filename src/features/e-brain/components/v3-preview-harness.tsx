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
