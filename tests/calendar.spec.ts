import { test, expect, type Page } from "@playwright/test";

const taskButton = (page: Page, title: string) =>
  page.getByRole("button", {
    name: `Open task details for ${title}`,
    exact: true,
  });

test.beforeEach(async ({ page }) => {
  // Both browser and calendar use the client's Kolkata date, not the host timezone.
  await page.clock.setFixedTime(new Date("2026-11-16T10:00:00+05:30"));
  await page.goto("/history");
  // Wait for the browser's fixed date to replace the server-rendered date
  // before interacting, so hydration cannot reset the first filter selection.
  await expect(page.getByTestId("history-period-label")).toContainText(
    "16 November 2026",
  );
  // The relative label is computed after hydration with the mocked clock.
  // Waiting for it guarantees React handlers are attached before filtering.
  await expect(page.locator(".hc-relative-day")).toHaveText("Today");
});

test("Today opens the current day; Previous shows yesterday and reset returns today", async ({
  page,
}) => {
  const period = page.getByTestId("history-period-label");
  await expect(period).toContainText("16 November 2026");
  await expect(taskButton(page, "A gentle nudge for PR #142")).toBeVisible();
  await page.getByRole("button", { name: "Previous day", exact: true }).click();
  await expect(period).toContainText("15 November 2026");
  await expect(page.getByText("Yesterday", { exact: true })).toBeVisible();
  await expect(taskButton(page, "Three voices, one comparison")).toBeVisible();
  await expect(taskButton(page, "A gentle nudge for PR #142")).toHaveCount(0);
  await page.getByRole("button", { name: "Go to today", exact: true }).click();
  await expect(period).toContainText("16 November 2026");
});

test("Week navigation moves the whole selected week", async ({ page }) => {
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await expect(page.getByTestId("history-period-label")).toContainText(
    "November 2026",
  );
  await page
    .getByRole("button", { name: "Previous week", exact: true })
    .click();
  await expect(taskButton(page, "Prepare a job application")).toBeVisible();
  await expect(taskButton(page, "A gentle nudge for PR #142")).toHaveCount(0);
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  await expect(taskButton(page, "A gentle nudge for PR #142")).toBeVisible();
});

test("Month navigation opens previous months and crosses the year boundary", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Month", exact: true }).click();
  const period = page.getByTestId("history-period-label");
  await expect(period).toContainText("November 2026");
  await page
    .getByRole("button", { name: "Previous month", exact: true })
    .click();
  await expect(period).toContainText("October 2026");
  for (let i = 0; i < 10; i++) {
    await page
      .getByRole("button", { name: "Previous month", exact: true })
      .click();
  }
  await expect(period).toContainText("December 2025");
  await page.getByRole("button", { name: "Next month", exact: true }).click();
  await expect(period).toContainText("January 2026");
});

test("Year navigation opens the previous year and can return to this year", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Year", exact: true }).click();
  const period = page.getByTestId("history-period-label");
  await expect(period).toContainText("2026");
  await page
    .getByRole("button", { name: "Previous year", exact: true })
    .click();
  await expect(period).toContainText("2025");
  await page.getByRole("button", { name: "Next year", exact: true }).click();
  await expect(period).toContainText("2026");
});

test("month and year date cells drill into that day", async ({ page }) => {
  await page.getByRole("button", { name: "Month", exact: true }).click();
  await page
    .getByRole("button", { name: "Open 16 November 2026", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Previous day", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("history-period-label")).toContainText(
    "16 November 2026",
  );
  await page.getByRole("button", { name: "Year", exact: true }).click();
  await page
    .getByRole("button", { name: "Open 15 November 2026", exact: true })
    .click();
  await expect(page.getByTestId("history-period-label")).toContainText(
    "15 November 2026",
  );
  await expect(
    page.getByRole("button", { name: "Previous day", exact: true }),
  ).toBeVisible();
});

test("task calendar buttons open the existing read-only detail view in a modal", async ({
  page,
}) => {
  const url = page.url();
  await taskButton(page, "A gentle nudge for PR #142").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(url);
  await expect(
    dialog.getByRole("heading", {
      level: 1,
      name: "A gentle nudge for PR #142",
    }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", {
      name: "Download sample summary",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    dialog.getByText("This historical task is read-only sample data.", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close task details", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(url);
});

test("status and search filters apply within the selected period", async ({
  page,
}) => {
  await page.getByLabel("Filter history by status").selectOption("Verified");
  await expect(taskButton(page, "A gentle nudge for PR #142")).toBeVisible();
  await expect(taskButton(page, "ML engineer roles in NCR")).toHaveCount(0);
  await page.getByLabel("Search task history").fill("no-such-task");
  await expect(taskButton(page, "A gentle nudge for PR #142")).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "Nothing matches this search.",
      exact: true,
    }),
  ).toBeVisible();
});

test("all calendar views stay within a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  for (const name of ["Today", "Week", "Month", "Year"]) {
    await page.getByRole("button", { name, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      name,
    ).toBe(true);
  }
});
