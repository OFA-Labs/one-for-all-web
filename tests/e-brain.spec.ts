import { test, expect, type Page } from "@playwright/test";

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
