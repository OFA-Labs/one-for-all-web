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
