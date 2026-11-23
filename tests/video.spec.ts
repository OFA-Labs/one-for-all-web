import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
test("motion assets declare interpolated 60 fps and 25 percent faster motion", () => {
  const manifest = JSON.parse(
    readFileSync("public/media/asset-manifest.json", "utf8"),
  );
  expect(manifest.output_fps).toBe(60);
  expect(manifest.speed_multiplier).toBe(1.25);
});
test("O F A opens a looping orb inside the head and stops it on demand", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page).toHaveTitle(/O F A/);
  const idle = page.getByTestId("ofa-idle-orb");
  await expect
    .poll(() => idle.evaluate((v: HTMLVideoElement) => !v.paused))
    .toBe(true);
  await page.getByRole("button", { name: "Tap to speak", exact: true }).click();
  await expect(page.locator(".home-hero-orb-slot")).toBeVisible();
  const video = page.getByTestId("hero-orb-animation");
  await expect
    .poll(
      () =>
        video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0),
      { timeout: 20000 },
    )
    .toBe(true);
  expect(
    await video.evaluate((v: HTMLVideoElement) => ({
      w: v.videoWidth,
      h: v.videoHeight,
      loop: v.loop,
      muted: v.muted,
      rate: v.playbackRate,
    })),
  ).toEqual({ w: 512, h: 512, loop: true, muted: true, rate: 1 });
  const start = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(start + 0.1);
  expect(await idle.evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
  await expect(
    page.getByRole("dialog", { name: "O F A", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  await expect(page.locator(".home-hero-orb-slot")).not.toBeVisible();
  await page.getByRole("button", { name: "Tap to speak", exact: true }).click();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(false);
});
test("F1 and F2 open, stop and resume the shared orb session", async ({
  page,
}) => {
  await page.goto("/");
  // Wait for hydration: the orb button starts disabled in server HTML.
  await expect(
    page.getByRole("button", { name: "Tap to speak", exact: true }),
  ).toBeEnabled();
  await page.keyboard.press("F1");
  const dialog = page.getByRole("dialog", { name: "O F A", exact: true });
  const video = dialog.getByTestId("voice-animation");
  await expect(dialog).toBeVisible();
  await expect
    .poll(() =>
      video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0),
    )
    .toBe(true);
  await page.keyboard.press("F1");
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  await page.keyboard.press("F2");
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(false);
  await page.keyboard.press("F2");
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
test("plain black remains the canvas on every route", async ({ page }) => {
  for (const route of [
    "/",
    "/reader",
    "/playground",
    "/connections",
    "/settings",
    "/privacy",
    "/sign-in",
    "/handoff",
  ]) {
    await page.goto(route);
    const colors = await page.evaluate(() => ({
      background: getComputedStyle(document.body).backgroundColor,
      image: getComputedStyle(document.body).backgroundImage,
    }));
    expect(colors.image, route).toBe("none");
    expect(colors.background, route).toBe("rgb(0, 0, 0)");
    await expect(page).toHaveTitle(/ONE FOR ALL/);
  }
});
test("phone orb sessions use the lighter smooth video stream", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Tap to speak", exact: true }).click();
  const video = page.getByTestId("hero-orb-animation");
  await expect
    .poll(
      () =>
        video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0),
      { timeout: 20000 },
    )
    .toBe(true);
  expect(
    await video.evaluate((v: HTMLVideoElement) => ({
      w: v.videoWidth,
      h: v.videoHeight,
    })),
  ).toEqual({ w: 512, h: 512 });
  await expect(
    page.getByRole("dialog", { name: "O F A", exact: true }),
  ).toHaveCount(0);
});
