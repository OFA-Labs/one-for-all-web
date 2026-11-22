import { expect, test } from "@playwright/test";

test("tab decks form a grid and hover history scrolls without opening a dialog", async ({
  page,
}) => {
  await page.goto("/tasks/sample-social");
  await expect(page.locator(".tab-deck")).toHaveCount(4);
  const decks = await page.locator(".tab-deck").all();
  const first = (await decks[0].boundingBox())!;
  const second = (await decks[1].boundingBox())!;
  const third = (await decks[2].boundingBox())!;
  expect(second.x).toBeGreaterThan(first.x);
  expect(third.y).toBe(first.y);
  expect(third.x).toBeGreaterThan(second.x);

  await page
    .getByRole("button", { name: "Open linkedin.com tab history", exact: true })
    .hover();
  const preview = page.getByRole("region", {
    name: "linkedin.com capture history preview",
    exact: true,
  });
  await expect(preview).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const pageScroll = await page.evaluate(() => window.scrollY);
  await preview.hover();
  await page.mouse.wheel(0, 450);
  await expect
    .poll(() => preview.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(pageScroll);
  await page.keyboard.press("Escape");
  await expect(preview).toHaveCount(0);
});

test("a capture opens with a blurred backdrop, full conversation and scrollable page history", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("/tasks/sample-jobs");
  const trigger = page.getByRole("button", {
    name: "Open playground.one-for-all.test tab history",
    exact: true,
  });
  await trigger.hover();
  const preview = page.getByRole("region", {
    name: "playground.one-for-all.test capture history preview",
    exact: true,
  });
  await expect(preview).toBeVisible();
  await preview.getByRole("button", { name: /capture 2:/ }).click();
  const dialog = page.getByRole("dialog", {
    name: "playground.one-for-all.test",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(page.locator(".tab-deck-overlay")).toHaveCSS(
    "backdrop-filter",
    "blur(12px)",
  );
  await expect(
    dialog.getByRole("button", { name: /^View capture 2:/ }),
  ).toHaveAttribute("aria-pressed", "true");
  const conversation = dialog.getByRole("region", {
    name: "Conversation and activity for playground.one-for-all.test",
    exact: true,
  });
  await expect(conversation).toContainText("ML engineer roles in NCR");
  await expect(conversation).toContainText("Expected salary: ₹12 LPA");
  await expect(conversation).toContainText("Local preview started.");
  const capture = dialog.getByRole("region", {
    name: "Selected tab capture",
    exact: true,
  });
  await capture.hover();
  await page.mouse.wheel(0, 450);
  await expect
    .poll(() => capture.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  await dialog
    .getByRole("button", { name: "Next capture", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", { name: /^View capture 3:/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() => capture.evaluate((element) => element.scrollTop))
    .toBe(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.locator('.tab-frame-strip button[aria-pressed="true"]'),
  ).toBeInViewport();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(trigger).toBeFocused();
});

test("a tab opened from calendar task details closes back to its parent dialog", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-11-16T10:00:00+05:30"));
  await page.goto("/history");
  await expect(page.getByTestId("history-period-label")).toContainText(
    "16 November 2026",
  );
  await page
    .getByRole("button", {
      name: "Open task details for A gentle nudge for PR #142",
      exact: true,
    })
    .click();
  const parent = page.locator(".hc-task-dialog");
  await expect(parent).toBeVisible();
  const trigger = parent.getByRole("button", {
    name: "Open github.com tab history",
    exact: true,
  });
  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: "github.com", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".tab-deck-dialog")).toHaveCount(0);
  await expect(parent).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(parent).toHaveCount(0);
});

test.describe("touch tab decks", () => {
  test.use({
    viewport: { width: 375, height: 900 },
    hasTouch: true,
    isMobile: true,
  });

  test("a tap opens the full history and conversation without requiring hover", async ({
    page,
  }) => {
    await page.goto("/tasks/sample-social");
    await page
      .getByRole("button", { name: "Open slack.com tab history", exact: true })
      .tap();
    const dialog = page.getByRole("dialog", { name: "slack.com", exact: true });
    await expect(dialog).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const bounds = (await dialog.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(375);
    const conversation = dialog.getByRole("region", {
      name: "Conversation and activity for slack.com",
      exact: true,
    });
    await conversation.scrollIntoViewIfNeeded();
    await expect(conversation).toContainText("Send to #side-projects");
    await expect(conversation).toContainText("Share the voice-agent demo");
    await dialog.getByRole("button", { name: "Close", exact: true }).tap();
    await expect(dialog).toHaveCount(0);
  });
});
