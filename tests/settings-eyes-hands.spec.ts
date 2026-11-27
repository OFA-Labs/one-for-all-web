import { test, expect, type Page } from "@playwright/test";

type Patch = Record<string, Record<string, unknown>>;

/** A paired fake companion with OFA's brain on. Never touches the real desktop. */
async function companion(page: Page, reasoningCanSee = false) {
  const saved: Patch[] = [];
  let previews = 0;
  const view = {
    settings: {
      eyes: { mode: "local", model: "qwen/qwen3.8-27b", whole_screen: true },
      hands: { system_controls: true, answer_calls: true },
      voice: { reply_language: "en" },
    },
    eyes: {
      mode: "local",
      model: null,
      active: "local",
      sees_images: false,
      reasoning_can_see: reasoningCanSee,
      note: null,
    },
    always_ask: ["Sending, posting, sharing, forwarding or commenting"],
  };
  await page.routeWebSocket("ws://127.0.0.1:8767/**", (ws) => {
    ws.onMessage(() =>
      ws.send(
        JSON.stringify({
          protocol: "ofa.voice.v1",
          type: "snapshot",
          payload: { state: "IDLE" },
        }),
      ),
    );
  });
  await page.route("http://127.0.0.1:8767/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = route.request().postDataJSON();
    let result: object = {};
    if (path === "/v1/pairing") result = { request_id: "r", fingerprint: "k" };
    if (path === "/v1/pairing/r") result = { state: "approved", grant_id: "g" };
    if (path === "/v1/challenge") result = { challenge_id: "c", proof: "p" };
    if (path === "/v1/session") result = { token: "fixture" };
    if (path === "/v1/ticket") result = { ticket: "t" };
    if (path === "/v1/apps") result = [];
    if (path === "/v1/desktop/status") result = { pending: null };
    if (path === "/v1/ofa/settings") {
      if (body) {
        saved.push(body);
        for (const [section, values] of Object.entries(body as Patch))
          Object.assign(
            (view.settings as Record<string, Record<string, unknown>>)[section],
            values,
          );
        view.eyes.mode = view.settings.eyes.mode;
        view.eyes.active = view.settings.eyes.mode;
      }
      result = view;
    }
    if (path === "/v1/eyes/preview") {
      previews++;
      result = {
        image:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        masked: "1 regions masked, 12 marks",
        marks: 12,
        windows: ["Test Pad"],
        sources: ["uia", "ocr"],
        sent_anywhere: false,
      };
    }
    await route.fulfill({ json: result });
  });
  await page.goto("/settings?tab=connection");
  await page
    .getByRole("button", { name: "Connect computer", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Computer connected", exact: true }),
  ).toBeDisabled();
  return { saved, previews: () => previews };
}

test("eyes offers three modes, saves the choice and previews a masked view", async ({
  page,
}) => {
  const fake = await companion(page);
  await page.getByRole("tab", { name: "Eyes" }).click();
  const eyes = page.getByRole("region", { name: "Eyes" });
  await expect(eyes.getByRole("radio", { name: /Local only/ })).toBeChecked();
  await expect(
    eyes.getByRole("radio", { name: /Same as reasoning model/ }),
  ).toBeDisabled();
  await eyes.getByRole("radio", { name: /Separate eyes model/ }).click();
  await expect(
    eyes.getByRole("radio", { name: /Separate eyes model/ }),
  ).toBeChecked();
  await expect.poll(() => fake.saved.length).toBe(1);
  expect(fake.saved[0]).toEqual({ eyes: { mode: "separate" } });
  await expect(eyes.getByLabel("Eyes model", { exact: true })).toHaveValue(
    "qwen/qwen3.8-27b",
  );
  await eyes.getByRole("button", { name: "Test eyes" }).click();
  await expect(eyes.getByRole("img")).toBeVisible();
  await expect(eyes).toContainText("12 marks from 1 windows");
  await expect(eyes).toContainText("1 regions masked");
  expect(fake.previews()).toBe(1);
});

test("hands toggles save to the companion and list what always asks", async ({
  page,
}) => {
  const fake = await companion(page, true);
  await page.getByRole("tab", { name: "Hands" }).click();
  const hands = page.getByRole("region", { name: "Hands" });
  await expect(hands).toContainText("Sending, posting, sharing");
  await hands.getByRole("switch").nth(1).click();
  await expect
    .poll(() => fake.saved.at(-1))
    .toEqual({
      hands: { answer_calls: false },
    });
  await page.getByRole("tab", { name: "Voice" }).click();
  await page.getByLabel("OFA speaks its replies in").selectOption("hinglish");
  await expect
    .poll(() => fake.saved.at(-1))
    .toEqual({
      voice: { reply_language: "hinglish" },
    });
});
