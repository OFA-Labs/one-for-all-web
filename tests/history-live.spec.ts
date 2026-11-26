import { test, expect, type Page, type Route } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { apiDetail, ITEMS } from "./fixtures/history-api";
import type { ApiItem } from "../src/lib/history/view-model";

type Logged = { path: string; params: Record<string, string> };
type Reply = {
  status?: number;
  body: unknown;
  headers?: Record<string, string>;
};
type Handler = (req: Logged) => Reply | undefined;

const taskButton = (page: Page, title: string) =>
  page.getByRole("button", {
    name: `Open task details for ${title}`,
    exact: true,
  });
const period = (page: Page) => page.getByTestId("history-period-label");
const envelope = (status: number, code: string): Reply => ({
  status,
  body: { error: { code, message: "x" } },
});

/** Civil-date filtering in Asia/Kolkata, the default zone, for the fixture backend. */
function inRange(item: ApiItem, p: Record<string, string>) {
  const start = Date.parse(`${p.from}T00:00:00+05:30`);
  const end = Date.parse(`${p.to}T00:00:00+05:30`);
  const text = `${item.title} ${item.subtitle} ${item.goal}`.toLowerCase();
  return (
    item.occurred_at >= start &&
    item.occurred_at < end &&
    (!p.q || text.includes(p.q.toLowerCase())) &&
    (!p.status || item.display_status === p.status)
  );
}
function defaults(req: Logged): Reply {
  if (req.path === "/api/history/tasks")
    return {
      body: {
        items: ITEMS.slice(0, 1),
        next_cursor: null,
        total: ITEMS.length,
      },
    };
  if (req.path === "/api/history/history/period") {
    const items = ITEMS.filter((i) => inRange(i, req.params));
    return { body: { items, total: items.length, truncated: false } };
  }
  if (req.path === "/api/history/history/calendar") {
    const days = new Map<
      string,
      { count: number; by_status: Record<string, number> }
    >();
    for (const item of ITEMS.filter((i) => inRange(i, req.params))) {
      const date = new Date(item.occurred_at + 5.5 * 3_600_000)
        .toISOString()
        .slice(0, 10);
      const day = days.get(date) ?? { count: 0, by_status: {} };
      day.count += 1;
      day.by_status[item.display_status] =
        (day.by_status[item.display_status] ?? 0) + 1;
      days.set(date, day);
    }
    return {
      body: { days: [...days].sort().map(([date, d]) => ({ date, ...d })) },
    };
  }
  if (req.path === "/api/history/tasks/sample-pr") return { body: apiDetail() };
  if (req.path === "/api/history/tasks/sample-pr/export")
    return {
      body: {
        schema_version: 1,
        notice: "Read-only task history export. Screenshots are not included.",
      },
      headers: {
        "Content-Disposition": 'attachment; filename="sample-pr.json"',
      },
    };
  return envelope(404, "not_found");
}

/** Switches the page to live mode and serves the History API from fixtures. */
async function goLive(
  page: Page,
  handler: Handler = () => undefined,
  url = "/history",
) {
  const log: Logged[] = [];
  await page.addInitScript(() =>
    localStorage.setItem("one-for-all-history-api", "/api/history"),
  );
  await page.route("**/api/history/**", async (route: Route) => {
    const u = new URL(route.request().url());
    const req = {
      path: u.pathname,
      params: Object.fromEntries(u.searchParams),
    };
    log.push(req);
    const reply = handler(req) ?? defaults(req);
    await route.fulfill({
      status: reply.status ?? 200,
      contentType: "application/json",
      headers: reply.headers,
      body: JSON.stringify(reply.body),
    });
  });
  await page.clock.setFixedTime(new Date("2026-11-16T10:00:00+05:30"));
  await page.goto(url);
  return log;
}
const requests = (log: Logged[], suffix: string) =>
  log.filter((r) => r.path.endsWith(suffix));

test("live mode reads only /api/history, labels itself, and hydrates cleanly", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  const external: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.origin !== "http://127.0.0.1:3100" || u.pathname.startsWith("/v1/"))
      external.push(r.url());
  });
  const log = await goLive(page);
  await expect(period(page)).toContainText("16 November 2026");
  await expect(taskButton(page, "A gentle nudge for PR #142")).toBeVisible();
  await expect(taskButton(page, "ML engineer roles in NCR")).toBeVisible();
  await expect(page.locator(".hc-sidebar-bottom span")).toHaveText(
    "Your history",
  );
  await expect(page.locator(".hc-record-count")).toHaveText("2 tasks");
  await expect(page.locator(".hc-relative-day")).toHaveText("Today");
  // The first request discovers the latest activity; the period and dots follow, unfiltered.
  expect(log[0]).toEqual({
    path: "/api/history/tasks",
    params: { limit: "1", sort: "newest" },
  });
  expect(requests(log, "/period").at(-1)?.params).toEqual({
    from: "2026-11-16",
    to: "2026-11-17",
    tz: "Asia/Kolkata",
  });
  expect(requests(log, "/calendar").at(-1)?.params).toEqual({
    from: "2026-11-01",
    to: "2026-12-13",
    tz: "Asia/Kolkata",
  });
  // Dots come from the calendar endpoint, not from the visible page.
  await expect(
    page.getByRole("button", { name: "Select 15 November 2026" }),
  ).toHaveClass(/has-events/);
  await expect(
    page.getByRole("button", { name: "Select 14 November 2026" }),
  ).not.toHaveClass(/has-events/);
  // Live filter list also offers statuses the preview never shows.
  await expect(page.locator("#hc-status option")).toContainText([
    "Cancelled",
    "Error",
  ]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test("search and status filters become query parameters", async ({ page }) => {
  const log = await goLive(page);
  await expect(taskButton(page, "A gentle nudge for PR #142")).toBeVisible();
  await page.getByLabel("Filter history by status").selectOption("Verified");
  await expect(taskButton(page, "ML engineer roles in NCR")).toHaveCount(0);
  await expect
    .poll(() => requests(log, "/period").at(-1)?.params.status)
    .toBe("Verified");
  await page.getByLabel("Search task history").fill("gentle");
  await expect
    .poll(() => requests(log, "/period").at(-1)?.params.q)
    .toBe("gentle");
  await expect(taskButton(page, "A gentle nudge for PR #142")).toBeVisible();
  await page.getByLabel("Search task history").fill("no-such-task");
  await expect(
    page.getByRole("heading", {
      name: "Nothing matches this search.",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(taskButton(page, "ML engineer roles in NCR")).toBeVisible();
  expect(requests(log, "/period").at(-1)?.params.status).toBeUndefined();
  expect(requests(log, "/period").at(-1)?.params.q).toBeUndefined();
});

test("a failed load shows an honest error and Try again recovers", async ({
  page,
}) => {
  let failures = 1;
  const log = await goLive(page, (req) =>
    req.path.endsWith("/period") && failures-- > 0
      ? envelope(503, "service_unavailable")
      : undefined,
  );
  // (Next also renders its own role=alert route announcer, so scope to the History panel.)
  const alert = page.locator(".hc-empty-period[role=alert]");
  await expect(alert).toContainText("Couldn’t load history.");
  await expect(alert).toContainText("History isn’t reachable");
  // Never falls back to sample data that would look like real history.
  await expect(taskButton(page, "A gentle nudge for PR #142")).toHaveCount(0);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(taskButton(page, "A gentle nudge for PR #142")).toBeVisible();
  expect(requests(log, "/period").length).toBeGreaterThanOrEqual(2);
});

test("a failing day-marker request does not blank the calendar", async ({
  page,
}) => {
  await goLive(page, (req) =>
    req.path.endsWith("/calendar")
      ? envelope(503, "service_unavailable")
      : undefined,
  );
  await expect(taskButton(page, "A gentle nudge for PR #142")).toBeVisible();
  await expect(page.getByText("Task-day markers couldn’t load.")).toBeVisible();
});

test("a truncated period says how many tasks are not shown", async ({
  page,
}) => {
  await goLive(page, (req) =>
    req.path.endsWith("/period")
      ? { body: { items: ITEMS.slice(0, 1), total: 503, truncated: true } }
      : undefined,
  );
  await expect(
    page.getByRole("heading", { name: "+502 more tasks in this period." }),
  ).toBeVisible();
  await expect(page.locator(".hc-record-count")).toContainText("+502 more");
});

test("an empty history starts on today with an honest empty state", async ({
  page,
}) => {
  await goLive(page, (req) => {
    if (req.path === "/api/history/tasks")
      return { body: { items: [], next_cursor: null, total: 0 } };
    if (req.path.endsWith("/period"))
      return { body: { items: [], total: 0, truncated: false } };
    if (req.path.endsWith("/calendar")) return { body: { days: [] } };
  });
  await expect(period(page)).toContainText("16 November 2026");
  await expect(
    page.getByRole("heading", { name: "No tasks in this period." }),
  ).toBeVisible();
});

test("changing the time zone and view refetches with the right ranges", async ({
  page,
}) => {
  const log = await goLive(page);
  await expect(taskButton(page, "A gentle nudge for PR #142")).toBeVisible();
  await page.getByLabel("History time zone").selectOption("UTC");
  await expect
    .poll(() => requests(log, "/period").at(-1)?.params.tz)
    .toBe("UTC");
  await expect
    .poll(() => requests(log, "/calendar").at(-1)?.params.tz)
    .toBe("UTC");
  await page.getByRole("button", { name: "Month", exact: true }).click();
  await expect
    .poll(() => requests(log, "/period").at(-1)?.params)
    .toMatchObject({
      from: "2026-11-01",
      to: "2026-12-13",
    });
  const periodCount = requests(log, "/period").length;
  await page.getByRole("button", { name: "Year", exact: true }).click();
  await expect
    .poll(() => requests(log, "/calendar").at(-1)?.params)
    .toMatchObject({
      from: "2026-01-01",
      to: "2027-01-01",
    });
  expect(requests(log, "/period")).toHaveLength(periodCount); // the year view needs only day counts
  await expect(page.locator(".hc-record-count")).toHaveText("3 tasks");
});

test("a task opens a read-only audit record that can be exported", async ({
  page,
}) => {
  const log = await goLive(page);
  const url = page.url();
  await taskButton(page, "A gentle nudge for PR #142").click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", {
      level: 1,
      name: "A gentle nudge for PR #142",
    }),
  ).toBeVisible();
  expect(log.some((r) => r.path === "/api/history/tasks/sample-pr")).toBe(true);
  await expect(
    dialog.getByText(
      "Fictional demo record. No real website or account was used.",
    ),
  ).toBeVisible();
  for (const name of [
    "Frozen plan",
    "Evidence",
    "Side-effect ledger",
    "Approvals",
    "Activity timeline",
  ])
    await expect(
      dialog.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  await expect(
    dialog.getByText("Verified — the created item was read back.").first(),
  ).toBeVisible();
  await expect(dialog.getByText("Frozen at approval.")).toBeVisible();
  await expect(
    dialog.getByText("Read PR #142 in acme/voice-kit"),
  ).toBeVisible();
  await expect(dialog.getByText("click acknowledged")).toBeVisible();
  await expect(dialog.getByText("Immutable")).toBeVisible();
  await dialog.getByText("Exact approved text").click();
  await expect(
    dialog.getByText("Hey team, PR #142 is ready for review."),
  ).toBeVisible();
  const link = dialog.getByRole("link", { name: "Open the verified result" });
  await expect(link).toHaveAttribute(
    "href",
    "https://slack.test/archives/sample",
  );
  await expect(link).toHaveAttribute("rel", /noopener/);
  // Preview-only copy never appears on a live record.
  await expect(
    dialog.getByRole("button", { name: "Download sample summary" }),
  ).toHaveCount(0);
  await expect(dialog.getByText("Start an interactive version")).toHaveCount(0);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);

  const download = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "Download audit record", exact: true })
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("sample-pr.json");
  expect(
    JSON.parse(readFileSync((await file.path())!, "utf8")).schema_version,
  ).toBe(1);
  expect(
    log.some((r) => r.path === "/api/history/tasks/sample-pr/export"),
  ).toBe(true);

  await page
    .getByRole("button", { name: "Close task details", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(url);
});

test("the record never shows internals, tokens or storage paths", async ({
  page,
}) => {
  await goLive(page);
  await taskButton(page, "A gentle nudge for PR #142").click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Evidence" }),
  ).toBeVisible();
  const text = await page.locator("body").innerText();
  const html = await page.content();
  for (const forbidden of [
    "storage_key",
    "storage_path",
    "content_hash",
    "search_text",
    "Bearer ",
    "HISTORY_API_TOKEN",
  ]) {
    expect(text, forbidden).not.toContain(forbidden);
    expect(html, forbidden).not.toContain(forbidden);
  }
});

test("/tasks/<id> shows the stored record; a missing id is an honest 404", async ({
  page,
}) => {
  await goLive(page, undefined, "/tasks/sample-pr");
  await expect(
    page.getByRole("heading", { level: 1, name: "A gentle nudge for PR #142" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Frozen plan", exact: true }),
  ).toBeVisible();
  await page.goto("/tasks/does-not-exist");
  await expect(
    page.getByRole("heading", { name: "Task not found." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to History" }),
  ).toBeVisible();
});

test("local interactive previews never go through History", async ({
  page,
}) => {
  const log = await goLive(page, undefined, "/tasks/preview-pr");
  await expect(
    page.getByRole("heading", { name: "This preview task isn’t in memory." }),
  ).toBeVisible();
  expect(log.filter((r) => r.path.includes("preview-pr"))).toEqual([]);
});

test.describe("preview mode (the default)", () => {
  test("makes no History requests and shows the sample workspace", async ({
    page,
  }) => {
    const history: string[] = [];
    page.on("request", (r) => {
      if (new URL(r.url()).pathname.startsWith("/api/history"))
        history.push(r.url());
    });
    await page.clock.setFixedTime(new Date("2026-11-16T10:00:00+05:30"));
    await page.goto("/history");
    await expect(period(page)).toContainText("16 November 2026");
    await expect(taskButton(page, "A gentle nudge for PR #142")).toBeVisible();
    await expect(page.locator(".hc-sidebar-bottom span")).toHaveText(
      "Sample workspace",
    );
    await expect(page.locator(".hc-record-count")).toHaveText("2 sample tasks");
    await expect(page.locator("#hc-status option")).not.toContainText([
      "Cancelled",
    ]);
    expect(history).toEqual([]);
  });

  test("an override that is not a same-origin /api/history path is ignored", async ({
    page,
  }) => {
    const outside: string[] = [];
    page.on("request", (r) => {
      const u = new URL(r.url());
      if (u.origin !== "http://127.0.0.1:3100") outside.push(r.url());
    });
    await page.addInitScript(() =>
      localStorage.setItem("one-for-all-history-api", "http://127.0.0.1:8765"),
    );
    await page.clock.setFixedTime(new Date("2026-11-16T10:00:00+05:30"));
    await page.goto("/history");
    await expect(page.locator(".hc-sidebar-bottom span")).toHaveText(
      "Sample workspace",
    );
    expect(outside).toEqual([]);
  });
});
