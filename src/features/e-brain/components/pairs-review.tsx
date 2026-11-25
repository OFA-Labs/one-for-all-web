"use client";

import { useEffect, useState } from "react";
import type { ChainSummary, EBrainClient, Pair } from "@/lib/ebrain/contracts";

export function PairsReview({
  client,
  enabled,
}: {
  client: EBrainClient;
  enabled: boolean;
}) {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [heads, setHeads] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    Promise.all([client.listPairs(), client.listChains()]).then(
      ([pairResult, chainResult]) => {
        if (!live) return;
        setPairs(pairResult.pairs);
        setHeads(
          Object.fromEntries(
            chainResult.chains.map((chain: ChainSummary) => [
              chain.chain,
              chain.head?.code ?? chain.head?.op_id ?? "No current value",
            ]),
          ),
        );
      },
      () => live && setStatus("Same-fact pairs could not be loaded."),
    );
    return () => {
      live = false;
    };
  }, [client, enabled]);

  function forget(pair: Pair) {
    setPairs((current) =>
      current.filter((row) => !(row.a === pair.a && row.b === pair.b)),
    );
  }

  async function act(
    kind: "confirm" | "split",
    pair: Pair,
    timestamp: number,
  ) {
    try {
      if (kind === "confirm") await client.confirmPair(pair.a, pair.b, timestamp);
      else await client.splitPair(pair.a, pair.b, timestamp);
      forget(pair);
      setStatus("Saved. You can undo this with Rollback.");
    } catch {
      setStatus("The change could not be saved.");
    }
  }

  if (!enabled) {
    return (
      <section className="panel ebrain-pairs" aria-label="Same-fact review">
        <h2>Same-fact review</h2>
        <p>Same-fact detection is OFF (experimental; it did not help in tests).</p>
      </section>
    );
  }

  return (
    <section className="panel ebrain-pairs" aria-label="Same-fact review">
      <h2>Same-fact review</h2>
      <p>These pairs may describe the same fact. Nothing is merged automatically.</p>
      <ul className="ebrain-pair-list">
        {pairs.map((pair) => (
          <li key={`${pair.a}-${pair.b}`}>
            <span>
              {heads[pair.a] ?? pair.a} ≈ {heads[pair.b] ?? pair.b}
            </span>
            <button
              type="button"
              onClick={() => void act("confirm", pair, Date.now())}
            >
              Same fact — merge
            </button>
            <button
              type="button"
              onClick={() => void act("split", pair, Date.now())}
            >
              Different facts
            </button>
            <button type="button" onClick={() => forget(pair)}>
              Decide later
            </button>
          </li>
        ))}
      </ul>
      {status && <p role="status">{status}</p>}
    </section>
  );
}
