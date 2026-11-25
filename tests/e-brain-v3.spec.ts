import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const open = async (page: Page) => {
  await page.goto("/v3-preview");
  const harness = page.getByRole("region", { name: "V3 preview harness" });
  await expect(harness).toBeVisible();
  return harness;
};

const load = async (page: Page, label: string) => {
  const harness = await open(page);
  await harness.getByRole("button", { name: label }).click();
  return harness;
};

test("preview route is clearly labelled as mock data", async ({ page }) => {
  const harness = await open(page);
  await expect(harness.getByText("PREVIEW — E-Brain V3 web slice")).toBeVisible();
  await expect(harness.getByText(/Synthetic mock fixtures only/)).toBeVisible();
  await expect(
    harness.getByRole("heading", { name: "V3 answer" }),
  ).toBeVisible();
  await expect(
    harness.getByRole("heading", { name: "V3 proposal review" }),
  ).toBeVisible();
});

test("pending facts never render a Current badge", async ({ page }) => {
  const harness = await load(page, "Load pending");
  await expect(
    harness.getByText("Pending verification — not current").first(),
  ).toBeVisible();
  await expect(harness.getByText("Current", { exact: true })).toHaveCount(0);
});

test("conflict and unknown facts never render a Current badge", async ({
  page,
}) => {
  let harness = await load(page, "Load conflict");
  await expect(harness.getByText("Conflict — not current").first()).toBeVisible();
  await expect(harness.getByText("Current", { exact: true })).toHaveCount(0);

  harness = await load(page, "Load unknown");
  await expect(harness.getByText("Unknown — not current").first()).toBeVisible();
  await expect(harness.getByText("Current", { exact: true })).toHaveCount(0);
});

test("stale source is not badged Current even when the fact state is current", async ({
  page,
}) => {
  const harness = await open(page);
  await expect(harness.getByText("Current", { exact: true }).first()).toBeVisible();
  await expect(harness.getByText("Not current — source stale").first()).toBeVisible();
});

test("malformed pending-with-current payload is rejected at runtime", async ({
  page,
}) => {
  const harness = await load(page, "Load malformed");
  await expect(harness.getByRole("alert")).toContainText(
    "Rejected unsafe V3 answer payload",
  );
  await expect(harness.getByText("Current", { exact: true })).toHaveCount(0);
  await expect(harness.getByText("No validated answer to display.")).toBeVisible();
});

test("completeness, degradation, confidence and freshness are visible", async ({
  page,
}) => {
  const harness = await open(page);
  await expect(
    harness.getByText(
      "Completeness: Partial · degradation partial · index lag present",
    ),
  ).toBeVisible();
  await expect(harness.getByText("Reason: index lag on one source")).toBeVisible();
  await expect(harness.getByText("Omitted facet: history")).toBeVisible();
  await expect(harness.getByText("Source stale — not current").first()).toBeVisible();
  await expect(
    harness.getByText(/retrieval evidence, not truth/).first(),
  ).toBeVisible();
});

test("plan capacity is visibly unmeasured and price is unset", async ({
  page,
}) => {
  const harness = await open(page);
  await expect(harness.getByText("Price not set")).toBeVisible();
  await expect(
    harness.getByText(
      /Capacity label is configuration, not a measured guarantee/,
    ),
  ).toBeVisible();
  await expect(harness.getByText("unmeasured", { exact: true }).first()).toBeVisible();
});

test("review authority is not taken from a localStorage role", async ({
  page,
}) => {
  const harness = await open(page);
  const approve = harness.getByRole("button", { name: "Approve proposal" });
  // The preview config seeds a member role in localStorage. It must not enable review.
  await expect(approve).toBeDisabled();
  await expect(harness.getByText(/localStorage role is not evidence/)).toBeVisible();

  await harness.getByRole("button", { name: "Grant preview authority" }).click();
  await expect(approve).toBeEnabled();
  await approve.click();
  await expect(
    harness.getByText(/Preview approval request queued for prop-7 at digest/),
  ).toBeVisible();
});

test("keyboard access and ARIA regions work", async ({ page }) => {
  const harness = await open(page);
  await expect(
    harness.getByRole("region", { name: "V3 answer" }),
  ).toBeVisible();
  await expect(
    harness.getByRole("region", { name: "Receipts" }).first(),
  ).toBeVisible();
  await expect(harness.getByRole("status").first()).toBeVisible();

  const pendingButton = harness.getByRole("button", { name: "Load pending" });
  await pendingButton.focus();
  await expect(pendingButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    harness.getByText("Pending verification — not current").first(),
  ).toBeVisible();

  const summary = harness.locator(".v3-fact-details summary").first();
  await summary.focus();
  await expect(summary).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(harness.locator(".v3-fact-details").first()).toHaveAttribute(
    "open",
    "",
  );
});

test("loading, error and retry states are exposed", async ({ page }) => {
  let harness = await load(page, "Simulate loading");
  await expect(harness.getByText(/Loading validated V3 payload/).first()).toBeVisible();

  harness = await load(page, "Load error");
  await expect(harness.getByRole("alert")).toContainText("unavailable");
  await harness.getByRole("button", { name: "Retry" }).first().click();
  await expect(harness.getByText("Current", { exact: true }).first()).toBeVisible();
});

test("preview slice has no axe violations", async ({ page }) => {
  await open(page);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

// Traceability alias for M07 in TRACEABILITY.csv.
test("M07_states_and_accessibility", async ({ page }) => {
  let harness = await load(page, "Simulate loading");
  await expect(harness.getByText(/Loading validated V3 payload/).first()).toBeVisible();

  harness = await load(page, "Load pending");
  await expect(harness.getByText("Pending verification — not current").first()).toBeVisible();
  expect(await harness.getByText("Current", { exact: true }).count()).toBe(0);

  harness = await load(page, "Load conflict");
  await expect(harness.getByText("Conflict — not current").first()).toBeVisible();
  expect(await harness.getByText("Current", { exact: true }).count()).toBe(0);

  await open(page);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
