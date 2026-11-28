import { test, expect, type Page } from "@playwright/test";

/** A paired fake companion holding one resume and a locked vault. Never touches the real computer. */
async function companion(page: Page) {
  const saved: Record<string, unknown>[] = [];
  const added: Record<string, unknown>[] = [];
  const documents = new Map([["resume", "# Resume\n- Full name: Asha Rao"]]);
  let unlocked = false;
  const items: Record<string, unknown>[] = [];
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
    if (path === "/v1/corpus/open")
      result = {
        documents: [...documents].map(([name, text]) => ({
          name,
          bytes: text.length,
        })),
      };
    if (path === "/v1/corpus/open/resume")
      result = { name: "resume", text: documents.get("resume") };
    if (path === "/v1/corpus/open/save") {
      saved.push(body);
      documents.set(body.name, body.text);
    }
    if (path.startsWith("/v1/corpus/private")) {
      if (path.endsWith("/unlock")) unlocked = true;
      if (path.endsWith("/add")) {
        added.push(body);
        items.push({
          handle: "vault:D3/gmail/password#1",
          class: "D3",
          service: body.service,
          label: body.label,
          allowed_targets: [body.site],
          expected_account: body.account ?? "",
          revoked: false,
        });
      }
      result = { unlocked, items };
    }
    await route.fulfill({ json: result });
  });
  await page.goto("/e-brain");
  const corpus = page.getByRole("region", { name: "Info corpus" });
  await corpus
    .getByRole("button", { name: "Connect computer", exact: true })
    .click();
  await expect(
    corpus.getByRole("tab", { name: "Use without consent" }),
  ).toBeVisible();
  return { corpus, saved, added };
}

test("open documents can be read, edited and saved", async ({ page }) => {
  const { corpus, saved } = await companion(page);
  await corpus.getByRole("button", { name: "resume", exact: true }).click();
  const editor = corpus.getByLabel("Contents (Markdown)");
  await expect(editor).toHaveValue(/Asha Rao/);
  await editor.fill("# Resume\n- Full name: Asha R");
  await corpus.getByRole("button", { name: "Save document" }).click();
  await expect(corpus.getByRole("status")).toContainText("Saved");
  expect(saved).toEqual([
    { name: "resume", text: "# Resume\n- Full name: Asha R" },
  ]);
});

test("private items need unlocking, are added once and never shown", async ({
  page,
}) => {
  const { corpus, added } = await companion(page);
  await corpus.getByRole("tab", { name: "Private" }).click();
  const save = corpus.getByRole("button", { name: "Save private item" });
  await expect(save).toBeDisabled();
  await corpus.getByRole("button", { name: "Unlock", exact: true }).click();
  await expect(save).toBeEnabled();
  await corpus.getByLabel("Service", { exact: true }).fill("gmail");
  await corpus.getByLabel("Item name").fill("password");
  const secret = corpus.getByLabel("Secret value");
  await expect(secret).toHaveAttribute("type", "password");
  await secret.fill("not-a-real-secret");
  await corpus
    .getByLabel("Website where it may be used")
    .fill("https://accounts.google.com");
  await save.click();
  await expect(
    corpus.getByRole("list", { name: "Private items" }),
  ).toContainText("gmail · password");
  await expect(secret).toHaveValue("");
  expect(added[0]).toMatchObject({ value: "not-a-real-secret" });
  // Left empty, the field is not sent, so an older companion still accepts the item.
  expect(added[0]).not.toHaveProperty("account");
  expect(await corpus.innerText()).not.toContain("not-a-real-secret");
});

test("a private item can be tied to one account", async ({ page }) => {
  const { corpus, added } = await companion(page);
  await corpus.getByRole("tab", { name: "Private" }).click();
  await corpus.getByRole("button", { name: "Unlock", exact: true }).click();
  await corpus.getByLabel("Service", { exact: true }).fill("gmail");
  await corpus.getByLabel("Item name").fill("password");
  await corpus.getByLabel("Secret value").fill("not-a-real-secret");
  await corpus
    .getByLabel("Website where it may be used")
    .fill("https://accounts.google.com");
  const account = corpus.getByLabel("Account it belongs to (optional)");
  await account.fill("  asha@example.test ");
  await corpus.getByRole("button", { name: "Save private item" }).click();
  await expect(
    corpus.getByRole("list", { name: "Private items" }),
  ).toContainText("Only for asha@example.test");
  expect(added[0]).toMatchObject({ account: "asha@example.test" });
  await expect(account).toHaveValue("");
});

test("without a companion the section asks to connect", async ({ page }) => {
  await page.route("http://127.0.0.1:8767/**", (route) => route.abort());
  await page.goto("/e-brain");
  await expect(page.getByRole("region", { name: "Info corpus" })).toContainText(
    "Connect this computer",
  );
});
