import { test, expect } from "@playwright/test";
import { createHttpEBrainClient } from "../src/lib/ebrain/http-client";
import { EBrainHttpError } from "../src/lib/ebrain/contracts";

test("e-brain HTTP limits preserve project and bearer identity", async () => {
  const originalFetch = globalThis.fetch;
  const requests: { url: string; options?: RequestInit }[] = [];
  globalThis.fetch = async (input, options) => {
    requests.push({ url: String(input), options });
    return Response.json({ memory_count: 7 });
  };
  try {
    const client = createHttpEBrainClient(
      "http://127.0.0.1:3100/",
      "test-token-placeholder",
    );
    const limits = await client.getLimits("project with spaces");
    expect(limits.memory_count).toBe(7);
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(
      "http://127.0.0.1:3100/v1/ebrain/limits?project=project%20with%20spaces",
    );
    expect(requests[0].options?.method).toBe("GET");
    expect(new Headers(requests[0].options?.headers).get("Authorization")).toBe(
      "Bearer test-token-placeholder",
    );
    expect(new Headers(requests[0].options?.headers).get("Content-Type")).toBe(
      "application/json",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("e-brain HTTP failures keep their status and never become empty success", async () => {
  const originalFetch = globalThis.fetch;
  try {
    const client = createHttpEBrainClient("http://127.0.0.1:3100", "");
    for (const status of [401, 403, 404, 500]) {
      globalThis.fetch = async () =>
        new Response("request rejected", { status });
      await expect(client.getLimits()).rejects.toMatchObject({
        name: "EBrainHttpError",
        status,
        message: "request rejected",
      });
    }
    globalThis.fetch = async () => {
      throw new TypeError("connection unavailable");
    };
    await expect(client.getLimits()).rejects.toThrow("connection unavailable");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("e-brain human action transport encodes targets and waits for acceptance", async () => {
  const originalFetch = globalThis.fetch;
  const requests: { url: string; method?: string; body: unknown }[] = [];
  globalThis.fetch = async (input, options) => {
    requests.push({
      url: String(input),
      method: options?.method,
      body: JSON.parse(String(options?.body)),
    });
    return Response.json({ ok: true });
  };
  try {
    const client = createHttpEBrainClient(
      "http://127.0.0.1:3100",
      "test-human-placeholder",
    );
    await client.approveHeal("op/with spaces", 42);
    await client.confirmPair("c:a", "c:b", 43);
    await client.splitPair("c:a", "c:b", 44);
    expect(requests).toEqual([
      {
        url: "http://127.0.0.1:3100/v1/ebrain/heal/op%2Fwith%20spaces/approve",
        method: "POST",
        body: { ts: 42 },
      },
      {
        url: "http://127.0.0.1:3100/v1/ebrain/pairs/confirm",
        method: "POST",
        body: { project_id: "one-for-all", a: "c:a", b: "c:b", ts: 43 },
      },
      {
        url: "http://127.0.0.1:3100/v1/ebrain/pairs/split",
        method: "POST",
        body: { project_id: "one-for-all", a: "c:a", b: "c:b", ts: 44 },
      },
    ]);
    globalThis.fetch = async () =>
      new Response("human token required", { status: 403 });
    await expect(client.approveHeal("op", 45)).rejects.toBeInstanceOf(
      EBrainHttpError,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
