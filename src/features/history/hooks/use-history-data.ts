"use client";
import type { Filters, HistoryClient } from "@/lib/history/contracts";
import { useLoadable } from "./use-loadable";

type Range = { from: string; to: string; tz: string } & Filters;
const filterKey = (f: Filters) =>
  `${f.q ?? ""}|${f.status ?? "all"}|${f.includeSample === false ? 0 : 1}`;
const rangeKey = (r: Range) => `${r.tz}|${r.from}|${r.to}|${filterKey(r)}`;

/** The newest task's instant (ms), or null for an empty history. Fetched once per client. */
export function useHistoryLatest(client: HistoryClient | null) {
  return useLoadable(client, "latest", async (c, signal) => {
    const page = await c.listTasks({ limit: 1, sort: "newest" }, signal);
    return page.items[0]?.occurredAt ?? null;
  });
}

/** Every task in [from, to): the day/week/month views. Pass null to skip (year view). */
export function useHistoryPeriod(
  client: HistoryClient | null,
  range: Range | null,
) {
  return useLoadable(
    client,
    range && `period|${rangeKey(range)}`,
    (c, signal) => c.getPeriod(range!, signal),
  );
}

/** Per-day counts for the date-picker dots and the year view. Independent of the period. */
export function useHistoryCalendar(
  client: HistoryClient | null,
  range: Range | null,
) {
  return useLoadable(
    client,
    range && `calendar|${rangeKey(range)}`,
    (c, signal) => c.getCalendar(range!, signal),
  );
}

export function useHistoryDetail(
  client: HistoryClient | null,
  id: string | null,
) {
  return useLoadable(client, id && `detail|${id}`, (c, signal) =>
    c.getTask(id!, signal),
  );
}
