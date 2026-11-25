import { Pill } from "@/components/common";
import type {
  AnswerStatus,
  Confidence,
  FactState,
  Freshness,
  ReceiptEnvelope,
  ScalarValue,
  V3Error,
} from "@/lib/ebrain/v3-contracts";
import type { ReactNode } from "react";

/** Only a verified current fact with a fresh source earns a Current badge. */
export function canShowCurrent(
  state: FactState,
  freshness: Freshness | null | undefined,
  answerStatus: AnswerStatus | null | undefined,
): boolean {
  if (state !== "current") return false;
  if (freshness && freshness.state !== "current") return false;
  if (
    answerStatus === "pending" ||
    answerStatus === "unavailable" ||
    answerStatus === "not_found" ||
    answerStatus === "ambiguous"
  ) {
    return false;
  }
  return true;
}

export function answerStatusText(status: AnswerStatus): string {
  switch (status) {
    case "complete":
      return "Complete";
    case "partial":
      return "Partial";
    case "ambiguous":
      return "Ambiguous";
    case "pending":
      return "Pending";
    case "not_found":
      return "Not found";
    case "unavailable":
      return "Unavailable";
  }
}

export function factStateText(state: FactState): string {
  switch (state) {
    case "current":
      return "Current";
    case "conflict":
      return "Conflict — not current";
    case "withdrawn":
      return "Withdrawn — not current";
    case "pending_verification":
      return "Pending verification — not current";
    case "absent":
      return "Absent — not current";
    case "unknown":
      return "Unknown — not current";
  }
}

export function freshnessText(freshness: Freshness): string {
  if (freshness.state === "stale") return "Source stale — not current";
  if (freshness.state === "unknown") return "Freshness unknown";
  return "Source fresh";
}

export function scalarText(value: ScalarValue | null): string {
  if (value === null) return "None";
  return value.value === "" ? "Empty string" : String(value.value);
}

export function confidenceText(confidence: Confidence): string {
  return `${confidence.band} (${Math.round(confidence.score * 100)}%) via ${confidence.basis} — retrieval evidence, not truth`;
}

export function V3PreviewNote() {
  return (
    <p className="v3-preview-note">
      PREVIEW · synthetic fixture data. No live service and no authorization.
    </p>
  );
}

export function V3Meta({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="v3-meta-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function V3Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <span className="v3-badge">
      <Pill tone={tone}>{label}</Pill>
    </span>
  );
}

export function factDisplayLabel(
  state: FactState,
  freshness: Freshness | null | undefined,
  answerStatus: AnswerStatus | null | undefined,
): string {
  if (canShowCurrent(state, freshness, answerStatus)) return "Current";
  if (state === "current" && freshness && freshness.state !== "current") {
    return "Not current — source stale";
  }
  if (state === "current") return "Not current — answer not settled";
  return factStateText(state);
}

export function V3StateBadge({
  state,
  freshness,
  answerStatus,
}: {
  state: FactState;
  freshness?: Freshness | null;
  answerStatus?: AnswerStatus | null;
}) {
  const isCurrent = canShowCurrent(state, freshness, answerStatus);
  return (
    <V3Badge
      label={factDisplayLabel(state, freshness, answerStatus)}
      tone={isCurrent ? "success" : "warning"}
    />
  );
}

export function V3Status({ children }: { children: ReactNode }) {
  return (
    <p className="v3-status" role="status" aria-live="polite">
      {children}
    </p>
  );
}

export function V3LoadingState() {
  return (
    <p className="v3-loading" role="status" aria-live="polite" aria-busy="true">
      Loading validated V3 payload…
    </p>
  );
}

export function V3ErrorState({
  error,
  onRetry,
}: {
  error: V3Error;
  onRetry?: () => void;
}) {
  return (
    <div className="v3-error" role="alert">
      <p>
        {error.code} · request {error.request_id}: {error.message}
      </p>
      <p>{error.retryable ? "Retryable" : "Not retryable"}.</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

function receiptStageText(stage: ReceiptEnvelope["stage"]): string {
  switch (stage) {
    case "generated":
      return "Generated only";
    case "sent":
      return "Sent, not acknowledged";
    case "ack":
      return "Acknowledged";
    case "client_reported_use":
      return "Client-reported use";
    case "unknown":
      return "Unknown";
  }
}

function yesNo(value: boolean, yes: string, no: string): string {
  return value ? yes : no;
}

export function V3Receipts({
  receipts,
}: {
  receipts: ReceiptEnvelope | null;
}) {
  if (receipts === null) {
    return (
      <section className="panel v3-receipts" aria-label="Receipts">
        <h3>Receipts</h3>
        <V3Status>Receipt state unknown — nothing claimed as delivered.</V3Status>
      </section>
    );
  }
  return (
    <section className="panel v3-receipts" aria-label="Receipts">
      <h3>Receipts</h3>
      <dl className="v3-meta">
        <V3Meta label="Stage">
          {receiptStageText(receipts.stage)}
        </V3Meta>
        <V3Meta label="Generated">
          {yesNo(receipts.generated, "Generated", "Not generated")}
        </V3Meta>
        <V3Meta label="Sent">
          {yesNo(receipts.sent, "Sent", "Not sent")}
        </V3Meta>
        <V3Meta label="Authenticated ack">
          {receipts.ack === "verified"
            ? "Verified"
            : receipts.ack === "unverified"
              ? "Unverified"
              : "Unknown"}
        </V3Meta>
        <V3Meta label="Client-reported use">
          {yesNo(
            receipts.client_reported_use,
            "Reported (unverified)",
            "Not reported",
          )}
        </V3Meta>
      </dl>
      <ul className="v3-receipt-list">
        {receipts.items.map((item) => (
          <li key={item.op_id} className="v3-receipt-item">
            <code>{item.op_id}</code>
            <span>{item.transition}</span>
            <span>{receiptStageText(item.stage)}</span>
            <span>
              Committed sequence:{" "}
              {item.committed_seq === null ? "unknown" : item.committed_seq}
            </span>
            <span>
              Projection lag: {item.projection_lag ? "yes" : "no"}
            </span>
            <code className="v3-digest">digest {item.request_digest}</code>
            {item.replay_marker !== null && (
              <span>Replay marker: {item.replay_marker}</span>
            )}
            {item.processing_url !== null && (
              <code className="v3-url">{item.processing_url}</code>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
