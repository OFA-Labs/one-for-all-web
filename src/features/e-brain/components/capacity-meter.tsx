import { Notice, Pill } from "@/components/common";
import type { Limits } from "@/lib/ebrain/contracts";

export function CapacityMeter({ limits }: { limits: Limits }) {
  const {
    memory_count: count,
    capacity_soft: soft,
    capacity_hard: hard,
  } = limits;
  const beyond = limits.capacity_state === "beyond_tested_range";
  const near = limits.capacity_state === "near_limit";
  const template = beyond
    ? limits.copy.meter_beyond
    : near
      ? limits.copy.meter_near
      : limits.copy.meter_ok;
  const text = template
    .replace("{n}", count.toLocaleString("en-US"))
    .replace("{hard}", hard.toLocaleString("en-US"));

  return (
    <section className="panel ebrain-meter" aria-label="Memory capacity">
      <meter
        min={0}
        max={hard}
        low={soft}
        high={hard}
        optimum={0}
        value={Math.min(count, hard)}
        aria-label="Memories used"
      />
      <p>{text}</p>
      <Pill tone={beyond ? "danger" : near ? "warning" : "success"}>
        {beyond
          ? "Beyond tested range"
          : near
            ? "Near limit"
            : "Inside tested range"}
      </Pill>
      {beyond && <Notice tone="danger">{limits.copy.capacity_note}</Notice>}
      <p>{limits.copy.capacity_note}</p>
      <details>
        <summary>What counts as a memory?</summary>
        One saved note, decision or file version from any agent. Edits are new
        memories; nothing is overwritten.
      </details>
    </section>
  );
}
