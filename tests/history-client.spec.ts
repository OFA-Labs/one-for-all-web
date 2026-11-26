import { test, expect } from "@playwright/test";
import {
  createHistoryClient,
  sameOriginHistoryPath,
} from "../src/lib/history/client";
import { HistoryHttpError } from "../src/lib/history/contracts";
import { createHttpHistoryClient } from "../src/lib/history/http-client";
import { apiDetail, apiItem, ITEMS } from "./fixtures/history-api";

type Call = { url: URL; init?: RequestInit };
const originalFetch = globalThis.fetch;
test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

function stub(respond: (call: Call) => Response | Promise<Response>) {
  const calls: Call[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call = { url: new URL(String(input), "http://127.0.0.1:3100"), init };
    calls.push(call);
    return respond(call);
  }) as typeof fetch;
  return calls;
}
const client = () => createHttpHistoryClient("/api/history/");

test("list requests encode only meaningful params and send no credentials", async () => {
  const calls = stub(() =>
    Response.json({ items: ITEMS, next_cursor: "abc", total: 3 }),
  );
  const page = await client().listTasks({
    q: "a b&c",
    status: "Verified",
    tz: "America/New_York",
    limit: 3,
    sort: "oldest",
    includeSample: false,
  });
  expect(calls).toHaveLength(1);
  const { url, init } = calls[0];
  expect(url.pathname).toBe("/api/history/tasks");
  expect(Object.fromEntries(url.searchParams)).toEqual({
    q: "a b&c",
    status: "Verified",
    tz: "America/New_York",
    limit: "3",
    sort: "oldest",
    include_sample: "0",
  });
  expect(init?.method).toBe("GET");
  expect(init?.cache).toBe("no-store");
  const headers = new Headers(init?.headers);
  expect(headers.get("Authorization")).toBeNull();
  expect([...headers.keys()]).toEqual(["accept"]);
  expect(page.nextCursor).toBe("abc");
  expect(page.total).toBe(3);
  expect(page.items[0]).toMatchObject({
    id: "sample-pr",
    status: "Verified",
    occurredAt: ITEMS[0].occurred_at,
    durationMs: 45 * 60_000,
    isSample: true,
    resultUrl: "https://slack.test/archives/sample",
  });
});

test("empty and 'all' filters are omitted", async () => {
  const calls = stub(() =>
    Response.json({ items: [], next_cursor: null, total: 0 }),
  );
  await client().listTasks({ q: "", status: "all", includeSample: true });
  expect([...calls[0].url.searchParams.keys()]).toEqual([]);
  expect(calls[0].url.search).toBe("");
});

test("period and calendar requests carry the civil range and zone", async () => {
  const calls = stub(({ url }) =>
    url.pathname.endsWith("/period")
      ? Response.json({ items: [apiItem()], total: 1, truncated: true })
      : Response.json({
          days: [
            {
              date: "2026-11-16",
              count: 2,
              by_status: { Verified: 1, Paused: 1 },
            },
          ],
        }),
  );
  const range = {
    from: "2026-11-16",
    to: "2026-11-17",
    tz: "Asia/Kolkata",
    q: "pr",
    status: "Verified",
  };
  const period = await client().getPeriod(range);
  const calendar = await client().getCalendar(range);
  expect(calls.map((c) => c.url.pathname)).toEqual([
    "/api/history/history/period",
    "/api/history/history/calendar",
  ]);
  for (const call of calls)
    expect(Object.fromEntries(call.url.searchParams)).toEqual({
      from: "2026-11-16",
      to: "2026-11-17",
      tz: "Asia/Kolkata",
      q: "pr",
      status: "Verified",
    });
  expect(period).toMatchObject({ total: 1, truncated: true });
  expect(calendar.days).toEqual([
    { date: "2026-11-16", count: 2, byStatus: { Verified: 1, Paused: 1 } },
  ]);
});

test("detail maps the audit record and encodes the id", async () => {
  const calls = stub(() => Response.json(apiDetail()));
  const detail = await client().getTask("a/b c");
  expect(calls[0].url.pathname).toBe("/api/history/tasks/a%2Fb%20c");
  expect(detail.task).toMatchObject({
    id: "sample-pr",
    status: "Verified",
    revision: 1,
    attempt: 1,
  });
  expect(detail.plan.steps).toHaveLength(2);
  expect(detail.evidence).toMatchObject({
    tier: "A",
    itemId: "slack-msg-sample-142",
  });
  expect(detail.ledger[0]).toMatchObject({
    action: "send_message",
    state: "verified",
  });
  expect(detail.ledger[0].transitions.map((t) => t.to)).toEqual([
    "intent",
    "committed",
    "verified",
  ]);
  expect(detail.approvals[0]).toMatchObject({
    approvalId: "sample-pr:ap:1",
    decision: "approved",
  });
});

test("export returns the response as a blob, not parsed JSON", async () => {
  const calls = stub(
    () =>
      new Response('{"schema_version":1}', {
        headers: { "Content-Type": "application/json" },
      }),
  );
  const blob = await client().exportTask("sample-pr");
  expect(calls[0].url.pathname).toBe("/api/history/tasks/sample-pr/export");
  expect(await blob.text()).toBe('{"schema_version":1}');
});

test("failures keep their status and code and never become empty success", async () => {
  for (const [status, code] of [
    [400, "invalid_param"],
    [401, "unauthorized"],
    [404, "not_found"],
    [503, "service_unavailable"],
  ] as const) {
    stub(() => Response.json({ error: { code, message: "nope" } }, { status }));
    const error = await client()
      .getTask("x")
      .catch((e) => e);
    expect(error).toBeInstanceOf(HistoryHttpError);
    expect(error).toMatchObject({ status, code });
  }
  stub(() => new Response("<html>bad gateway</html>", { status: 502 }));
  expect(
    await client()
      .listTasks({})
      .catch((e) => e),
  ).toMatchObject({
    status: 502,
    code: "request_failed",
  });
  stub(() => new Response("not json", { status: 200 }));
  expect(
    await client()
      .listTasks({})
      .catch((e) => e),
  ).toMatchObject({
    status: 200,
    code: "invalid_response",
  });
});

test("a network failure is an HistoryHttpError with status 0; an abort passes through", async () => {
  globalThis.fetch = (async () => {
    throw new TypeError("fetch failed");
  }) as typeof fetch;
  expect(
    await client()
      .listTasks({})
      .catch((e) => e),
  ).toMatchObject({
    status: 0,
    code: "service_unavailable",
  });
  const controller = new AbortController();
  globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
    await new Promise((_, reject) =>
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError")),
      ),
    );
    return new Response();
  }) as typeof fetch;
  const pending = client()
    .listTasks({}, controller.signal)
    .catch((e) => e);
  controller.abort();
  const error = await pending;
  expect(error).not.toBeInstanceOf(HistoryHttpError);
  expect((error as Error).name).toBe("AbortError");
});

test("only same-origin /api/history paths select live mode", () => {
  for (const ok of ["/api/history", "/api/history/", "/api/history/v2"])
    expect(sameOriginHistoryPath(ok), ok).toBe(ok.replace(/\/+$/, ""));
  for (const bad of [
    "http://127.0.0.1:8765",
    "https://evil.example/api/history",
    "//evil.example/api/history",
    "/v1",
    "/api/historyx",
    "/api/history/../x",
    "/api/history//x",
    "/api/history?x=1",
    "/api/history\\x",
    "",
    null,
    undefined,
  ])
    expect(
      sameOriginHistoryPath(bad as string | null | undefined),
      String(bad),
    ).toBeNull();
  expect(createHistoryClient(null).mode).toBe("preview");
  expect(createHistoryClient("/api/history").mode).toBe("live");
});
