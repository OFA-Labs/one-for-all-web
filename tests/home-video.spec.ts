import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

test("the homepage export is a seamless 4K/60 loop", () => {
  const manifest = JSON.parse(
    readFileSync("public/media/home-coast-manifest.json", "utf8"),
  );
  expect(manifest.output_fps).toBe(60);
  expect(manifest.loop_frames).toBe(650);
  expect(manifest.verification.full_decode_errors).toBe(0);
  expect(
    manifest.verification.loop_boundary_mae_96px,
  ).toBeLessThanOrEqual(manifest.verification.adjacent_mae_96px_max);
  expect(manifest.outputs).toEqual([
    expect.objectContaining({
      file: "home-coast-1080p.mp4",
      width: 1920,
      height: 1080,
      fps: 60,
      frames: 650,
    }),
    expect.objectContaining({
      file: "home-coast-4k.mp4",
      width: 3840,
      height: 2160,
      fps: 60,
      frames: 650,
    }),
  ]);
});

const hero = (page: Page) => page.locator(".assistant-hero");
const homeVideo = (page: Page) => page.getByTestId("ofa-idle-orb");

async function expectPlaying(video: Locator) {
  await expect
    .poll(
      () =>
        video.evaluate(
          (element: HTMLVideoElement) =>
            !element.paused &&
            element.readyState >= 2 &&
            element.currentTime > 0,
        ),
      { timeout: 20000 },
    )
    .toBe(true);
}

async function expectOriginalCopy(page: Page) {
  await expect(hero(page).locator(".ofa-hero-kicker")).toHaveText(
    "ONE FOR ALL",
  );
  await expect(hero(page).locator(".ofa-hero-copy")).toHaveText(
    "A hand with your tasks. A voice for your words.",
  );
  await expect(
    hero(page).getByRole("button", { name: "Tap to speak", exact: true }),
  ).toBeVisible();
  await expect(
    hero(page).getByRole("link", { name: "Open workspace", exact: true }),
  ).toBeVisible();
  await expect(
    hero(page)
      .getByRole("navigation", { name: "Workspace shortcuts" })
      .getByRole("link"),
  ).toHaveText([
    "Playground",
    "History",
    "Watchers",
    "Connections",
    "Settings",
    "Get started",
  ]);
}

test.describe("continuous homepage footage", () => {
  test.use({ reducedMotion: "no-preference" });

  test("autoplays the 4K background at its original speed and preserves the homepage copy", async ({
    page,
  }) => {
    await page.goto("/");
    const video = homeVideo(page);
    await expectPlaying(video);
    expect(
      await video.evaluate((element: HTMLVideoElement) => ({
        width: element.videoWidth,
        height: element.videoHeight,
        muted: element.muted,
        loop: element.loop,
        inline: element.playsInline,
        controls: element.controls,
        rate: element.playbackRate,
      })),
    ).toEqual({
      width: 3840,
      height: 2160,
      muted: true,
      loop: true,
      inline: true,
      controls: false,
      rate: 1,
    });
    expect(
      await video.evaluate((element: HTMLVideoElement) => element.currentSrc),
    ).toContain("/media/home-coast-4k.mp4?v=coast-v2");
    await expectOriginalCopy(page);

    // The decorative video cannot intercept the existing voice-session action.
    await hero(page)
      .getByRole("button", { name: "Tap to speak", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "O F A", exact: true });
    await expect(dialog).toBeVisible();
    await expect
      .poll(() =>
        dialog
          .getByTestId("voice-animation")
          .evaluate((element: HTMLVideoElement) => element.currentSrc),
      )
      .toContain("/media/one-for-all-4k.mp4");
  });

  test("uses the lighter full-HD stream on phones with the same text and controls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/");
    const video = homeVideo(page);
    await expectPlaying(video);
    expect(
      await video.evaluate((element: HTMLVideoElement) => ({
        width: element.videoWidth,
        height: element.videoHeight,
        source: element.currentSrc,
      })),
    ).toEqual({
      width: 1920,
      height: 1080,
      source: expect.stringContaining("/media/home-coast-1080p.mp4?v=coast-v2"),
    });
    await expectOriginalCopy(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  });

  test("loops through the boundary without replacing or hiding the video", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    const video = homeVideo(page);
    await expectPlaying(video);
    const original = await video.elementHandle();
    expect(original).not.toBeNull();
    await video.evaluate(async (element: HTMLVideoElement) => {
      await new Promise<void>((resolve) => {
        element.addEventListener("seeked", () => resolve(), { once: true });
        element.currentTime = element.duration - 0.25;
      });
      await element.play();
    });
    await expect
      .poll(() =>
        video.evaluate((element: HTMLVideoElement) => element.currentTime),
      )
      .toBeLessThan(1.5);
    await expectPlaying(video);
    expect(
      await original!.evaluate(
        (element) =>
          element.isConnected &&
          element === document.querySelector('[data-testid="ofa-idle-orb"]'),
      ),
    ).toBe(true);
    await expect(video).toBeVisible();
    await expect(video).toHaveCSS("opacity", "1");
    expect(
      await video.evaluate((element: HTMLVideoElement) => ({
        ended: element.ended,
        error: element.error?.message ?? null,
        opacity: Number(getComputedStyle(element).opacity),
      })),
    ).toEqual({ ended: false, error: null, opacity: 1 });
    expect(errors).toEqual([]);
  });

  test("pauses outside the hero and resumes when the visitor returns", async ({
    page,
  }) => {
    await page.goto("/");
    const video = homeVideo(page);
    await expectPlaying(video);
    // Merely revealing the workspace heading can leave part of the hero in
    // view. Scroll beyond the hero's bottom so its observer is truly outside.
    await hero(page).evaluate((element) =>
      window.scrollTo({
        top: window.scrollY + element.getBoundingClientRect().bottom + 2,
        behavior: "instant",
      }),
    );
    await expect
      .poll(() =>
        hero(page).evaluate(
          (element) => element.getBoundingClientRect().bottom,
        ),
      )
      .toBeLessThan(0);
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.paused))
      .toBe(true);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expectPlaying(video);
  });
});

test("reduced motion keeps the homepage footage still and leaves the existing actions usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const video = homeVideo(page);
  const background = page.locator(".home-hero-video");
  await expect(background).toBeVisible();
  await expect(background).toHaveCSS(
    "background-image",
    /home-coast-poster\.webp\?v=coast-v2/,
  );
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.paused))
    .toBe(true);
  const restingTime = await video.evaluate(
    (element: HTMLVideoElement) => element.currentTime,
  );
  await page.waitForTimeout(350);
  expect(
    await video.evaluate((element: HTMLVideoElement) => element.currentTime),
  ).toBe(restingTime);
  await expectOriginalCopy(page);
  await hero(page)
    .getByRole("button", { name: "Tap to speak", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "O F A", exact: true }),
  ).toBeVisible();
});
