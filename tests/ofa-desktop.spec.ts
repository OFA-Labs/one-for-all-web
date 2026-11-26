import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const status = {
  session: {
    session: "awaiting_approval",
    caption: "SEND: kal milte hain → Asha (WhatsApp)",
    mic: true,
    pending: {
      verb: "send",
      payload: "kal milte hain",
      to: ["Asha (WhatsApp)"],
      files: [],
      account: "personal",
    },
  },
  epoch: 3,
  engine: {
    id: "groq",
    model: "openai/gpt-oss-120b",
    vision: false,
    tools: true,
    context: 131072,
    metrics: { calls: 4, input_tokens: 9000, latency_p50_ms: 980 },
  },
  keys: { GROQ_API_KEY: true, DEEPGRAM_API_KEY: true, GRADIUM_API_KEY: true },
  vault: { unlocked: false, items: 2 },
  voice: {
    active: true,
    mode: "command",
    stt_routes: { "hi/command": ["flux", "nova3"] },
  },
  live_calls: { groq: 4 },
  events: [
    { ts: 1764150000, kind: "heard", text: "Asha ko likho kal milte hain" },
  ],
};

async function mockOfa(page: Page) {
  const seen: string[] = [];
  await page.route("http://127.0.0.1:8768/**", async (route) => {
    const url = new URL(route.request().url());
    seen.push(
      `${route.request().method()} ${url.pathname} ${route.request().headers()["authorization"] ?? ""}`,
    );
    const body =
      url.pathname === "/status"
        ? status
        : url.pathname === "/memory"
          ? { mappings: { "my manager": "Priya Shah" }, profile: {} }
          : url.pathname === "/audit"
            ? {
                entries: [
                  {
                    ts: 1764150000,
                    kind: "approval",
                    tier: 2,
                    result: "pending",
                  },
                ],
                chain_ok: true,
              }
            : url.pathname === "/command"
              ? {
                  status: "done",
                  spoken: "Notepad is open. Completed. Anything else?",
                  actions: [],
                }
              : { ok: true, deleted: true };
    await route.fulfill({
      json: body,
      headers: { "access-control-allow-origin": "*" },
    });
  });
  return seen;
}

test("without a token the page explains how to connect", async ({ page }) => {
  await page.goto("/ofa");
  await expect(page.getByTestId("ofa-connect")).toBeVisible();
  await expect(page.getByText("python.exe -m ofa")).toBeVisible();
});

test("connected dashboard shows session, pending approval and engine", async ({
  page,
}) => {
  const seen = await mockOfa(page);
  await page.goto("/ofa#port=8768&token=test-token");
  await expect(
    page.getByRole("heading", { name: "Waiting for your spoken yes or no" }),
  ).toBeVisible();
  await expect(page.getByText("kal milte hain", { exact: true })).toBeVisible();
  await expect(page.locator(".ofa-pending")).toContainText("→ Asha (WhatsApp)");
  await expect(page.getByText(/Clicking can’t approve/)).toBeVisible();
  await expect(page.getByText("groq · openai/gpt-oss-120b")).toBeVisible();
  await expect(page.getByText(/no \(uses accessibility/)).toBeVisible();
  await expect(page.getByText("“my manager” → Priya Shah")).toBeVisible();
  // token travels as a bearer header and is removed from the address bar
  expect(seen.some((s) => s.includes("Bearer test-token"))).toBe(true);
  expect(page.url()).not.toContain("token=");
});

test("typed request posts to the local API", async ({ page }) => {
  await mockOfa(page);
  await page.goto("/ofa#port=8768&token=test-token");
  await page.getByRole("textbox", { name: "Request" }).fill("open notepad");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(
    page.getByText("Notepad is open. Completed. Anything else? (done)"),
  ).toBeVisible();
});

test("ofa dashboard has no serious accessibility violations", async ({
  page,
}) => {
  await mockOfa(page);
  await page.goto("/ofa#port=8768&token=test-token");
  await expect(page.getByText("Connected", { exact: true })).toBeVisible();
  const results = await new AxeBuilder({ page }).include(".ofa-desk").analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious.map((v) => v.id)).toEqual([]);
});
