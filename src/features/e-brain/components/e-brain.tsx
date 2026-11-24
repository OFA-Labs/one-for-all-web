"use client";

import Image from "next/image";
import { useState } from "react";
import { PageTitle, Pill } from "@/components/common";
import { getEBrainClient } from "@/lib/ebrain/client";
import { CapacityMeter } from "./capacity-meter";
import { useEBrainLimits } from "./use-ebrain-limits";
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
  const limits = useEBrainLimits(client);

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
      {limits.state === "loading" && (
        <p className="ebrain-loading" aria-busy="true">
          Loading memory…
        </p>
      )}
      {limits.state === "error" && (
        <p role="alert">
          E-Brain service is not reachable at {limits.baseUrl}. Nothing was
          changed.
        </p>
      )}
      {limits.state === "ready" && <CapacityMeter limits={limits.data} />}
      <EBrainArtwork />
    </>
  );
}
