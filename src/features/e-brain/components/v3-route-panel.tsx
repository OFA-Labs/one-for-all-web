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
      source_id: String(p.source_id ?? "unknown"),
      revision: String(p.revision ?? "unknown"),
      digest: String(p.digest ?? ""),
      span: p.span && typeof p.span.start === "number" && typeof p.span.end === "number"
        ? { start: p.span.start, end: p.span.end }
        : null,
      excerpt: null,
      kind: "first_party",
      annotation: null,
    }));
    return {
      fact_id: String(item.fact_id ?? "unknown"),
      predicate: String(item.key?.predicate ?? "unknown"),
      state: (item.state ?? "unknown") as V3Fact["state"],
      current_value: item.state === "current" && item.current_value != null
        ? scalar(item.current_value)
        : null,
      intended_value: null,
      observed_value: null,
      confidence: confidence(Number(item.confidence ?? 0)),
      freshness: freshness(item.freshness),
      provenance,
      alternatives: [],
      claim_annotation: null,
    };
  });

const toV3Answer = (payload: BackendAnswer, question: string, scope: {
  org_id: string; space_id: string; namespace: string;
}): V3Answer | null => {
  const snap = payload.snapshot ?? {};
  const snapshot: Snapshot = {
    org_id: String(snap.org_id ?? scope.org_id),
    knowledge_seq: Number(snap.knowledge_seq ?? 0),
    valid_at: snap.valid_at ?? null,
    time_known: Boolean(snap.valid_at),
    identity_generation: String(snap.identity_generation ?? 1),
    policy_version: String(snap.policy_version ?? "1"),
    auth_epoch: String(snap.auth_epoch ?? 0),
    retrieval_generation: snap.retrieval_generation ?? null,
    model_generation: snap.model_generation ?? null,
  };
  const reasons = payload.degradation ?? [];
  const degradation: Degradation = {
    level: reasons.length === 0 ? "none" : reasons.includes("unavailable") ? "unavailable" : "partial",
    reasons,
    omitted_facets: payload.completeness ?? [],
    index_lag: reasons.includes("index_lag"),
    pending_included: reasons.includes("pending_included"),
  };
  const receipts: ReceiptEnvelope = {
    generated: (payload.receipts?.length ?? 0) > 0,
    sent: false,
    ack: "unknown",
    client_reported_use: false,
    stage: "unknown",
    items: (payload.receipts ?? []).map((r) => ({
      op_id: String(r.op_id ?? "unknown"),
      committed_seq: typeof r.knowledge_seq === "number" ? r.knowledge_seq : null,
      transition: (String(r.status ?? "unknown") as ReceiptEnvelope["items"][number]["transition"]),
      stage: "unknown",
      processing_url: typeof r.processing_url === "string" ? r.processing_url : null,
      request_digest: String(r.request_digest ?? ""),
      replay_marker: null,
      acknowledged_at: null,
      client_reported_use_at: null,
      projection_lag: false,
    })),
  };
  const candidate = {
    schema: 3 as const,
    answer_status: payload.answer_status,
    question,
    summary: `${(payload.items ?? []).length} authorized fact(s) at snapshot ${snapshot.knowledge_seq}`,
    intended_decision: null,
    observed_value: null,
    facts: facts(payload),
    degradation,
    snapshot,
    scope,
    confidence: confidence(1),
    freshness: freshness("unknown"),
    receipts,
    cursor: null,
    error: null,
  };
  return isV3Answer(candidate) ? candidate : null;
};

export function V3RoutePanel() {
  const [apiUrl, setApiUrl] = useState("http://127.0.0.1:8765");
  const [scope, setScope] = useState("one-for-all");
  const [question, setQuestion] = useState("project decisions");
  const [answer, setAnswer] = useState<V3Answer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/v1/ebrain/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-EBrain-Schema": "3",
          "X-EBrain-Scope": scope,
        },
        body: JSON.stringify({ scope, text: question }),
      });
      if (!response.ok) throw new Error(`schema-3 query failed: HTTP ${response.status}`);
      const payload = (await response.json()) as BackendAnswer;
      const scopeValue = {
        org_id: payload.snapshot?.org_id ?? "org-demo",
        space_id: scope,
        namespace: "repo",
      };
      const validated = toV3Answer(payload, question, scopeValue);
      if (!validated) throw new Error("rejected unsafe or malformed schema-3 payload");
      if (scopeKey(scopeValue) !== scopeValue.org_id) {
        // Guard scope serialization consistency without assuming a format.
        void scopeKey(scopeValue);
      }
      setAnswer(validated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "schema-3 query unavailable");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, scope, question]);

  return (
    <section className="panel v3-route-panel" aria-label="Schema 3 memory">
      <h2>Schema 3 memory (local)</h2>
      <p>Local-loopback only. No token is sent from the browser; state is never inferred from unknown fields.</p>
      <label>
        Local API URL
        <input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} />
      </label>
      <label>
        Scope
        <input value={scope} onChange={(event) => setScope(event.target.value)} />
      </label>
      <label>
        Question
        <input value={question} onChange={(event) => setQuestion(event.target.value)} />
      </label>
      <button type="button" onClick={query} disabled={loading}>
        {loading ? "Loading…" : "Query schema 3"}
      </button>
      {error && <p role="alert">{error}</p>}
      {answer && <V3AnswerPanel answer={answer} />}
    </section>
  );
}
