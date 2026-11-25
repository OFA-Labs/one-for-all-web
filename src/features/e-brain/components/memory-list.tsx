"use client";

import { useEffect, useState } from "react";
import { Pill } from "@/components/common";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  CapacityState,
  ChainSummary,
  ChainVersion,
  EBrainClient,
} from "@/lib/ebrain/contracts";

type Badge = { glyph: string; text: string };

const LEGEND: Badge[] = [
  { glyph: "●", text: "current" },
  { glyph: "○", text: "superseded" },
  { glyph: "⚠", text: "conflicted" },
  { glyph: "≈", text: "possibly the same fact" },
  { glyph: "⛔", text: "untrusted (external)" },
  { glyph: "⤒", text: "beyond tested range" },
];

function badgesFor(chain: ChainSummary, capacity: CapacityState): Badge[] {
  const badges: Badge[] = [];
  if (chain.status === "current") badges.push(LEGEND[0]);
  if (chain.status === "superseded") badges.push(LEGEND[1]);
  if (chain.status === "conflicted" || chain.flags.includes("conflict"))
    badges.push(LEGEND[2]);
  if (chain.flags.includes("possible_same_fact")) badges.push(LEGEND[3]);
  if (chain.flags.includes("untrusted")) badges.push(LEGEND[4]);
  if (capacity === "beyond_tested_range") badges.push(LEGEND[5]);
  return badges;
}

function replayReason(chain: ChainSummary): string {
  if (chain.flags.includes("untrusted"))
    return "external content never overrides first-party (T3)";
  if (chain.status === "conflicted" || chain.flags.includes("conflict"))
    return "same-time writes from two agents (T4)";
  if (chain.flags.includes("possible_same_fact"))
    return "possible same fact — nothing merged until you confirm";
  if (chain.head?.authority === "human")
    return "human value outranks agent (T2)";
  return "newest admissible write (T1)";
}

export function MemoryList({
  client,
  capacityState,
}: {
  client: EBrainClient;
  capacityState: CapacityState;
}) {
  const [chains, setChains] = useState<ChainSummary[]>([]);
  const [cursor, setCursor] = useState(0);
  const [next, setNext] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<{
    chain: ChainSummary;
    versions: ChainVersion[];
  } | null>(null);

  useEffect(() => {
    let live = true;
    client.listChains(cursor).then(
      (result) => {
        if (!live) return;
        setChains((current) =>
          cursor === 0 ? result.chains : [...current, ...result.chains],
        );
        setNext(
          result.next_cursor === null ? null : Number(result.next_cursor),
        );
      },
      () => live && setError("The memory list could not be loaded."),
    );
    return () => {
      live = false;
    };
  }, [client, cursor]);

  async function openWhy(chain: ChainSummary) {
    setDetail({ chain, versions: [] });
    try {
      const result = await client.getChain(chain.chain);
      setDetail((current) =>
        current?.chain.chain === chain.chain
          ? { chain, versions: result.versions }
          : current,
      );
    } catch {
      // The drawer stays open with the summary already loaded.
    }
  }

  return (
    <section className="panel ebrain-memory" aria-label="Current memories">
      <h2>Current memories</h2>
      <div className="ebrain-legend">
        <h3>Badge legend</h3>
        <ul>
          {LEGEND.map((badge) => (
            <li key={badge.text}>
              <span aria-hidden="true">{badge.glyph}</span> {badge.text}
            </li>
          ))}
        </ul>
      </div>
      {error && <p role="status">{error}</p>}
      <ul className="ebrain-memory-list">
        {chains.map((chain) => {
          const head = chain.head;
          return (
            <li key={chain.chain} className="ebrain-memory-row">
              <div className="ebrain-memory-head">
                <strong>{head?.code ?? head?.op_id ?? "No current value"}</strong>
                {head && (
                  <small>
                    {head.agent} · {head.authority} · {head.provenance}
                  </small>
                )}
              </div>
              <div className="ebrain-badges">
                {badgesFor(chain, capacityState).map((badge) => (
                  <Pill key={badge.text}>
                    <span aria-hidden="true">{badge.glyph}</span> {badge.text}
                  </Pill>
                ))}
              </div>
              <button type="button" onClick={() => void openWhy(chain)}>
                Why am I seeing this?
              </button>
            </li>
          );
        })}
      </ul>
      {next !== null && (
        <button
          type="button"
          onClick={() => setCursor((current) => (next > current ? next : current))}
        >
          Load more
        </button>
      )}
      <Dialog
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Why am I seeing this?</DialogTitle>
          </DialogHeader>
          {detail && (
            <>
              <p>{replayReason(detail.chain)}</p>
              <h3>Version history</h3>
              <ul className="ebrain-versions">
                {detail.versions.map((version) => (
                  <li key={version.op_id}>
                    <p>
                      <code>{version.code ?? version.op_id}</code> — {version.text}
                    </p>
                    <small>
                      {version.ts} · {version.agent} · {version.authority} ·{" "}
                      {version.provenance} · {version.status}
                      {version.silent && " · silent update"}
                    </small>
                    {version.supersedes.length > 0 && (
                      <small>supersedes: {version.supersedes.join(", ")}</small>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
