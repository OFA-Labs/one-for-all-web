import { test, expect, type Page } from "@playwright/test";
// Primary actions now run their local preview immediately. This helper is kept
// for the remaining "Integration details" dialogs that still offer one.
async function localPreview(page: Page) {
  const run = page
    .getByRole("dialog")
    .getByRole("button", { name: "Run local preview", exact: true });
  if (await run.isVisible().catch(() => false)) await run.click();
}
async function beginPR(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Nudge a pull request/ }).click();
  await page.getByRole("button", { name: "Allow access" }).click();
  await localPreview(page);
  await expect(
    page.getByRole("heading", { name: "Your final say" }),
  ).toBeVisible();
}
test("PR journey, edit invalidation, approval and evidence", async ({
  page,
}) => {
  await beginPR(page);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Exact text").fill("A shorter note for the team.");
  await page
    .getByRole("button", { name: "Save draft and invalidate review" })
    .click();
  await expect(
    page.getByText("Your previous approval is void.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Refresh sample reading" }).click();
  await page.getByRole("button", { name: "Approve selected preview" }).click();
  await expect(
    page.getByRole("heading", { name: "That’s the shape of done." }),
  ).toBeVisible();
  await page.getByLabel("Inspect evidence tier").selectOption("B");
  await expect(
    page.getByText("Submitted, not yet confirmed.", { exact: true }),
  ).toBeVisible();
});
test("space pause, resume and confirmed cancel", async ({ page }) => {
  await beginPR(page);
  await page.locator("h1").click();
  await page.keyboard.press("Space");
  await expect(
    page.getByText("Paused locally.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Confirm and resume preview" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your final say" }),
  ).toBeVisible();
  // Task controls (Pause/Cancel) live on the task detail page, not the home view.
  await page.goto("/tasks/preview-pr");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel preview task" })
    .click();
  await expect(
    page.getByText("Unused approvals revoked", { exact: false }).first(),
  ).toBeVisible();
});
test("dialog focus trapping, escape and focus restoration", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Open workspace", exact: true }).click();
  await page.getByText("Explore voice states", { exact: false }).click();
  const trigger = page.getByRole("button", {
    name: "Voice integration details",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest('[role="dialog"]'),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
test("Reader local TXT, sentence seek, flags, silent playback and empty state", async ({
  page,
}) => {
  await page.goto("/reader");
  await page.getByRole("tab", { name: "PDF / text file" }).click();
  await page.locator("#reader-file").setInputFiles({
    name: "example.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("First sentence. Second sentence. Third sentence."),
  });
  await expect(
    page.getByRole("button", { name: "Second sentence.", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Second sentence.", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Second sentence.", exact: true }),
  ).toHaveAttribute("aria-current", "true");
  await page
    .getByRole("button", { name: /Flag this spoken line/ })
    .first()
    .click();
  await localPreview(page);
  await expect(
    page.getByRole("button", { name: /Line flagged locally/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Preview reading", exact: true })
    .click();
  await localPreview(page);
  const readingSession = page.getByRole("dialog", {
    name: "O F A",
    exact: true,
  });
  await expect(readingSession).toContainText("Second sentence.");
  await readingSession
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await readingSession
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Preview reading", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Text", exact: true }).click();
  await page.getByRole("button", { name: "Clear text", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Preview reading", exact: true }),
  ).toBeDisabled();
});
test("signup validates consent and enters explicit member demo", async ({
  page,
}) => {
  await page.goto("/sign-up");
  await page.getByRole("button", { name: "Create account preview" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await page.getByLabel("Email address").fill("test@example.test");
  await page.getByLabel("Password", { exact: true }).fill("sample-password");
  await page.locator("#consent").check();
  await page.locator("#adult").check();
  await page.getByRole("button", { name: "Create account preview" }).click();
  await localPreview(page);
  await expect(
    page.getByText("Registration preview complete.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Enter member demo" }).click();
  await expect(page).toHaveURL(/onboarding/);
});
test("watcher validation, duplicate, create and expiry", async ({ page }) => {
  await page.goto("/watchers");
  await page.getByRole("button", { name: "New watcher" }).click();
  await page.getByRole("button", { name: /sample watcher/ }).click();
  await expect(page.getByRole("alert")).toContainText("owner/repository");
  await page.getByLabel("Repository", { exact: true }).fill("acme/voice-kit");
  await page.getByLabel("Pull request number").fill("142");
  await page.getByRole("button", { name: /sample watcher/ }).click();
  await expect(page.getByRole("alert")).toContainText("already watching");
  await page.getByLabel("Pull request number").fill("143");
  await page.getByRole("button", { name: /sample watcher/ }).click();
  await localPreview(page);
  await expect(
    page.getByRole("heading", { name: "acme/voice-kit #143" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Expire at 7 days" }).click();
  await expect(page.getByText("Expired · sample")).toBeVisible();
});
test("job task includes question and tap-only resume review", async ({
  page,
}) => {
  await page.goto("/playground");
  await page.getByRole("button", { name: "Run task preview" }).nth(1).click();
  await localPreview(page);
  await page.getByRole("button", { name: "Allow access" }).click();
  await localPreview(page);
  await expect(
    page.getByRole("heading", { name: "Would you relocate to Pune?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Use this answer in preview" })
    .click();
  await localPreview(page);
  await expect(
    page.getByText("Tap only · files, declarations or several items"),
  ).toBeVisible();
});
test("owner UI gated by preview role, metadata remains local", async ({
  page,
}) => {
  await page.goto("/voice-lab");
  await expect(
    page.getByRole("heading", { name: "A voice that’s yours." }),
  ).toBeVisible();
  await page.getByLabel("Preview role").selectOption("owner");
  await expect(
    page.getByRole("heading", { name: "A voice, carefully made." }),
  ).toBeVisible();
  await page.getByLabel("Preview role").selectOption("member");
  await expect(
    page.getByRole("heading", { name: "A voice that’s yours." }),
  ).toBeVisible();
});
test("no invented API calls, microphone or external browser requests", async ({
  page,
}) => {
  const unexpected: string[] = [];
  page.on("request", (r) => {
    if (
      r.url().startsWith("http") &&
      !r.url().startsWith("http://127.0.0.1:3100/")
    )
      unexpected.push(r.url());
    if (new URL(r.url()).pathname.startsWith("/v1/")) unexpected.push(r.url());
  });
  await beginPR(page);
  await page.getByRole("button", { name: "Approve selected preview" }).click();
  await expect(
    page.getByRole("heading", { name: "That’s the shape of done." }),
  ).toBeVisible();
  expect(unexpected).toEqual([]);
});

test.describe("guest entry", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test("signed-out home and onboarding open sign-in, then five steps lead home", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/sign-in$/);
    await page.goto("/");
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(
      page.getByRole("heading", { name: "Welcome back." }),
    ).toBeVisible();
    await expect(page.locator(".auth-shell")).toBeVisible();
    await expect(page.locator(".sidebar")).toHaveCount(0);
    await expect(page.locator(".topbar")).toHaveCount(0);

    await page.getByLabel("Email address").fill("guest@example.test");
    await page.getByLabel("Password", { exact: true }).fill("sample-password");
    await page.getByRole("button", { name: "Sign in preview" }).click();
    await localPreview(page);
    await page.getByRole("button", { name: "Enter member demo" }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.locator(".auth-shell")).toBeVisible();
    await expect(page.locator(".sidebar")).toHaveCount(0);

    // The workspace stays locked until all five steps are finished.
    await page.goto("/playground");
    await expect(page).toHaveURL(/\/onboarding$/);

    await page.getByRole("checkbox").nth(0).check();
    await page.getByRole("checkbox").nth(1).check();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByText("Step 2 of 5 · local preview")).toBeVisible();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page
      .getByRole("button", { name: "Continue without a real connection" })
      .click();
    await page
      .getByRole("button", { name: "Continue without connecting a model" })
      .click();
    await expect(page.getByText("Step 5 of 5 · local preview")).toBeVisible();
    await page.getByRole("button", { name: "Finish setup" }).click();
    await expect(page).toHaveURL("http://127.0.0.1:3100/");
    await expect(
      page.getByText("Meet the speed you need"),
    ).toBeVisible();
    await page.goto("/playground");
    await expect(page).toHaveURL(/\/playground$/);
    await expect(page.locator(".sidebar")).toBeVisible();
  });
});
