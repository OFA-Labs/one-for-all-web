import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const useFixture = (page: Page, fixture: string) =>
  page.addInitScript(
    (value) => localStorage.setItem("one-for-all-ebrain-fixture", value),
    fixture,
  );

// M1: T-070 capacity states. T-077 remains covered by the existing journey.
test("capacity meter ok state", async ({ page }) => {
  await useFixture(page, "ok");
  await page.goto("/e-brain");
  await expect(
    page.getByText("412 / 1,000 memories — inside the tested range"),
  ).toBeVisible();
  await expect(page.getByText("Inside tested range")).toBeVisible();
});

test("capacity meter near state", async ({ page }) => {
  await useFixture(page, "near");
  await page.goto("/e-brain");
  await expect(
    page.getByText("912 / 1,000 memories — close to the tested limit"),
  ).toBeVisible();
});

test("capacity meter beyond state", async ({ page }) => {
  await useFixture(page, "beyond");
  await page.goto("/e-brain");
  await expect(
    page.getByText(
      "1,240 / 1,000 memories — beyond the tested range: answers are unreliable",
    ),
  ).toBeVisible();
});

test("capacity banner text is exact", async ({ page }) => {
  await page.goto("/e-brain");
  await expect(
    page
      .getByText(
        "This stores your first ~1,000 memories reliably-ish. Beyond that it is unreliable — this is a known limitation of the project as of now.",
      )
      .first(),
  ).toBeVisible();
});

test("capacity error state", async ({ page }) => {
  await useFixture(page, "error");
  await page.goto("/e-brain");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "E-Brain service is not reachable at mock",
  );
});

// M3: T-071, T-072, T-073, T-075, T-076.
test("experimental badge and can/can't panel", async ({ page }) => {
  await page.goto("/e-brain");
  await expect(page.getByText("EXPERIMENTAL", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "What this can and can't do" }),
  ).toBeVisible();
  await expect(page.getByText(/you see only 30 min/)).toBeVisible();
});

test("badges legend and why drawer", async ({ page }) => {
  await page.goto("/e-brain");
  for (const badge of [
    "current",
    "superseded",
    "conflicted",
    "possibly the same fact",
    "untrusted (external)",
    "beyond tested range",
  ]) {
    await expect(page.getByText(badge).first()).toBeVisible();
  }
  await page.getByRole("button", { name: "Why am I seeing this?" }).first().click();
  await expect(page.getByRole("dialog")).toContainText("silent update");
});

test("known flaws panel present", async ({ page }) => {
  await page.goto("/e-brain");
  await expect(
    page.getByRole("heading", { name: "Known flaws (measured)" }),
  ).toBeVisible();
});

test("self-heal state visible", async ({ page }) => {
  await page.goto("/e-brain");
  await expect(page.getByText("Self-heal: approval required")).toBeVisible();
});

test("empty state and axe", async ({ page }) => {
  await useFixture(page, "empty");
  await page.goto("/e-brain");
  await expect(page.getByText("No memories yet")).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

// M4: T-074 and the approval/split controls.
test("pairs review off text", async ({ page }) => {
  await page.goto("/e-brain");
  await expect(
    page.getByText(
      "Same-fact detection is OFF (experimental; it did not help in tests).",
    ),
  ).toBeVisible();
});

test("self-heal approval requires a human action", async ({ page }) => {
  await useFixture(page, "heal");
  await page.goto("/e-brain");
  const approve = page.getByRole("button", { name: "Approve" });
  await expect(approve).toBeVisible();
  await approve.click();
  await expect(
    page.getByText("Saved. You can undo this with Rollback."),
  ).toBeVisible();
});

test("pairs confirm and split when enabled", async ({ page }) => {
  await useFixture(page, "pairs");
  await page.goto("/e-brain");
  await expect(page.getByRole("button", { name: "Same fact — merge" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Different facts" })).toBeVisible();
  await page.getByRole("button", { name: "Different facts" }).click();
  await expect(
    page.getByText("Saved. You can undo this with Rollback."),
  ).toBeVisible();
});
