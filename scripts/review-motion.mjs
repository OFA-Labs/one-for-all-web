import path from "node:path";
import { writeFileSync } from "node:fs";
process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve(".cache/ms-playwright");
const { chromium, expect } = await import("@playwright/test");
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [1440, 375]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:3000/");
    const video = page.getByTestId("voice-animation");
    await page
      .getByRole("button", { name: "Tap to talk", exact: true })
      .click();
    await expect
      .poll(() => video.evaluate((v) => !v.paused && v.currentTime > 0.15), {
        timeout: 20000,
      })
      .toBe(true);
    const result = await video.evaluate(async (v) => {
      const initial = v.getVideoPlaybackQuality();
      const times = [];
      let alive = true;
      const frame = (_, metadata) => {
        if (!alive) return;
        times.push(metadata.mediaTime);
        v.requestVideoFrameCallback(frame);
      };
      v.requestVideoFrameCallback(frame);
      await new Promise((resolve) => setTimeout(resolve, 2500));
      alive = false;
      const final = v.getVideoPlaybackQuality();
      const mediaDeltas = times
        .slice(1)
        .map((t, i) => t - times[i])
        .filter((d) => d > 0 && d < 0.2);
      const sum = mediaDeltas.reduce((a, b) => a + b, 0);
      return {
        source: v.currentSrc,
        width: v.videoWidth,
        height: v.videoHeight,
        duration: v.duration,
        playbackRate: v.playbackRate,
        totalFrames: final.totalVideoFrames - initial.totalVideoFrames,
        droppedFrames: final.droppedVideoFrames - initial.droppedVideoFrames,
        observedPresentationFps: sum
          ? Math.round((mediaDeltas.length / sum) * 10) / 10
          : 0,
      };
    });
    results.push({ viewportWidth: width, ...result });
    await page
      .getByRole("button", { name: "Pause animation", exact: true })
      .click();
    await page.screenshot({
      path: `docs/screenshots/space-black-${width}.png`,
      fullPage: true,
    });
    await context.close();
  }
} finally {
  await browser.close();
  writeFileSync(
    "docs/MOTION_PLAYBACK_REVIEW.json",
    JSON.stringify(
      {
        note: "Local Chromium sample; not a guarantee for other hardware or displays",
        results,
      },
      null,
      2,
    ),
  );
}
console.log(JSON.stringify(results, null, 2));
