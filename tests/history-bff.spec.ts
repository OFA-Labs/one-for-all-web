import { test, expect } from "@playwright/test";
import type { NextRequest } from "next/server";
import { GET, dynamic, runtime } from "../src/app/api/history/[...path]/route";
import * as route from "../src/app/api/history/[...path]/route";

const originalFetch = globalThis.fetch;
const saved = {
  url: process.env.HISTORY_API_URL,
  token: process.env.HISTORY_API_TOKEN,
};
test.afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of [
    ["HISTORY_API_URL", saved.url],
    ["HISTORY_API_TOKEN", saved.token],
  ] as const) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const SERVER_TOKEN = "server-side-secret-token";
function configure() {
  process.env.HISTORY_API_URL = "http://127.0.0.1:8765/";
  process.env.HISTORY_API_TOKEN = SERVER_TOKEN;
}
function stubUpstream(response: () => Response | Promise<Response>) {
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return response();
  }) as typeof fetch;
  return calls;
}
const call = (
  path: string[],
  search = "",
  headers: Record<string, string> = {},
) =>
  GET(
    new Request(
      `http://127.0.0.1:3100/api/history/${path.join("/")}${search}`,
      {
        headers,
      },
    ) as NextRequest,
    { params: Promise.resolve({ path }) },
  );

test("is read-only, dynamic and Node-runtime", () => {
  expect(dynamic).toBe("force-dynamic");
  expect(runtime).toBe("nodejs");
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "HEAD"])
    expect(method in route, method).toBe(false);
});

test("reports 503 when the proxy is not configured, without calling upstream", async () => {
  delete process.env.HISTORY_API_URL;
  delete process.env.HISTORY_API_TOKEN;
  const calls = stubUpstream(() => Response.json({}));
  const response = await call(["tasks"]);
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({
    error: {
      code: "service_unavailable",
      message: "History is not configured.",
    },
  });
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(calls).toHaveLength(0);
});

test("forwards exactly the allowlisted routes with their query strings", async () => {
  configure();
  const calls = stubUpstream(() => Response.json({ ok: true }));
  const cases: [string[], string, string][] = [
    [
      ["tasks"],
      "?limit=3&q=a%20b",
      "http://127.0.0.1:8765/v1/tasks?limit=3&q=a%20b",
    ],
    [["tasks", "sample-pr"], "", "http://127.0.0.1:8765/v1/tasks/sample-pr"],
    [
      ["tasks", "sample-pr", "export"],
      "",
      "http://127.0.0.1:8765/v1/tasks/sample-pr/export",
    ],
    [
      ["history", "calendar"],
      "?from=2026-11-01&to=2026-12-01",
      "http://127.0.0.1:8765/v1/history/calendar?from=2026-11-01&to=2026-12-01",
    ],
    [
      ["history", "period"],
      "?tz=UTC",
      "http://127.0.0.1:8765/v1/history/period?tz=UTC",
    ],
  ];
  for (const [path, search, expected] of cases) {
    expect((await call(path, search)).status, expected).toBe(200);
    expect(calls.at(-1)?.url).toBe(expected);
  }
});

test("anything else is a 404 and never reaches the backend", async () => {
  configure();
  const calls = stubUpstream(() => Response.json({}));
  const blocked = [
    ["v1", "tasks"],
    ["tasks", "x", "y"],
    ["tasks", "x", "events"],
    ["tasks", "x", "artifacts", "y"],
    ["tasks", ".."],
    ["tasks", "."],
    ["tasks", "..", "export"],
    ["tasks", "-leading-dash"],
    ["tasks", "a b"],
    ["tasks", "a\\b"],
    ["tasks", "x".repeat(129)],
    ["history"],
    ["history", "facets"],
    ["history", "me"],
    ["ebrain", "limits"],
    ["tasks", "x", "export", "y"],
  ];
  for (const path of blocked) {
    const response = await call(path);
    expect(response.status, path.join("/")).toBe(404);
    expect((await response.json()).error.code).toBe("not_found");
  }
  expect(calls).toHaveLength(0);
});

test("the bearer token is added server-side and browser credentials are not forwarded", async () => {
  configure();
  const calls = stubUpstream(() => Response.json({}));
  await call(["tasks"], "", {
    Authorization: "Bearer the-browsers-own-token",
    Cookie: "session=secret",
    "X-Forwarded-For": "1.2.3.4",
    Origin: "http://evil.example",
  });
  const headers = new Headers(calls[0].init?.headers);
  expect(headers.get("Authorization")).toBe(`Bearer ${SERVER_TOKEN}`);
  expect(headers.get("Cookie")).toBeNull();
  expect(headers.get("Origin")).toBeNull();
  expect(headers.get("X-Forwarded-For")).toBeNull();
  expect(calls[0].init?.cache).toBe("no-store");
  expect(calls[0].init?.method ?? "GET").toBe("GET");
});

test("only content headers come back; status and body pass through", async () => {
  configure();
  stubUpstream(
    () =>
      new Response('{"schema_version":1}', {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": 'attachment; filename="sample-pr.json"',
          "Set-Cookie": "session=leak",
          "X-Backend-Secret": "nope",
          "Cache-Control": "public, max-age=600",
        },
      }),
  );
  const response = await call(["tasks", "sample-pr", "export"]);
  expect(response.headers.get("Content-Type")).toBe("application/json");
  expect(response.headers.get("Content-Disposition")).toBe(
    'attachment; filename="sample-pr.json"',
  );
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("Set-Cookie")).toBeNull();
  expect(response.headers.get("X-Backend-Secret")).toBeNull();
  expect(await response.text()).toBe('{"schema_version":1}');

  stubUpstream(() =>
    Response.json(
      { error: { code: "not_found", message: "Task not found." } },
      { status: 404 },
    ),
  );
  const missing = await call(["tasks", "nope"]);
  expect(missing.status).toBe(404);
  expect((await missing.json()).error.code).toBe("not_found");
});

test("upstream failures and timeouts become a 503 envelope without leaking details", async () => {
  configure();
  globalThis.fetch = (async () => {
    throw new TypeError("connect ECONNREFUSED 127.0.0.1:8765");
  }) as typeof fetch;
  const response = await call(["tasks"]);
  expect(response.status).toBe(503);
  const text = await response.text();
  expect(JSON.parse(text).error.code).toBe("service_unavailable");
  expect(text).not.toContain("ECONNREFUSED");
  expect(text).not.toContain(SERVER_TOKEN);
});
