import { test, expect } from "@playwright/test";
import { historyRows } from "../src/lib/demo";
import { civilDateInZone } from "../src/lib/history/civil";
import { HistoryHttpError, type Tier } from "../src/lib/history/contracts";
import { createMockHistoryClient } from "../src/lib/history/mock-client";
import { displayStatus, tierCopy } from "../src/lib/history/view-model";
import {
  eventCivilDate,
  eventMinutes,
  eventTime,
  getTodayInKolkata,
  getTodayInZone,
} from "../src/features/history/lib/history-calendar";
import mapping from "./fixtures/status-mapping.json" with { type: "json" };

type Row = {
  state: Parameters<typeof displayStatus>[0];
  tier: Tier;
  evidence_status: Parameters<typeof displayStatus>[2];
  display_status: string | null;
};

test("the status mapping matches the backend's shared fixture row for row", () => {
  const rows = mapping.rows as Row[];
  expect(rows.length).toBeGreaterThan(20);
  for (const row of rows)
    expect(
      displayStatus(row.state, row.tier, row.evidence_status),
      `${row.state}/${row.tier}/${row.evidence_status}`,
    ).toBe(row.display_status);
});

test("Tier D is never verified, whatever the evidence status says", () => {
  for (const evidence of [
    "verified",
    "submitted",
    "held",
    "unknown",
    "none",
  ] as const)
    expect(displayStatus("completed", "D", evidence)).not.toBe("Verified");
  expect(tierCopy("D")).toBe("Worker claim only. Never counts as evidence.");
  expect(tierCopy("B")).toBe("Submitted, not yet confirmed.");
  expect(tierCopy("unknown")).toContain("Do not retry blindly");
});

test("zone-aware dates handle UTC midnight, DST and year boundaries", () => {
  expect(getTodayInKolkata(new Date("2026-11-15T19:00:00Z"))).toBe(
    "2026-11-16",
  );
  expect(getTodayInZone(new Date("2026-12-31T20:00:00Z"), "Asia/Kolkata")).toBe(
    "2027-01-01",
  );
  expect(getTodayInZone(new Date("2026-12-31T20:00:00Z"), "UTC")).toBe(
    "2026-12-31",
  );
  // New York leaves DST on 2026-11-01 06:00Z, so local Nov 1 runs 04:00Z to 05:00Z the next day.
  expect(civilDateInZone("2026-11-01T03:59:00Z", "America/New_York")).toBe(
    "2026-10-31",
  );
  expect(civilDateInZone("2026-11-01T04:00:00Z", "America/New_York")).toBe(
    "2026-11-01",
  );
  expect(civilDateInZone("2026-11-02T04:59:00Z", "America/New_York")).toBe(
    "2026-11-01",
  );
  expect(civilDateInZone("2026-11-02T05:00:00Z", "America/New_York")).toBe(
    "2026-11-02",
  );
  // Timestamps may be ISO strings or epoch ms.
  const ms = Date.parse("2026-11-16T10:24:00+05:30");
  expect(eventCivilDate(ms, "Asia/Kolkata")).toBe("2026-11-16");
  expect(eventCivilDate("2026-11-16T10:24:00+05:30", "UTC")).toBe("2026-11-16");
  expect(eventCivilDate("2026-11-16T01:00:00+05:30", "UTC")).toBe("2026-11-15");
  expect(eventMinutes(ms, "Asia/Kolkata")).toBe(10 * 60 + 24);
  expect(eventMinutes(ms, "UTC")).toBe(4 * 60 + 54);
  expect(eventTime(ms, "Asia/Kolkata")).toMatch(/10:24\s?am/i);
});

test("the preview client reproduces the existing sample records exactly", async () => {
  const client = createMockHistoryClient();
  expect(client.mode).toBe("preview");
  const page = await client.listTasks({ limit: 50 });
  expect(page.total).toBe(historyRows.length);
  const byId = new Map(page.items.map((item) => [item.id, item]));
  for (const row of historyRows) {
    const item = byId.get(row.id)!;
    expect(item.status, row.id).toBe(row.status);
    expect(item.title).toBe(row.title);
    expect(item.occurredAt).toBe(new Date(row.timestamp).getTime());
    expect(item.isSample).toBe(true);
  }
  const minutes = (id: string) => byId.get(id)!.durationMs! / 60_000;
  expect([
    minutes("sample-jobs"),
    minutes("sample-social"),
    minutes("sample-refusal"),
    minutes("sample-pr"),
  ]).toEqual([70, 80, 20, 45]);
});

test("the preview client filters, pages and buckets like the backend", async () => {
  const client = createMockHistoryClient();
  const day = { from: "2026-11-16", to: "2026-11-17", tz: "Asia/Kolkata" };
  expect((await client.getPeriod(day)).items.map((i) => i.id)).toEqual([
    "sample-jobs",
    "sample-pr",
  ]);
  expect(
    (await client.getPeriod({ ...day, status: "Verified" })).items.map(
      (i) => i.id,
    ),
  ).toEqual(["sample-pr"]);
  expect((await client.getPeriod({ ...day, q: "no-such-task" })).total).toBe(0);
  expect(
    (await client.getPeriod({ ...day, q: "NCR" })).items.map((i) => i.id),
  ).toEqual(["sample-jobs"]);
  // 10:24 IST on Nov 16 is still Nov 16 in UTC and New York; 09:42 IST is too.
  expect((await client.getPeriod({ ...day, tz: "UTC" })).total).toBe(2);
  const calendar = await client.getCalendar({
    from: "2026-11-01",
    to: "2026-12-01",
    tz: "Asia/Kolkata",
  });
  expect(calendar.days).toEqual([
    { date: "2026-11-14", count: 2, byStatus: { Paused: 1, Unknown: 1 } },
    {
      date: "2026-11-15",
      count: 3,
      byStatus: { Verified: 1, Submitted: 1, Declined: 1 },
    },
    {
      date: "2026-11-16",
      count: 2,
      byStatus: { Verified: 1, "Needs review": 1 },
    },
  ]);
  const first = await client.listTasks({ limit: 3 });
  const second = await client.listTasks({
    limit: 3,
    cursor: first.nextCursor!,
  });
  const third = await client.listTasks({
    limit: 3,
    cursor: second.nextCursor!,
  });
  expect([first, second, third].map((p) => p.items.length)).toEqual([3, 3, 1]);
  expect(third.nextCursor).toBeNull();
  expect(
    new Set([...first.items, ...second.items, ...third.items].map((i) => i.id))
      .size,
  ).toBe(7);
  expect(
    (await client.listTasks({ limit: 1, sort: "oldest" })).items[0].id,
  ).toBe("sample-unknown");
});

test("the preview client reports a missing task as a 404", async () => {
  const error = await createMockHistoryClient()
    .getTask("nope")
    .catch((e) => e);
  expect(error).toBeInstanceOf(HistoryHttpError);
  expect(error).toMatchObject({ status: 404, code: "not_found" });
  const detail = await createMockHistoryClient().getTask("sample-pr");
  expect(detail.task.isSample).toBe(true);
  expect(detail.plan.steps.length).toBeGreaterThan(0);
});
