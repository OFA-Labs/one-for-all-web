import { expect, test, type Page } from "@playwright/test";

const panel = (page: Page) => page.locator(".reactor-panel");
const stage = (page: Page) => page.locator(".reactor-stage");
const heart = (page: Page) => stage(page).locator("video");
const toggle = (page: Page) => page.locator(".arc-toggle");
const action = (page: Page) =>
  panel(page).locator('.button-row > button[data-variant="default"]');
const sidebarHeart = (page: Page) =>
  page.locator('.sidebar a[href="/arc-reactor"] video');

async function expectState(page: Page, state: string) {
  for (const control of [panel(page), stage(page), toggle(page)]) {
    await expect(control).toHaveAttribute("data-reactor-state", state);
  }
}

async function expectRestingHeart(page: Page) {
  for (const video of [heart(page), sidebarHeart(page)]) {
    await expect(video).toBeVisible();
    await expect(video).toHaveCSS("opacity", "1");
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
      .toBe(true);
  }
}

async function openReactor(page: Page) {
  await page.goto("/arc-reactor");
  await expect(page).toHaveTitle(/OFA Engine/);
  await expectState(page, "idle");
  await expect(heart(page)).toHaveAttribute(
    "src",
    "/media/ofa-engine-heart-loop.mp4",
  );
  await expect(heart(page)).toHaveAttribute(
    "poster",
    "/media/ofa-engine-heart-loop-poster.webp",
  );
  await expectRestingHeart(page);
}

test("the complete supplied video loops repeatedly at native speed until switched off", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openReactor(page);
  await expect
    .poll(() =>
      heart(page).evaluate((v: HTMLVideoElement) => v.readyState >= 2),
    )
    .toBe(true);
  const original = await heart(page).elementHandle();
  const sample = await page.evaluate(async () => {
    const video = document.querySelector<HTMLVideoElement>(
      ".reactor-stage video",
    )!;
    let previous = 0;
    let loops = 0;
    let frames = 0;
    const rates = new Set<number>();
    let minTime = Infinity;
    let maxTime = 0;
    let sampling = true;
    const observe: VideoFrameRequestCallback = (_, metadata) => {
      if (!sampling) return;
      if (metadata.mediaTime < previous - 1) loops++;
      previous = metadata.mediaTime;
      minTime = Math.min(minTime, metadata.mediaTime);
      maxTime = Math.max(maxTime, metadata.mediaTime);
      frames++;
      rates.add(video.playbackRate);
      video.requestVideoFrameCallback(observe);
    };
    video.requestVideoFrameCallback(observe);
    document.querySelector<HTMLButtonElement>(".reactor-stage")!.click();
    await new Promise((resolve) => setTimeout(resolve, 7000));
    sampling = false;
    return {
      loops,
      frames,
      rates: [...rates],
      minTime,
      maxTime,
      duration: video.duration,
      loop: video.loop,
      paused: video.paused,
    };
  });
  expect(sample.duration).toBeGreaterThan(2.9);
  expect(sample.duration).toBeLessThanOrEqual(3.01);
  expect(sample.loops).toBeGreaterThanOrEqual(2);
  expect(sample.frames).toBeGreaterThan(40);
  expect(sample.minTime).toBeLessThan(0.2);
  expect(sample.maxTime).toBeGreaterThan(2.7);
  expect(sample.rates).toEqual([1]);
  expect(sample.loop).toBe(true);
  expect(sample.paused).toBe(false);
  await expectState(page, "active");
  await expect(heart(page)).toHaveCSS("transform", "none");
  await expect(heart(page)).toHaveCSS("filter", "none");
  await expect(
    stage(page).locator("img, canvas, .reactor-ripple, .reactor-ambience"),
  ).toHaveCount(0);

  await action(page).click();
  // Off pauses immediately, including during the existing power-down status.
  await expectRestingHeart(page);
  const frozenAt = await heart(page).evaluate(
    (v: HTMLVideoElement) => v.currentTime,
  );
  await page.waitForTimeout(500);
  expect(
    await heart(page).evaluate((v: HTMLVideoElement) => v.currentTime),
  ).toBeCloseTo(frozenAt, 2);
  await expectState(page, "idle");
  expect(
    await original!.evaluate(
      (v) =>
        v.isConnected && v === document.querySelector(".reactor-stage video"),
    ),
  ).toBe(true);
});

test("explicit activation plays the video with reduced motion and reactivation resumes the same player", async ({
  page,
}) => {
  await openReactor(page);
  const original = await heart(page).elementHandle();
  await stage(page).click();
  await expectState(page, "active");
  await expect
    .poll(() =>
      heart(page).evaluate(
        (v: HTMLVideoElement) => !v.paused && v.currentTime > 0.3,
      ),
    )
    .toBe(true);
  await expect(heart(page)).toHaveCSS("transform", "none");
  await toggle(page).click();
  await expectState(page, "idle");
  await expectRestingHeart(page);
  await toggle(page).click();
  await expectState(page, "active");
  await expect
    .poll(() => heart(page).evaluate((v: HTMLVideoElement) => !v.paused))
    .toBe(true);
  expect(
    await original!.evaluate(
      (v) =>
        v.isConnected && v === document.querySelector(".reactor-stage video"),
    ),
  ).toBe(true);
});

test("queued clicks cannot overlap or reverse engine transitions", async ({
  page,
}) => {
  await openReactor(page);
  const burst = async (selector: string) =>
    page.evaluate((selector) => {
      document.querySelector<HTMLButtonElement>(selector)!.click();
      const controls = document.querySelectorAll<HTMLButtonElement>(
        '.reactor-stage, .arc-toggle, .reactor-panel .button-row > button[data-variant="default"]',
      );
      for (let i = 0; i < 8; i++)
        controls.forEach((button) =>
          button.dispatchEvent(new MouseEvent("click", { bubbles: true })),
        );
    }, selector);
  await burst(".reactor-stage");
  await expectState(page, "active");
  await burst(".arc-toggle");
  await expectState(page, "idle");
  await expectRestingHeart(page);
});

test("navigation preserves the running engine and off leaves the sidebar heart visible", async ({
  page,
}) => {
  await openReactor(page);
  await stage(page).click();
  await expectState(page, "active");
  const navigation = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });
  await navigation
    .getByRole("link", { name: "Playground", exact: true })
    .click();
  await expect(page).toHaveURL(/\/playground$/);
  await expect
    .poll(() => sidebarHeart(page).evaluate((v: HTMLVideoElement) => !v.paused))
    .toBe(true);
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("data-reactor-state", "idle");
  await expect(sidebarHeart(page)).toBeVisible();
  await expect
    .poll(() => sidebarHeart(page).evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  await navigation
    .getByRole("link", { name: "OFA Engine", exact: true })
    .click();
  await expectState(page, "idle");
  await expectRestingHeart(page);
});

test("switching off before the video finishes loading cannot start late playback", async ({
  page,
}) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/media/ofa-engine-heart-loop.mp4", async (route) => {
    await held;
    await route.continue();
  });
  try {
    await page.goto("/arc-reactor", { waitUntil: "domcontentloaded" });
    await expect(stage(page)).toBeEnabled();
    await stage(page).click();
    await expectState(page, "active");
    await stage(page).click();
    await expectState(page, "idle");
    release();
    await expect
      .poll(() =>
        heart(page).evaluate((v: HTMLVideoElement) => v.readyState >= 1),
      )
      .toBe(true);
    await page.waitForTimeout(500);
    await expectRestingHeart(page);
  } finally {
    release();
  }
});

test("reset during startup cancels playback and a stale timer cannot reactivate it", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openReactor(page);
  await stage(page).click();
  await expect(panel(page)).toHaveAttribute("data-reactor-state", "activating");
  await page
    .getByRole("button", { name: "Delete my data", exact: true })
    .click({ force: true });
  await page
    .getByRole("dialog", { name: "Delete your local demo data" })
    .getByRole("button", { name: "Reset local demo now", exact: true })
    .click();
  await expectState(page, "idle");
  await page.waitForTimeout(3700);
  await expectState(page, "idle");
  await expectRestingHeart(page);
});
