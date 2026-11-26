"use client";
import { Pill } from "@/components/common";
import type {
  HistoryApproval,
  HistoryEvidence,
  LedgerEntry,
} from "@/lib/history/contracts";
import { tierCopy } from "@/lib/history/view-model";
import { formatInstant } from "../lib/format";
import "./history-detail.css";

const shorten = (value: string, keep = 14) =>
  value.length > keep * 2 + 1
    ? `${value.slice(0, keep)}…${value.slice(-keep)}`
    : value;

const ledgerTone = (state: LedgerEntry["state"]) =>
  state === "verified"
    ? "success"
    : state === "failed"
      ? "danger"
      : state === "committed"
        ? "neutral"
        : "warning";
const decisionTone = (decision: HistoryApproval["decision"]) =>
  decision === "approved"
    ? "success"
    : decision === "rejected" || decision === "revoked"
      ? "danger"
      : "warning";

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="hd-fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function EvidencePanel({
  evidence,
  timeZone,
}: {
  evidence: HistoryEvidence | null;
  timeZone: string;
}) {
  return (
    <section className="panel" aria-labelledby="hd-evidence">
      <div className="section-heading">
        <h2 id="hd-evidence">Evidence</h2>
        <Pill tone={evidence?.tier === "A" ? "success" : "warning"}>
          {evidence ? `Tier ${evidence.tier}` : "None"}
        </Pill>
      </div>
      <p className="small">{tierCopy(evidence?.tier ?? "none")}</p>
      {evidence && (
        <dl className="hd-facts">
          <Fact label="Status">{evidence.status}</Fact>
          {evidence.itemId && (
            <Fact label="Created item">
              <code>{evidence.itemId}</code>
            </Fact>
          )}
          {evidence.url && (
            <Fact label="Verified link">
              <a href={evidence.url} target="_blank" rel="noopener noreferrer">
                {evidence.url}
              </a>
            </Fact>
          )}
          {evidence.readback && (
            <Fact label="Read-back">{evidence.readback}</Fact>
          )}
          {evidence.snapshotHash && (
            <Fact label="Snapshot hash">
              <code title={evidence.snapshotHash}>
                {shorten(evidence.snapshotHash)}
              </code>
            </Fact>
          )}
          <Fact label="Captured">
            {formatInstant(evidence.capturedAt, timeZone)}
          </Fact>
          {evidence.verifiedAt && (
            <Fact label="Verified">
              {formatInstant(evidence.verifiedAt, timeZone)}
            </Fact>
          )}
          {evidence.expiresAt && (
            <Fact label="Expires">
              {formatInstant(evidence.expiresAt, timeZone)}
            </Fact>
          )}
        </dl>
      )}
    </section>
  );
}

export function LedgerPanel({
  ledger,
  timeZone,
}: {
  ledger: LedgerEntry[];
  timeZone: string;
}) {
  return (
    <section className="panel" aria-labelledby="hd-ledger">
      <div className="section-heading">
        <h2 id="hd-ledger">Side-effect ledger</h2>
      </div>
      {ledger.length === 0 ? (
        <p className="small">No side effects were recorded for this task.</p>
      ) : (
        <ul className="hd-list">
          {ledger.map((entry) => (
            <li key={entry.idempotencyKey}>
              <div className="hd-row">
                <strong>
                  {entry.action} · {entry.site}
                  {entry.target ? ` · ${entry.target}` : ""}
                </strong>
                <Pill tone={ledgerTone(entry.state)}>{entry.state}</Pill>
              </div>
              <p className="small muted">
                Key{" "}
                <code title={entry.idempotencyKey}>
                  {shorten(entry.idempotencyKey, 12)}
                </code>{" "}
                · payload{" "}
                <code title={entry.payloadHash}>
                  {shorten(entry.payloadHash, 10)}
                </code>
              </p>
              <ol className="hd-transitions">
                {entry.transitions.map((t) => (
                  <li key={t.seq}>
                    {t.from ? `${t.from} → ` : ""}
                    <strong>{t.to}</strong>
                    {t.note ? ` · ${t.note}` : ""}{" "}
                    <span className="muted">
                      · {formatInstant(t.at, timeZone)}
                    </span>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      )}
      <p className="small muted">
        An intent is inspected before any retry; it is never retried blindly.
        Worker claims never count as evidence.
      </p>
    </section>
  );
}

export function ApprovalsPanel({
  approvals,
  timeZone,
}: {
  approvals: HistoryApproval[];
  timeZone: string;
}) {
  return (
    <section className="panel" aria-labelledby="hd-approvals">
      <div className="section-heading">
        <h2 id="hd-approvals">Approvals</h2>
        <Pill>Immutable</Pill>
      </div>
      {approvals.length === 0 ? (
        <p className="small">No approval was requested for this task.</p>
      ) : (
        <ul className="hd-list">
          {approvals.map((approval) => (
            <li key={approval.approvalId}>
              <div className="hd-row">
                <strong>Plan v{approval.planVersion}</strong>
                <Pill tone={decisionTone(approval.decision)}>
                  {approval.decision}
                </Pill>
              </div>
              <p className="small muted">
                {approval.pageUrl} · payload{" "}
                <code title={approval.payloadHash}>
                  {shorten(approval.payloadHash, 10)}
                </code>{" "}
                · decided {formatInstant(approval.decidedAt, timeZone)}
                {approval.expiresAt
                  ? ` · expires ${formatInstant(approval.expiresAt, timeZone)}`
                  : ""}
              </p>
              {approval.note && <p className="small">{approval.note}</p>}
              <details className="hd-details">
                <summary>Exact approved text</summary>
                <pre>{approval.exactText}</pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
