import { test, expect } from "@playwright/test";

test("settings shows live companion speech status and no preview-only controls", async ({
  page,
}) => {
  await page.route("http://127.0.0.1:8767/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const result =
      path === "/v1/health"
        ? {
            service: "ofa-desktop",
            version: "0.2.3",
            os: "windows",
            identity_mode: "local-development",
            llm_enabled: false,
            speech: {
              mode: "live",
              language: "en",
              headphones: false,
              command_only: true,
              stt_order: ["deepgram", "gradium"],
              tts_order: ["deepgram", "gradium"],
              deepgram_configured: true,
              gradium_configured: true,
              engine_enabled: false,
            },
          }
        : {};
    await route.fulfill({ json: result });
  });

  await page.goto("/settings?tab=desktop");
  await expect(
    page.getByRole("heading", { name: "Desktop Integration" }),
  ).toBeVisible();
  for (const tab of ["Connection", "Voice", "Eyes", "Hands", "Dictation"])
    await expect(page.getByRole("tab", { name: tab })).toBeVisible();
  await page.getByRole("tab", { name: "Voice" }).click();
  await page.getByRole("button", { name: "Check companion status" }).click();
  await expect(page.getByText(/Deepgram configured/)).toBeVisible();
  await expect(page.getByText(/Gradium configured/)).toBeVisible();
  await page.getByRole("tab", { name: "Connection" }).click();
  await expect(page.getByText("Companion 0.2.3")).toBeVisible();

  const body = await page.locator("body").innerText();
  for (const stale of [
    "Account sign-in and OFA Engine integration are pending",
    "live Slack testing deferred",
    "Fictional profile",
    "Save local preferences",
    "Sample usage",
  ]) {
    expect(body).not.toContain(stale);
  }
});

test("pairing shows a minimal approval card instead of plain status text", async ({
  page,
}) => {
  await page.route("http://127.0.0.1:8767/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const result =
      path === "/v1/health"
        ? {
            version: "0.2.3",
            os: "windows",
            identity_mode: "local-development",
          }
        : path === "/v1/pairing"
          ? { request_id: "pending", fingerprint: "TEST KEY" }
          : path === "/v1/pairing/pending"
            ? { state: "pending" }
            : {};
    await route.fulfill({ json: result });
  });

  await page.goto("/settings?tab=desktop");
  await page
    .getByRole("button", { name: "Connect computer", exact: true })
    .click();
  const card = page.locator("div[role='status']").filter({
    hasText: "Approve on Windows",
  });
  await expect(card).toBeVisible();
  await expect(card).toContainText("TEST KEY");
  await expect(card).toContainText("Nothing is recorded");
});
