import { test, expect } from "@playwright/test";
import { webcrypto } from "node:crypto";

test("desktop scope and exact-action approval UI send only bound decisions", async ({
  page,
}) => {
  let pending: object | null = null;
  let windowControls = false;
  const decisions: Record<string, unknown>[] = [];
  const scopes: Record<string, unknown>[] = [];
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
    if (path === "/v1/pairing")
      result = { request_id: "r", fingerprint: "test" };
    if (path === "/v1/pairing/r") result = { state: "approved", grant_id: "g" };
    if (path === "/v1/challenge")
      result = { challenge_id: "c", proof: "proof" };
    if (path === "/v1/session") result = { token: "fixture" };
    if (path === "/v1/ticket") result = { ticket: "t" };
    if (path === "/v1/apps") result = [{ id: "one", name: "WhatsApp" }];
    if (path === "/v1/desktop/status")
      result = { window_controls: windowControls, pending };
    if (path === "/v1/desktop/scopes") {
      scopes.push(body);
      result = { request_id: "scope" };
    }
    if (path === "/v1/desktop/scopes/scope") {
      windowControls = true;
      result = { state: "approved" };
    }
    if (path === "/v1/apps/refresh") {
      pending = {
        task_id: "task-one",
        state: "approval",
        approval: {
          id: "approval-one",
          reading_hash: "exact-version-hash",
          exact_action: {
            operation: "file.write",
            target: { path: "C:/approved/Notes.md" },
            text: "Exact Case\nApproved bytes",
          },
          reading: { facts: { text: "before" } },
        },
      };
      result = [{ id: "one", name: "WhatsApp" }];
    }
    if (path === "/v1/desktop/decision") {
      decisions.push(body);
      pending = null;
      result = { accepted: true };
    }
    await route.fulfill({ json: result });
  });
  await page.goto("/desktop");
  await page
    .getByRole("button", { name: "Connect computer", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Computer connected", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Enable window controls", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Window controls enabled", exact: true }),
  ).toBeDisabled();
  expect(scopes).toEqual([{ kind: "windows" }]);
  await page
    .getByRole("button", { name: "Refresh applications", exact: true })
    .click();
  const card = page.getByRole("region", { name: "Desktop action approval" });
  await expect(card).toContainText("Exact Case");
  await expect(card).toContainText("exact-version-hash");
  expect(decisions).toHaveLength(0);
  await card
    .getByRole("button", { name: "Approve action", exact: true })
    .click();
  await expect.poll(() => decisions.length).toBe(1);
  expect(decisions[0]).toMatchObject({
    task_id: "task-one",
    decision: {
      approval_id: "approval-one",
      reading_hash: "exact-version-hash",
      approve: true,
    },
  });
  await expect(card).toHaveCount(0);
});

test("desktop setup is available without preview sign-in and handles an offline companion", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.clear());
  await page.route("http://127.0.0.1:8767/**", (route) => route.abort());
  await page.goto("/desktop");
  await expect(
    page.getByRole("heading", { name: "Desktop Integration" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Connect computer", exact: true })
    .click();
  await expect(
    page.getByText(/Companion unavailable. Start the Windows companion/),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/desktop$/);
});

test("browser pairing proves key possession and survives reload; stop retains and disconnect revokes", async ({
  page,
}) => {
  // Fake companion transport only: this test never approves Windows permissions,
  // opens a microphone or launches a personal application.
  let publicKey: webcrypto.CryptoKey;
  let pairings = 0;
  let sessions = 0;
  let stopped = 0;
  let revoked = 0;
  await page.routeWebSocket("ws://127.0.0.1:8767/**", (ws) => {
    ws.onMessage(() =>
      ws.send(
        JSON.stringify({
          protocol: "ofa.voice.v1",
          type: "snapshot",
          sequence: 1,
          epoch: 0,
          payload: { state: "IDLE" },
        }),
      ),
    );
  });
  await page.route("http://127.0.0.1:8767/**", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204 });
      return;
    }
    const path = new URL(request.url()).pathname;
    const body = request.postDataJSON();
    let result: object = {};
    if (path === "/v1/pairing") {
      pairings++;
      publicKey = await webcrypto.subtle.importKey(
        "jwk",
        body.public_key,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["verify"],
      );
      result = { request_id: "fixture-request", fingerprint: "fixture-key" };
    } else if (path === "/v1/pairing/fixture-request") {
      result = { state: "approved", grant_id: "fixture-grant" };
    } else if (path === "/v1/challenge") {
      result = {
        challenge_id: "fixture-challenge",
        proof: "fixture-browser-key-proof",
      };
    } else if (path === "/v1/session") {
      const verified = await webcrypto.subtle.verify(
        { name: "ECDSA", hash: "SHA-256" },
        publicKey,
        Buffer.from(body.signature, "base64"),
        new TextEncoder().encode("fixture-browser-key-proof"),
      );
      expect(verified).toBe(true);
      sessions++;
      result = { token: "fixture-session", expires_in: 60 };
    } else if (path === "/v1/apps") {
      result = [{ id: "fixture-app", name: "WhatsApp" }];
    } else if (path === "/v1/ticket") {
      result = { ticket: "fixture-one-use-ticket" };
    } else if (path === "/v1/voice/stop") {
      stopped++;
    } else if (path === "/v1/disconnect") {
      revoked++;
    }
    await route.fulfill({ json: result });
  });
  await page.goto("/desktop");
  await page
    .getByRole("button", { name: "Connect computer", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Computer connected", exact: true }),
  ).toBeDisabled();
  expect(pairings).toBe(1);
  await expect(
    page.getByText("1 installed applications indexed"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stop voice", exact: true }).click();
  await expect.poll(() => stopped).toBe(1);
  expect(revoked).toBe(0);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Computer connected", exact: true }),
  ).toBeDisabled();
  expect(pairings).toBe(1);
  expect(sessions).toBeGreaterThanOrEqual(2);
  const privateKeyExtractable = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("ofa-desktop-pairing", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const identity = await new Promise<{ keys: CryptoKeyPair }>((resolve) => {
      const request = db
        .transaction("identity")
        .objectStore("identity")
        .get("browser");
      request.onsuccess = () => resolve(request.result);
    });
    db.close();
    return identity.keys.privateKey.extractable;
  });
  expect(privateKeyExtractable).toBe(false);
  await page
    .getByRole("button", { name: "Disconnect computer", exact: true })
    .click();
  await expect.poll(() => revoked).toBe(1);
  await expect(
    page.getByRole("button", { name: "Connect computer", exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(page.getByRole("status")).toContainText("Not connected");
  expect(pairings).toBe(1);
});
