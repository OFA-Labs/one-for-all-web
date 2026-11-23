import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
const routes = [
  "/",
  "/reader",
  "/playground",
  "/history",
  "/watchers",
  "/arc-reactor",
  "/e-brain",
  "/connections",
  "/settings",
  "/settings?tab=dictation",
  "/privacy",
  "/extension",
  "/voice-lab",
  "/handoff",
  "/about",
  "/sign-in",
  "/sign-up",
  "/recover",
  "/onboarding",
  "/tasks/sample-pr",
];
test("all screens load with no runtime console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBe(true);
    await expect(page.locator("main h1")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test("all screens automated accessibility audit", async ({ page }) => {
  test.setTimeout(90000);
  const failures: object[] = [];
  for (const route of routes) {
    await page.goto(route);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    if (result.violations.length)
      failures.push({
        route,
        violations: result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      });
  }
  expect(failures).toEqual([]);
});
for (const width of [375, 768, 1024, 1440])
  test(`responsive ${width}px without page overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    for (const route of [
      "/",
      "/reader",
      "/playground",
      "/history",
      "/watchers",
      "/arc-reactor",
      "/e-brain",
      "/connections",
      "/settings",
      "/settings?tab=dictation",
      "/privacy",
      "/extension",
      "/handoff",
      "/onboarding",
    ]) {
      await page.goto(route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${route} at ${width}`,
      ).toBe(true);
    }
  });
test("reviewed screenshots desktop/mobile/tablet and reduced motion", async ({
  page,
}) => {
  mkdirSync("docs/screenshots", { recursive: true });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "docs/screenshots/assistant-desktop.png",
    fullPage: true,
  });
  expect(
    await page
      .getByTestId("ofa-idle-orb")
      .evaluate((e: HTMLVideoElement) => e.paused),
  ).toBe(true);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.screenshot({
    path: "docs/screenshots/assistant-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toContainText("Connections");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/reader");
  await page.screenshot({
    path: "docs/screenshots/reader-tablet.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/connections");
  await page.screenshot({
    path: "docs/screenshots/connections-desktop.png",
    fullPage: true,
  });
});
