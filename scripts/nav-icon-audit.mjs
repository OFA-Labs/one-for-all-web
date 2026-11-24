import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const url = process.env.NAV_AUDIT_URL ?? "http://127.0.0.1:3000/playground";
const outDir = path.resolve(
  process.env.NAV_AUDIT_DIR ?? "artifacts/nav-icons",
);
const label = (process.env.NAV_AUDIT_LABEL ?? "current").replace(
  /[^a-z0-9-]/gi,
  "-",
);
const storageState = {
  cookies: [],
  origins: [
    {
      origin: new URL(url).origin,
      localStorage: [
        { name: "one-for-all-role", value: "member" },
        { name: "one-for-all-onboarding-complete", value: "true" },
      ],
    },
  ],
};

await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

for (const dpr of [1, 2]) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: dpr,
    reducedMotion: "reduce",
    storageState,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const sidebar = page.locator(".sidebar");
  await sidebar.screenshot({
    path: path.join(outDir, `${label}-sidebar-${dpr}x.png`),
  });

  if (label === "before") {
    const details = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          '.sidebar nav[aria-label="Main navigation"] .nav-link',
        ),
      ].map((link) => {
        const icon = link.querySelector(".nav-icon");
        const image = icon?.querySelector("img");
        const svg = icon?.querySelector("svg");
        const video = icon?.querySelector("video");
        const box = icon?.getBoundingClientRect();
        return {
          href: link.getAttribute("href"),
          icon: image
            ? `img:${image.getAttribute("src")}`
            : video
              ? "video:ofa-engine-heart-loop.mp4"
              : svg
                ? "svg"
                : "unknown",
          slot: box && { width: box.width, height: box.height },
        };
      }),
    );
    console.log(JSON.stringify(details, null, 2));
  }

  await context.close();
}

await browser.close();
console.log(`Saved ${label} captures to ${outDir}`);
