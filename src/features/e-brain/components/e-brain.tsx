"use client";

import Image from "next/image";
import { useState } from "react";
import { PageTitle, Pill } from "@/components/common";
import { getEBrainClient } from "@/lib/ebrain/client";
import { CapacityMeter } from "./capacity-meter";
import { EBrainEmpty, EBrainError, EBrainLoading } from "./ebrain-states";
import { HealState } from "./heal-state";
import { HonestyPanel } from "./honesty-panel";
import { MemoryList } from "./memory-list";
import { PairsReview } from "./pairs-review";
import { useEBrainLimits } from "./use-ebrain-limits";
import { V3RoutePanel } from "./v3-route-panel";
import "../e-brain.css";

function EBrainArtwork() {
  return (
    <section className="panel ebrain-panel" aria-label="About e-brain">
      <Image
        src="/media/e-brain-mark.webp"
        alt="e-brain: a brain inside the letter e"
        width={320}
        height={340}
        className="ebrain-artwork"
        unoptimized
        loading="eager"
      />
      <h2>Knowledge that stays with you.</h2>
      <p>Keep useful context close, so you can pick up where you left off.</p>
    </section>
  );
}

export function EBrain() {
  const [client] = useState(getEBrainClient);
  const [revision, setRevision] = useState(0);
  const limits = useEBrainLimits(client, revision);

  return (
    <>
      <PageTitle
        title="e-brain"
        description="Shared memory for Claude Code, Codex and the voice agent."
        action={
          limits.state === "ready" ? (
            <Pill tone="warning">{limits.data.copy.experimental_badge}</Pill>
          ) : undefined
        }
      />
      {limits.state === "loading" && <EBrainLoading />}
      {limits.state === "error" && (
        <EBrainError
          baseUrl={limits.baseUrl}
          onRetry={() => setRevision((current) => current + 1)}
        />
      )}
      {limits.state === "ready" && (
        <>
          <CapacityMeter limits={limits.data} />
          <HealState limits={limits.data} client={client} />
          <HonestyPanel
            capabilities={limits.data.capabilities}
            flaws={limits.data.known_flaws}
            source={limits.data.measured_source}
          />
          <PairsReview
            client={client}
            enabled={limits.data.subject_join === "on"}
          />
          <MemoryList
            client={client}
            capacityState={limits.data.capacity_state}
          />
          {limits.data.memory_count === 0 && <EBrainEmpty />}
        </>
      )}
      {process.env.NEXT_PUBLIC_EBRAIN_V3 === "1" && <V3RoutePanel />}
      <EBrainArtwork />
    </>
  );
}
