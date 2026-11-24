/**
 * Measures the rendered sidebar glyphs on transparency at 2x:
 * grayscale mean brightness, bounding-box area in CSS pixels, warm pixels.
 *
 *   PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node scripts/nav-icon-metrics.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const url = process.env.NAV_AUDIT_URL ?? "http://127.0.0.1:3000/playground";
const outDir = path.resolve("artifacts/nav-icons");
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 2,
  reducedMotion: "reduce",
  storageState: {
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
  },
});
const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.addStyleTag({
  content: `
    html, body, .application-shell, .app-frame, .sidebar { background: transparent !important; }
    .nav-link { background: transparent !important; border-color: transparent !important; }
    .nav-icon { opacity: 1 !important; filter: none !important; transform: none !important; }
    .nav-indicator, .nav-count, .nav-utility { display: none !important; }
  `,
});

const links = await page
  .locator('.sidebar nav[aria-label="Main navigation"] .nav-link')
  .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));

const results = [];
for (const href of links) {
  const icon = page.locator(`.sidebar a.nav-link[href="${href}"] .nav-icon`);
  const buffer = await icon.screenshot({ omitBackground: true });
  const name = href === "/" ? "home" : href.slice(1).replace("/", "-");
  await fs.writeFile(path.join(outDir, `metric-${name}.png`), buffer);
  const metrics = await page.evaluate(async (src) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    const canvas = new OffscreenCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const { data } = ctx.getImageData(0, 0, image.width, image.height);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -1;
    let maxY = -1;
    let sum = 0;
    let count = 0;
    let warm = 0;
    let saturated = 0;
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        const i = (y * image.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a > 8) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
        if (a > 48) {
          sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
          count++;
          if (r > g + 22 && r > b + 22) warm++;
          if (Math.max(r, g, b) - Math.min(r, g, b) > 28) saturated++;
        }
      }
    }
    const dpr = 2;
    return {
      brightness: count ? sum / count : 0,
      bboxWidth: (maxX - minX + 1) / dpr,
      bboxHeight: (maxY - minY + 1) / dpr,
      bboxArea: ((maxX - minX + 1) * (maxY - minY + 1)) / (dpr * dpr),
      inkShare: count / (image.width * image.height),
      warm,
      saturated,
    };
  }, `data:image/png;base64,${buffer.toString("base64")}`);
  results.push({ href, ...metrics });
}

const mean = results.reduce((sum, r) => sum + r.brightness, 0) / results.length;
const meanArea = results.reduce((sum, r) => sum + r.bboxArea, 0) / results.length;
for (const r of results) {
  r.brightnessDelta = ((r.brightness - mean) / mean) * 100;
  r.areaDelta = ((r.bboxArea - meanArea) / meanArea) * 100;
}
console.table(
  results.map((r) => ({
    href: r.href,
    brightness: r.brightness.toFixed(1),
    "bright Δ%": r.brightnessDelta.toFixed(1),
    "bbox w": r.bboxWidth.toFixed(1),
    "bbox h": r.bboxHeight.toFixed(1),
    "area px²": r.bboxArea.toFixed(0),
    "area Δ%": r.areaDelta.toFixed(1),
    "ink %": (r.inkShare * 100).toFixed(1),
    warm: r.warm,
    saturated: r.saturated,
  })),
);
await browser.close();
