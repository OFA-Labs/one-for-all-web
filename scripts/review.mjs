// Supplemental review for interactive states that are not present on initial route load.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve(".cache/ms-playwright");
const { chromium, expect } = await import("@playwright/test");
const { default: AxeBuilder } = await import("@axe-core/playwright");
const base = process.env.ONE_FOR_ALL_PREVIEW_URL || "http://127.0.0.1:3000";
mkdirSync("docs/screenshots", { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const checks = [];
async function inspect(name) {
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth + 1,
  );
  checks.push({
    name,
    overflow,
    violations: audit.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  });
}
async function local() {
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Run local preview", exact: true })
    .click();
}
try {
  await page.goto(`${base}/playground`);
  await page.getByRole("button", { name: "Run task preview" }).nth(2).click();
  await local();
  await page.getByRole("button", { name: "Allow sample access" }).click();
  await local();
  await expect(
    page.getByRole("heading", { name: "Your final say" }),
  ).toBeVisible();
  await inspect("four-site approval desktop");
  await page.screenshot({
    path: "docs/screenshots/approval-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 900 });
  await inspect("four-site approval phone");
  await page.screenshot({
    path: "docs/screenshots/approval-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Approve selected preview" }).click();
  await inspect("integration dialog phone");
  await page.keyboard.press("Escape");
  for (const i of [0, 1, 2]) await page.getByRole("checkbox").nth(i).uncheck();
  await page.getByRole("button", { name: "Approve selected preview" }).click();
  await local();
  await expect(
    page.getByRole("heading", { name: "That’s the shape of done." }),
  ).toBeVisible();
  await expect(
    page.getByText("1 selected sample action illustrated.", { exact: false }),
  ).toBeVisible();
  checks.push({ name: "partial approval", selected: 1, passed: true });
  await page.goto(`${base}/history`);
  await page
    .getByRole("link", { name: "A gentle nudge for PR #142", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start interactive preview", exact: true })
    .click();
  await expect(page).toHaveURL(/tasks\/preview-pr/);
  checks.push({ name: "history to new task navigation", passed: true });
  await page.goto(`${base}/voice-lab`);
  await page.getByLabel("Preview role").selectOption("owner");
  await inspect("owner lab phone");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await inspect("owner lab desktop");
  await page.screenshot({
    path: "docs/screenshots/owner-lab-desktop.png",
    fullPage: true,
  });
  await page.goto(`${base}/settings`);
  await page.getByLabel("Display name").fill("Preview person");
  await page.getByRole("button", { name: "Save local preferences" }).click();
  await local();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("one-for-all-preview-preferences"))
          .name,
    ),
  ).toBe("Preview person");
  checks.push({ name: "explicit local preference save", passed: true });
  await page.goto(`${base}/privacy`);
  await page.getByRole("button", { name: "Reset local demo only" }).click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("one-for-all-preview-preferences"),
    ),
  ).toBeNull();
  checks.push({ name: "reset clears local preference", passed: true });
  await page.setViewportSize({ width: 812, height: 375 });
  await page.goto(`${base}/reader`);
  await inspect("reader landscape");
  await page.screenshot({
    path: "docs/screenshots/reader-landscape.png",
    fullPage: true,
  });
} finally {
  await browser.close();
  writeFileSync(
    "docs/supplemental-review.json",
    JSON.stringify(checks, null, 2),
  );
}
console.log(JSON.stringify(checks, null, 2));
if (checks.some((c) => c.overflow || c.violations?.length))
  process.exitCode = 1;
