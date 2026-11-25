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
