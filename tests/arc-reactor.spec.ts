import { expect, test, type Page } from "@playwright/test";

const panel = (page: Page) => page.locator(".reactor-panel");
const stage = (page: Page) => page.locator(".reactor-stage");
const sidebarToggle = (page: Page) => page.locator(".arc-toggle");
const action = (page: Page) =>
  panel(page).locator('.button-row > button[data-variant="default"]');
const video = (page: Page) => stage(page).locator("video");
const websiteSurfaces =
  ".sidebar, .topbar, .preview-banner, .main-content, .privacy-footer, .mobile-bottom-nav, .sidebar-reopen, .mobile-nav-dialog";

async function websiteAnimationCount(page: Page) {
  return page
    .locator(websiteSurfaces)
    .evaluateAll((elements) =>
      elements.reduce(
        (count, element) =>
          count +
          element
            .getAnimations()
            .filter((animation) => animation.playState === "running").length,
        0,
      ),
    );
}

async function expectInvisibleReactor(page: Page) {
  await expect
    .poll(() =>
      stage(page)
        .locator(".reactor-visual")
        .evaluate((element) => ({
          opacity: Number(getComputedStyle(element).opacity),
          layersHidden: Array.from(
            element.querySelectorAll(
              ".reactor-still, video, .reactor-ambience, .reactor-ripple",
            ),
          ).every((layer) => Number(getComputedStyle(layer).opacity) === 0),
        })),
    )
    .toEqual({ opacity: 0, layersHidden: true });
  await expect(stage(page)).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
}

async function openReactor(page: Page) {
  await page.goto("/arc-reactor");
  await expect(page).toHaveTitle(/OFA Engine/);
  await expect(
    page.getByRole("heading", { name: "OFA Engine", exact: true }),
  ).toBeVisible();
  await expect(panel(page)).toHaveAttribute("data-reactor-state", "idle");
  await expect(stage(page)).toBeEnabled();
  await expect(video(page)).toHaveCount(1);
  await expectInvisibleReactor(page);
}

async function expectState(page: Page, state: string, timeout = 5000) {
  for (const control of [panel(page), stage(page), sidebarToggle(page)]) {
    await expect(control).toHaveAttribute("data-reactor-state", state, {
      timeout,
    });
  }
}

async function burstAllControls(page: Page, startSelector: string) {
  // Native disabled controls reject clicks; synthetic dispatch also exercises
  // the shared handler's guard against events already queued in the same turn.
  await page.evaluate((selector) => {
    document.querySelector<HTMLButtonElement>(selector)?.click();
    const controls = document.querySelectorAll<HTMLButtonElement>(
      '.reactor-stage, .arc-toggle, .reactor-panel .button-row > button[data-variant="default"]',
    );
    for (let repeat = 0; repeat < 8; repeat++) {
      controls.forEach((control) => {
        control.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
    }
  }, startSelector);
}

test.describe("OFA Engine heartbeat transitions", () => {
  test.use({ reducedMotion: "no-preference" });

  test("completes both timed sequences and retains the mechanical heart video", async ({
    page,
  }) => {
    await openReactor(page);
    const original = await video(page).elementHandle();
    expect(original).not.toBeNull();
    await expect(video(page)).toHaveAttribute(
      "src",
      "/media/ofa-engine-heart.mp4?v=ofa-v1",
    );
    await expect(video(page)).toHaveAttribute(
      "poster",
      "/media/ofa-engine-heart-poster.webp?v=ofa-v1",
    );
    expect(await video(page).evaluate((v: HTMLVideoElement) => v.paused)).toBe(
      true,
    );
    await expect(action(page)).toHaveText("ACTIVATE OFA ENGINE");

    const activationStarted = Date.now();
    await stage(page).click();
    await expectState(page, "activating");
    await expect(action(page)).toHaveText("INITIALIZING...");
    for (const control of [stage(page), action(page), sidebarToggle(page)]) {
      await expect(control).toBeDisabled();
    }
    await page.waitForTimeout(1100);
    await expectState(page, "activating");
    await expectState(page, "active");
    expect(Date.now() - activationStarted).toBeGreaterThanOrEqual(3400);
    await expect(action(page)).toHaveText("DEACTIVATE OFA ENGINE");
    await expect(stage(page)).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() =>
        video(page).evaluate(
          (v: HTMLVideoElement) => !v.paused && v.currentTime > 0,
        ),
      )
      .toBe(true);
    expect(
      await original!.evaluate(
        (v) =>
          v.isConnected && v === document.querySelector(".reactor-stage video"),
      ),
    ).toBe(true);

    const shutdownStarted = Date.now();
    await stage(page).click();
    await expectState(page, "deactivating");
    await expect(action(page)).toHaveText("POWERING DOWN...");
    const beforeFade = await video(page).evaluate(
      (v: HTMLVideoElement) => v.currentTime,
    );
    await page.waitForTimeout(600);
    await expectState(page, "deactivating");
    expect(
      await video(page).evaluate(
        (v: HTMLVideoElement, earlier) => !v.paused && v.currentTime > earlier,
        beforeFade,
      ),
    ).toBe(true);
    await expectState(page, "idle");
    expect(Date.now() - shutdownStarted).toBeGreaterThanOrEqual(4100);
    await expect(action(page)).toHaveText("ACTIVATE OFA ENGINE");
    await expect(stage(page)).toHaveAttribute("aria-pressed", "false");
    expect(
      await original!.evaluate(
        (v: HTMLVideoElement) =>
          v.isConnected &&
          v === document.querySelector(".reactor-stage video") &&
          v.paused,
      ),
    ).toBe(true);
    await expectInvisibleReactor(page);
  });

  test("rapid clicks across every control cannot overlap or reverse a transition", async ({
    page,
  }) => {
    await openReactor(page);
    // Start from the text action, then try the heart and sidebar during startup.
    await burstAllControls(
      page,
      '.reactor-panel .button-row > button[data-variant="default"]',
    );
    await expectState(page, "activating");
    await expectState(page, "active");
    await page.waitForTimeout(300);
    await expectState(page, "active");

    // Start shutdown from the sidebar to verify all entry points share state.
    await burstAllControls(page, ".arc-toggle");
    await expectState(page, "deactivating");
    for (const control of [stage(page), action(page), sidebarToggle(page)]) {
      await expect(control).toBeDisabled();
    }
    await expectState(page, "idle");
    await page.waitForTimeout(300);
    await expectState(page, "idle");
    await expect(sidebarToggle(page)).toBeEnabled();
  });

  test("startup shakes all surfaces on the heartbeat, then settles after 3.5 seconds", async ({
    page,
  }) => {
    await openReactor(page);
    await expect
      .poll(() =>
        video(page).evaluate((v: HTMLVideoElement) => v.readyState >= 2),
      )
      .toBe(true);
    await page.waitForTimeout(450);
    const samples = await page.evaluate(async () => {
      const button =
        document.querySelector<HTMLButtonElement>(".reactor-stage")!;
      const core = button.querySelector("video")!;
      const visual = button.querySelector<HTMLElement>(".reactor-visual")!;
      const surfaces = [
        document.querySelector<HTMLElement>(".topbar")!,
        document.querySelector<HTMLElement>(".sidebar")!,
        document.querySelector<HTMLElement>(".reactor-panel")!,
      ];
      const origins = surfaces.map((element) =>
        element.getBoundingClientRect(),
      );
      const result: {
        elapsed: number;
        beat: number;
        presence: number;
        opacity: number;
        surfaceDeltas: { x: number; y: number }[];
      }[] = [];
      const started = performance.now();
      button.click();
      await new Promise<void>((resolve) => {
        const sample = (now: number) => {
          result.push({
            elapsed: now - started,
            beat: Number(
              getComputedStyle(visual).getPropertyValue("--reactor-beat"),
            ),
            presence: Number(getComputedStyle(visual).opacity),
            opacity: Number(getComputedStyle(core).opacity),
            surfaceDeltas: surfaces.map((element, index) => {
              const box = element.getBoundingClientRect();
              return {
                x: box.x - origins[index].x,
                y: box.y - origins[index].y,
              };
            }),
          });
          if (now - started >= 3900) resolve();
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      return result;
    });
    const startup = samples.filter((sample) => sample.elapsed < 3500);
    const settled = samples.filter((sample) => sample.elapsed > 3550);
    expect(
      startup.some(
        (sample) =>
          Math.hypot(sample.surfaceDeltas[0].x, sample.surfaceDeltas[0].y) >
          0.2,
      ),
    ).toBe(true);
    expect(startup.some((sample) => sample.beat === 0)).toBe(true);
    for (const sample of samples) {
      const displacement = sample.surfaceDeltas[0];
      expect(Math.abs(displacement.x)).toBeLessThanOrEqual(6.1);
      expect(Math.abs(displacement.y)).toBeLessThanOrEqual(3.1);
      for (const surface of sample.surfaceDeltas) {
        expect(surface.x).toBeCloseTo(displacement.x, 1);
        expect(surface.y).toBeCloseTo(displacement.y, 1);
      }
      // A jolt belongs to a visible heart contraction, never a separate tremor.
      if (Math.hypot(displacement.x, displacement.y) > 0.02) {
        expect(sample.elapsed).toBeLessThan(3550);
        expect(sample.beat).toBeGreaterThan(0);
      }
    }
    expect(settled.length).toBeGreaterThan(5);
    for (const sample of settled) {
      for (const surface of sample.surfaceDeltas) {
        expect(surface.x).toBeCloseTo(0, 2);
        expect(surface.y).toBeCloseTo(0, 2);
      }
    }
    expect(startup[0].presence).toBeLessThan(settled[0].presence);
    expect(settled[0].opacity).toBeGreaterThan(0.95);
    await expectState(page, "active");
    expect(await websiteAnimationCount(page)).toBe(0);
  });

  test("the active heart keeps pumping while the whole screen stays still", async ({
    page,
  }) => {
    await openReactor(page);
    await stage(page).click();
    await expectState(page, "active");
    await expect
      .poll(() => video(page).evaluate((v: HTMLVideoElement) => !v.paused))
      .toBe(true);
    const samples = await page.evaluate(async (selector) => {
      const core = document.querySelector<HTMLVideoElement>(
        ".reactor-stage video",
      )!;
      const surfaces = Array.from(
        document.querySelectorAll<HTMLElement>(selector),
      );
      const result: {
        beat: number;
        rate: number;
        width: number;
        shifts: string[];
        animations: number;
      }[] = [];
      const started = performance.now();
      await new Promise<void>((resolve) => {
        const sample = (now: number) => {
          result.push({
            beat: Number(
              getComputedStyle(core.parentElement!).getPropertyValue(
                "--reactor-beat",
              ),
            ),
            rate: core.playbackRate,
            width: core.offsetWidth,
            shifts: surfaces.map(
              (surface) => getComputedStyle(surface).translate,
            ),
            animations: surfaces.reduce(
              (count, surface) =>
                count +
                surface
                  .getAnimations()
                  .filter((animation) => animation.playState === "running")
                  .length,
              0,
            ),
          });
          if (now - started >= 3500) resolve();
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      return result;
    }, websiteSurfaces);
    expect(samples.some((sample) => sample.beat > 0.4)).toBe(true);
    expect(samples.some((sample) => sample.beat < 0.01)).toBe(true);
    for (const sample of samples) {
      for (const shift of sample.shifts) {
        expect(
          shift === "none" ||
            shift.split(" ").every((axis) => parseFloat(axis) === 0),
        ).toBe(true);
      }
      expect(sample.animations).toBe(0);
      expect(sample.rate).toBe(1);
    }
    expect(new Set(samples.map((sample) => sample.width)).size).toBe(1);
  });

  test("shutdown gradually slows the moving heart before fading to rest without screen shake", async ({
    page,
  }) => {
    await openReactor(page);
    await stage(page).click();
    await expectState(page, "active");
    const samples = await page.evaluate(async (selector) => {
      const button =
        document.querySelector<HTMLButtonElement>(".reactor-stage")!;
      const core = button.querySelector("video")!;
      const surfaces = Array.from(
        document.querySelectorAll<HTMLElement>(selector),
      );
      const checkpoints = [100, 800, 1800, 2800, 3950];
      const result: {
        elapsed: number;
        rate: number;
        time: number;
        paused: boolean;
        opacity: number;
        shifts: string[];
        animations: number;
      }[] = [];
      const started = performance.now();
      button.click();
      await new Promise<void>((resolve) => {
        const sample = (now: number) => {
          if (now - started >= checkpoints[result.length]) {
            result.push({
              elapsed: now - started,
              rate: core.playbackRate,
              time: core.currentTime,
              paused: core.paused,
              opacity: Number(getComputedStyle(core).opacity),
              shifts: surfaces.map(
                (surface) => getComputedStyle(surface).translate,
              ),
              animations: surfaces.reduce(
                (count, surface) =>
                  count +
                  surface
                    .getAnimations()
                    .filter((animation) => animation.playState === "running")
                    .length,
                0,
              ),
            });
          }
          if (result.length === checkpoints.length) resolve();
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      return result;
    }, websiteSurfaces);
    expect(samples[0].rate).toBeGreaterThan(0.9);
    expect(samples.at(-1)!.rate).toBeLessThan(0.2);
    expect(samples[0].opacity).toBeGreaterThan(0.95);
    expect(samples[1].opacity).toBeGreaterThan(0.95);
    expect(samples.at(-1)!.opacity).toBeLessThan(samples[2].opacity);
    for (let index = 0; index < samples.length; index++) {
      const sample = samples[index];
      expect(sample.paused).toBe(false);
      expect(sample.rate).toBeGreaterThanOrEqual(0.0625);
      expect(sample.animations).toBe(0);
      for (const shift of sample.shifts) {
        expect(
          shift === "none" ||
            shift.split(" ").every((axis) => parseFloat(axis) === 0),
        ).toBe(true);
      }
      if (index > 0) {
        expect(sample.rate).toBeLessThan(samples[index - 1].rate);
        // A loop may wrap the media clock, but decoded frames must keep moving.
        expect(Math.abs(sample.time - samples[index - 1].time)).toBeGreaterThan(
          0.005,
        );
      }
    }
    await expectState(page, "idle");
    expect(
      await video(page).evaluate((core: HTMLVideoElement) => core.paused),
    ).toBe(true);
    await expectInvisibleReactor(page);
  });

  test("a late first video frame fades in after startup instead of cutting in", async ({
    page,
  }) => {
    let releaseMedia!: () => void;
    const heldMedia = new Promise<void>((resolve) => {
      releaseMedia = resolve;
    });
    await page.route("**/media/ofa-engine-heart.mp4*", async (route) => {
      await heldMedia;
      await route.continue();
    });
    try {
      // A pending video response can delay the window load event, while the
      // app must still hydrate and allow its controls to work normally.
      await page.goto("/arc-reactor", { waitUntil: "domcontentloaded" });
      await expect(stage(page)).toBeEnabled();
      await expect(video(page)).toHaveCount(1);
      await stage(page).click();
      await expectState(page, "active");
      expect(
        await video(page).evaluate((v: HTMLVideoElement) => v.readyState < 2),
      ).toBe(true);
      expect(
        await video(page).evaluate((v) => Number(getComputedStyle(v).opacity)),
      ).toBe(0);
      await video(page).evaluate((v) => {
        v.addEventListener(
          "loadeddata",
          () => {
            requestAnimationFrame(() => {
              v.dataset.firstFrameOpacity = getComputedStyle(v).opacity;
            });
          },
          { once: true },
        );
      });
      releaseMedia();
      await expect(video(page)).toHaveAttribute(
        "data-first-frame-opacity",
        /^\d/,
      );
      expect(
        Number(await video(page).getAttribute("data-first-frame-opacity")),
      ).toBeLessThan(0.3);
      await expect
        .poll(() =>
          video(page).evaluate((v) => Number(getComputedStyle(v).opacity)),
        )
        .toBeGreaterThan(0.95);
      await expectState(page, "active");
    } finally {
      releaseMedia();
    }
  });

  test("navigation preserves an in-progress transition and its final state", async ({
    page,
  }) => {
    await openReactor(page);
    await stage(page).click();
    const navigation = page.getByRole("navigation", {
      name: "Main navigation",
      exact: true,
    });
    await navigation
      .getByRole("link", { name: "Playground", exact: true })
      .click({ force: true });
    await expect(page).toHaveURL(/\/playground$/);
    await expect(sidebarToggle(page)).toHaveAttribute(
      "data-reactor-state",
      "activating",
    );
    await expect(sidebarToggle(page)).toHaveAttribute(
      "data-reactor-state",
      "active",
    );
    await navigation
      .getByRole("link", { name: "OFA Engine", exact: true })
      .click();
    await expectState(page, "active");
    await expect(action(page)).toHaveText("DEACTIVATE OFA ENGINE");

    await sidebarToggle(page).click();
    await navigation
      .getByRole("link", { name: "Playground", exact: true })
      .click();
    await expect(sidebarToggle(page)).toHaveAttribute(
      "data-reactor-state",
      "idle",
    );
    await navigation
      .getByRole("link", { name: "OFA Engine", exact: true })
      .click();
    await expectState(page, "idle");
    expect(await video(page).evaluate((v: HTMLVideoElement) => v.paused)).toBe(
      true,
    );
    await expectInvisibleReactor(page);
  });

  test("reset cancels startup so a stale completion cannot reactivate the reactor", async ({
    page,
  }) => {
    await openReactor(page);
    await stage(page).click();
    await expectState(page, "activating");
    await page
      .getByRole("button", { name: "Delete my data", exact: true })
      .click({ force: true });
    await expectState(page, "activating");
    await page
      .getByRole("dialog", { name: "Delete your local demo data" })
      .getByRole("button", { name: "Reset local demo now", exact: true })
      .click();
    await expectState(page, "idle");
    await page.waitForTimeout(3700);
    await expectState(page, "idle");
    await expect(action(page)).toBeEnabled();
    expect(await video(page).evaluate((v: HTMLVideoElement) => v.paused)).toBe(
      true,
    );
    await expectInvisibleReactor(page);
  });
});

test("reduced motion uses a short functional transition with a still heart", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openReactor(page);
  await stage(page).click();
  expect(await websiteAnimationCount(page)).toBe(0);
  await expectState(page, "active", 1200);
  await expect(action(page)).toHaveText("DEACTIVATE OFA ENGINE");
  expect(await video(page).evaluate((v: HTMLVideoElement) => v.paused)).toBe(
    true,
  );
  const transform = await page
    .locator(".application-shell")
    .evaluate((element) => getComputedStyle(element).transform);
  expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(transform);
  const restingFilter = await video(page).evaluate(
    (element) => getComputedStyle(element).filter,
  );
  await page.waitForTimeout(500);
  expect(
    await video(page).evaluate((element) => getComputedStyle(element).filter),
  ).toBe(restingFilter);
  await sidebarToggle(page).click();
  await expectState(page, "idle", 1200);
  await expect(action(page)).toHaveText("ACTIVATE OFA ENGINE");
  await expectInvisibleReactor(page);
});

test("changing the motion preference during startup settles without replaying", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openReactor(page);
  await stage(page).click();
  await expectState(page, "activating");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expectState(page, "active");
  await expect
    .poll(() => video(page).evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  await page.waitForTimeout(300);
  await expectState(page, "active");
  await expect(action(page)).toBeEnabled();
  expect(await websiteAnimationCount(page)).toBe(0);
});
