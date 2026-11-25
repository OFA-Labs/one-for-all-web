import { Pill } from "@/components/common";
import type { Capability, KnownFlaw } from "@/lib/ebrain/contracts";

function CapabilityList({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: Capability[];
  tone: "success" | "warning";
}) {
  return (
    <div>
      <h3>{title}</h3>
      <ul className="ebrain-cap-list">
        {rows.map((row) => (
          <li key={row.id}>
            <p>{row.example}</p>
            <Pill tone={tone}>{row.tier}</Pill>
            <p className="ebrain-measured">
              measured: {row.metric} {row.at_1k} at ~1k memories, {row.at_10k} at
              ~10k
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HonestyPanel({
  capabilities,
  flaws,
  source,
}: {
  capabilities: Capability[];
  flaws: KnownFlaw[];
  source: string;
}) {
  return (
    <section
      className="panel ebrain-honesty"
      aria-label="What this can and can't do"
    >
      <h2>{"What this can and can't do"}</h2>
      <div className="ebrain-cap-grid">
        <CapabilityList
          title="Can"
          rows={capabilities.filter((row) => row.can)}
          tone="success"
        />
        <CapabilityList
          title={"Can't reliably"}
          rows={capabilities.filter((row) => !row.can)}
          tone="warning"
        />
      </div>
      <h2>Known flaws (measured)</h2>
      <ul className="ebrain-cap-list">
        {flaws.map((flaw) => (
          <li key={flaw.id}>
            {flaw.text} — {flaw.metric}: {flaw.at_1k} at ~1k, {flaw.at_10k} at
            ~10k
          </li>
        ))}
      </ul>
      <p className="ebrain-source">{source}</p>
    </section>
  );
}
