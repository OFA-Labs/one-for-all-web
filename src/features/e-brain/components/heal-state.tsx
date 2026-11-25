"use client";

import { useEffect, useState } from "react";
import { Pill } from "@/components/common";
import type { EBrainClient, HealState, Limits } from "@/lib/ebrain/contracts";

export function HealState({
  limits,
  client,
}: {
  limits: Limits;
  client: EBrainClient;
}) {
  const [state, setState] = useState<HealState | null>(null);
  const [status, setStatus] = useState("");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let live = true;
    client.getHeal().then(
      (result) => live && setState(result),
      () =>
        live &&
        setState({
          mode: limits.heal_mode,
          proposals: [],
          applied: [],
        }),
    );
    return () => {
      live = false;
    };
  }, [client, limits.heal_mode, revision]);

  const harm = limits.known_flaws.find((flaw) => flaw.id === "heal_harm");
  const proposals = (state?.proposals ?? []).filter(
    (proposal) => !dismissed.includes(proposal.op_id),
  );

  async function approve(opId: string, ts: number) {
    try {
      await client.approveHeal(opId, ts);
      setDismissed((current) => [...current, opId]);
      setStatus("Saved. You can undo this with Rollback.");
      setRevision((current) => current + 1);
    } catch {
      setStatus("The approval could not be saved.");
    }
  }

  return (
    <section className="panel ebrain-heal" aria-label="Self-heal state">
      <h2>Self-heal</h2>
      <Pill>{limits.copy.heal_state[limits.heal_mode]}</Pill>
      <p>
        {harm
          ? `Automatic healing hid correct memories in tests (${harm.at_1k} at ~1k, ${harm.at_10k} at ~10k), so every change waits for you.`
          : "Automatic healing hid correct memories in tests, so every change waits for you."}
      </p>
      {proposals.length > 0 && (
        <ul className="ebrain-heal-list">
          {proposals.map((proposal) => (
            <li key={`${proposal.op_id}-${proposal.ts}`}>
              <span>
                {proposal.reason} — {proposal.action} ({proposal.op_id})
              </span>
              <button
                type="button"
                onClick={() => void approve(proposal.op_id, proposal.ts)}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() =>
                  setDismissed((current) => [...current, proposal.op_id])
                }
              >
                Dismiss
              </button>
            </li>
          ))}
        </ul>
      )}
      {state?.applied.length ? (
        <p>Applied: {state.applied.length} change(s) in this project.</p>
      ) : null}
      {status && <p role="status">{status}</p>}
    </section>
  );
}
