"use client";

import type {
  V3Answer,
  V3Error,
  V3Fact,
} from "@/lib/ebrain/v3-contracts";
import { scopeKey } from "@/lib/ebrain/v3-contracts";
import {
  V3Badge,
  V3ErrorState,
  V3LoadingState,
  V3Meta,
  V3PreviewNote,
  V3Receipts,
  V3StateBadge,
  V3Status,
  answerStatusText,
  confidenceText,
  factDisplayLabel,
  factStateText,
  freshnessText,
  scalarText,
} from "./v3-shared";
import "../e-brain.css";

export type V3AnswerPanelProps = {
  answer: V3Answer | null;
  loading?: boolean;
  error?: V3Error | null;
  onRetry?: () => void;
};

function answerTone(status: V3Answer["answer_status"]) {
  if (status === "complete") return "success";
  if (status === "not_found" || status === "unavailable") return "danger";
  return "warning";
}

function FactItem({
  fact,
  answerStatus,
}: {
  fact: V3Fact;
  answerStatus: V3Answer["answer_status"];
}) {
  return (
    <li className="v3-fact">
      <details className="v3-fact-details">
        <summary>
          <span className="v3-fact-predicate">{fact.predicate}</span>
          <V3StateBadge
            state={fact.state}
            freshness={fact.freshness}
            answerStatus={answerStatus}
          />
        </summary>
        <dl className="v3-meta">
          <V3Meta label="Authoritative state">
            {factDisplayLabel(fact.state, fact.freshness, answerStatus)}
          </V3Meta>
          <V3Meta label="Retrieval confidence">
            {confidenceText(fact.confidence)}
          </V3Meta>
          <V3Meta label="Source freshness">
            {freshnessText(fact.freshness)}
          </V3Meta>
          <V3Meta label="Observed at">
            {fact.freshness.observed_at ?? "Unknown"}
          </V3Meta>
          <V3Meta label="Retrieval cut">{fact.freshness.cut}</V3Meta>
          <V3Meta label="Projection lag">
            {fact.freshness.lag_seconds === null
              ? "Unknown"
              : `${fact.freshness.lag_seconds}s`}
          </V3Meta>
          <V3Meta label="Current typed value">
            {scalarText(fact.current_value)}
          </V3Meta>
          <V3Meta label="Intended value">
            {scalarText(fact.intended_value)}
          </V3Meta>
          <V3Meta label="Observed value">
            {scalarText(fact.observed_value)}
          </V3Meta>
          <V3Meta label="Claim annotation">
            {fact.claim_annotation ?? "None"}
          </V3Meta>
          <V3Meta label="Approved sources">
            {fact.provenance.length === 0 ? "None" : fact.provenance.length}
          </V3Meta>
        </dl>
        {fact.alternatives.length > 0 && (
          <div className="v3-fact-sub">
            <h4>Conflicts and alternatives</h4>
            <ul className="v3-source-list">
              {fact.alternatives.map((alternative) => (
                <li key={alternative.fact_id}>
                  <code>{alternative.fact_id}</code>
                  <span>{scalarText(alternative.value)}</span>
                  <span>{factStateText(fact.state)}</span>
                  <span className="v3-digest">
                    digest {alternative.provenance.digest}
                  </span>
                  {alternative.annotation !== null && (
                    <span>{alternative.annotation}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {fact.provenance.length > 0 && (
          <div className="v3-fact-sub">
            <h4>Approved sources</h4>
            <ul className="v3-source-list">
              {fact.provenance.map((source) => (
                <li key={`${source.source_id}-${source.revision}`}>
                  <code>{source.source_id}</code>
                  <span>revision {source.revision}</span>
                  <span className="v3-digest">digest {source.digest}</span>
                  <span>
                    span{" "}
                    {source.span === null
                      ? "unknown"
                      : `${source.span.start}–${source.span.end}`}
                  </span>
                  <span>{source.kind}</span>
                  {source.excerpt !== null && (
                    <span className="v3-excerpt">{source.excerpt}</span>
                  )}
                  {source.annotation !== null && (
                    <span>{source.annotation}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </details>
    </li>
  );
}

function V3AnswerBody({ answer }: { answer: V3Answer }) {
  return (
    <div className="v3-answer-body">
      <dl className="v3-meta" aria-label="Answer summary">
        <V3Meta label="Answer status">
          <V3Badge
            label={answerStatusText(answer.answer_status)}
            tone={answerTone(answer.answer_status)}
          />
        </V3Meta>
        <V3Meta label="Intended decision">
          {answer.intended_decision ?? "None stated"}
        </V3Meta>
        <V3Meta label="Observed value">
          {answer.observed_value ?? "None observed"}
        </V3Meta>
        <V3Meta label="Retrieval confidence">
          {confidenceText(answer.confidence)}
        </V3Meta>
        <V3Meta label="Source freshness">
          {freshnessText(answer.freshness)}
        </V3Meta>
        <V3Meta label="Scope">{scopeKey(answer.scope)}</V3Meta>
      </dl>
      <V3Status>
        Completeness: {answerStatusText(answer.answer_status)} · degradation{" "}
        {answer.degradation.level} ·{" "}
        {answer.degradation.index_lag
          ? "index lag present"
          : "no index lag reported"}
      </V3Status>
      <p className="v3-summary">{answer.summary}</p>

      <h3>Completeness and degradation</h3>
      <dl className="v3-meta">
        <V3Meta label="Degradation level">{answer.degradation.level}</V3Meta>
        <V3Meta label="Index lag">
          {answer.degradation.index_lag
            ? "Yes — projection may trail the authoritative cut"
            : "No"}
        </V3Meta>
        <V3Meta label="Pending included">
          {answer.degradation.pending_included ? "Yes" : "No"}
        </V3Meta>
      </dl>
      <ul className="v3-list">
        {answer.degradation.reasons.map((reason) => (
          <li key={reason}>Reason: {reason}</li>
        ))}
        {answer.degradation.omitted_facets.map((facet) => (
          <li key={facet}>Omitted facet: {facet}</li>
        ))}
      </ul>

      <h3>Snapshot</h3>
      <dl className="v3-meta">
        <V3Meta label="Org">{answer.snapshot.org_id}</V3Meta>
        <V3Meta label="Knowledge sequence">
          {answer.snapshot.knowledge_seq}
        </V3Meta>
        <V3Meta label="Valid at">
          {answer.snapshot.time_known
            ? answer.snapshot.valid_at
            : "Unknown legacy time"}
        </V3Meta>
        <V3Meta label="Identity generation">
          {answer.snapshot.identity_generation}
        </V3Meta>
        <V3Meta label="Policy version">
          {answer.snapshot.policy_version}
        </V3Meta>
        <V3Meta label="Auth epoch">{answer.snapshot.auth_epoch}</V3Meta>
        <V3Meta label="Retrieval generation">
          {answer.snapshot.retrieval_generation ?? "Not stated"}
        </V3Meta>
        <V3Meta label="Model generation">
          {answer.snapshot.model_generation ?? "Not stated"}
        </V3Meta>
      </dl>

      <h3>Facts</h3>
      <ul className="v3-fact-list">
        {answer.facts.map((fact) => (
          <FactItem
            key={fact.fact_id}
            fact={fact}
            answerStatus={answer.answer_status}
          />
        ))}
      </ul>

      <h3>Scoped cursor</h3>
      <V3Status>
        {answer.cursor === null
          ? "No cursor issued."
          : `Scope ${answer.cursor.scope} · sequence ${answer.cursor.knowledge_seq} · ${answer.cursor.expires_at ?? "no expiry"}`}
      </V3Status>

      <V3Receipts receipts={answer.receipts} />
    </div>
  );
}

export function V3AnswerPanel({
  answer,
  loading = false,
  error = null,
  onRetry,
}: V3AnswerPanelProps) {
  return (
    <section
      className="panel v3-answer-panel"
      aria-labelledby="v3-answer-title"
      aria-busy={loading}
    >
      <h2 id="v3-answer-title">V3 answer</h2>
      <V3PreviewNote />
      {loading && <V3LoadingState />}
      {!loading && error !== null && (
        <V3ErrorState error={error} onRetry={onRetry} />
      )}
      {!loading && error === null && answer === null && (
        <V3Status>No validated answer to display.</V3Status>
      )}
      {!loading && error === null && answer !== null && (
        <V3AnswerBody answer={answer} />
      )}
    </section>
  );
}
