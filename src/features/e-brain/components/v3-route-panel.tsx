"use client";

// Additive schema-3 panel for the real /e-brain route. Local-only opt-in:
// no static bearer, no localStorage authority, and every payload is validated
// before any state is rendered.

import { useCallback, useState } from "react";
import {
  isV3Answer,
  scopeKey,
  type Confidence,
  type Degradation,
  type Freshness,
  type Provenance,
  type ScalarValue,
  type Snapshot,
  type V3Answer,
  type V3Fact,
  type ReceiptEnvelope,
} from "@/lib/ebrain/v3-contracts";
import { V3AnswerPanel } from "./v3-answer-panel";
import "../v3-ebrain.css";

type BackendAnswer = {
  answer_status?: string;
  items?: Array<{
    fact_id?: string;
    key?: { predicate?: string; scope?: string; org_id?: string; resource_namespace?: string };
    state?: string;
    current_value?: unknown;
    confidence?: number;
    freshness?: string;
    provenance?: Array<{
      source_id?: string;
      revision?: string;
      digest?: string;
      freshness?: string;
      span?: { start?: number; end?: number } | null;
    }>;
  }>;
  snapshot?: {
    org_id?: string;
    knowledge_seq?: number;
    valid_at?: string | null;
    identity_generation?: number;
    policy_version?: string;
    auth_epoch?: number;
    retrieval_generation?: string | null;
    model_generation?: string | null;
  };
  degradation?: string[];
  completeness?: string[];
  request_id?: string;
  receipts?: Array<Record<string, unknown>>;
};

const scalar = (value: unknown): ScalarValue => {
  if (typeof value === "number") return { kind: "number", value };
  if (typeof value === "boolean") return { kind: "boolean", value };
  return { kind: "string", value: String(value) };
};

const confidence = (score: number): Confidence => {
  const band = score >= 0.8 ? "high" : score >= 0.5 ? "moderate" : score >= 0.2 ? "low" : "unknown";
  return { score, band, basis: "retrieval" };
};

const freshness = (state: string | undefined): Freshness => ({
  state: state === "fresh" || state === "current" ? "current" : state === "stale" ? "stale" : "unknown",
  observed_at: null,
  lag_seconds: null,
  cut: "authoritative",
});

const facts = (payload: BackendAnswer): V3Fact[] =>
  (payload.items ?? []).map((item) => {
    const provenance: Provenance[] = (item.provenance ?? []).map((p) => ({
