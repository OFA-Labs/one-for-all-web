import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

test("the homepage export is a seamless upscaled loop", () => {
  const manifest = JSON.parse(
    readFileSync("public/media/home-gaze-manifest.json", "utf8"),
  );
  expect(manifest.source).toBe("20261123-0935-35.2398015.mp4");
  expect(manifest.head_stabilized).toBe(true);
  expect(manifest.output_fps).toBe(30);
  expect(manifest.loop_frames).toBe(168);
  expect(manifest.verification.full_decode_errors).toBe(0);
  expect(
    manifest.verification.loop_boundary_mae_96px,
  ).toBeLessThanOrEqual(manifest.verification.adjacent_mae_96px_max);
  expect(manifest.outputs).toEqual([
    expect.objectContaining({
      file: "home-gaze-1080p.mp4",
      width: 1920,
      height: 1080,
      fps: 30,
      frames: 168,
    }),
    expect.objectContaining({
      file: "home-gaze-4k.mp4",
      width: 3840,
      height: 2160,
      fps: 30,
      frames: 168,
    }),
  ]);
  expect(manifest.eye_overlay).toMatchObject({
    center: [expect.closeTo(0.5, 2), expect.closeTo(0.47, 2)],
    max_offset: [expect.any(Number), expect.any(Number)],
  });
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
  await expect(hero(page).locator(".ofa-hero-heading")).toHaveText(
    "Meet the speed you need",
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
    ).toContain("/media/home-gaze-4k.mp4?v=gaze-v2");
    await expectOriginalCopy(page);

    // The decorative video cannot intercept the compact orb control.
    await hero(page)
      .getByRole("button", { name: "Tap to speak", exact: true })
      .click();
    const orb = page.getByTestId("hero-orb-animation");
    await expect(orb).toBeVisible();
    expect(
      await orb.evaluate((element: HTMLVideoElement) => element.currentSrc),
    ).toContain("/media/home-orb-loop.mp4");
    await expect(
      page.getByRole("dialog", { name: "O F A", exact: true }),
    ).toHaveCount(0);
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
      source: expect.stringContaining("/media/home-gaze-1080p.mp4?v=gaze-v2"),
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

test("the character's eyes follow the cursor while the loop stays intact", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const video = homeVideo(page);
  await expectPlaying(video);
  const gaze = page.locator(".home-hero-gaze");
  await expect(gaze).toHaveAttribute("data-ready", "true");
  await expect(gaze.locator(".home-hero-eye")).toHaveCount(2);
  const frameSize = await gaze.evaluate((element: HTMLElement) => ({
    width: element.offsetWidth,
    height: element.offsetHeight,
  }));
  expect(frameSize.width).toBeGreaterThan(0);
  expect(frameSize.height).toBeGreaterThan(0);

  const offsetX = () =>
    gaze.evaluate((element: HTMLElement) =>
      parseFloat(element.style.getPropertyValue("--gaze-x")),
    );
  const offsetY = () =>
    gaze.evaluate((element: HTMLElement) =>
      parseFloat(element.style.getPropertyValue("--gaze-y")),
    );
  expect(await offsetX()).toBeCloseTo(0, 1);

  await page.mouse.move(40, 40);
  await expect.poll(offsetX).toBeLessThan(-10);
  await expect.poll(offsetY).toBeLessThan(-5);
  const upperLeft = await offsetX();

  await page.mouse.move(1400, 960);
  await expect.poll(offsetX).toBeGreaterThan(10);
  await expect.poll(offsetY).toBeGreaterThan(5);
  expect(await offsetX()).toBeGreaterThan(upperLeft);

  await expect
    .poll(() =>
      gaze.evaluate(
        (element) => getComputedStyle(element.firstElementChild!).transform,
      ),
    )
    .not.toBe("none");
  await expect(video).toBeVisible();
  await expect(video).toHaveCSS("opacity", "1");
});

test("the compact orb appears inside the head and disappears instantly on stop", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const trigger = hero(page).getByRole("button", {
    name: "Tap to speak",
    exact: true,
  });
  const slot = page.locator(".home-hero-orb-slot");
  const eyes = page.locator(".home-hero-gaze-pair");
  const orb = page.getByTestId("hero-orb-animation");
  await expect(orb).toHaveCount(1); // preloaded from mount
  expect(await orb.getAttribute("preload")).toBe("auto");
  await expect(slot).not.toBeVisible();
  await expect(eyes).toHaveCSS("opacity", "1");

  await trigger.click();
  await expect(slot).toBeVisible();
  await expect(eyes).toHaveCSS("opacity", "0");
  await expect(
    page.getByRole("dialog", { name: "O F A", exact: true }),
  ).toHaveCount(0);
  await expect
    .poll(() =>
      orb.evaluate((element: HTMLVideoElement) => !element.paused),
    )
    .toBe(true);
  const slotBox = (await slot.boundingBox())!;
  const frameBox = (await page.locator(".home-hero-gaze").boundingBox())!;
  expect(slotBox.x + slotBox.width / 2).toBeCloseTo(
    frameBox.x + frameBox.width * 0.4995,
    0,
  );
  expect(slotBox.y + slotBox.height / 2).toBeCloseTo(
    frameBox.y + frameBox.height * 0.4985,
    0,
  );

  await hero(page).getByRole("button", { name: "Stop", exact: true }).click();
  await expect(slot).not.toBeVisible();
  await expect(eyes).toHaveCSS("opacity", "1");
  await expect
    .poll(() => orb.evaluate((element: HTMLVideoElement) => element.paused))
    .toBe(true);
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
    /home-gaze-poster\.webp\?v=gaze-v2/,
  );
  await expect(page.locator(".home-hero-gaze")).toHaveCSS("opacity", "0");
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
  await expect(page.locator(".home-hero-orb-slot")).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "O F A", exact: true }),
  ).toHaveCount(0);
});
