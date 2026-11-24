/**
 * One-time asset normalisation for the sidebar icons.
 *
 * Every glyph is re-baked into the same 48x48 optical box with the same cool
 * silver palette, top-left key light and ice-blue rim. The home mark is traced
 * from the supplied hand-drawn raster so its silhouette survives the re-render.
 *
 * Run once after changing the supplied artwork:
 *   PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node scripts/normalize-nav-icons.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve("public/media/nav");
const homeSource = path.resolve("public/media/home-relaxing.webp");

const palette = {
  dark: "#0B0F18",
  mid: "#6F7A8C",
  bright: "#EAF2FF",
  ice: "#80BFFF",
};

const defs = `
  <defs>
    <linearGradient id="glass" x1="8" y1="5" x2="41" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${palette.bright}"/>
      <stop offset=".18" stop-color="#B8C5D6"/>
      <stop offset=".48" stop-color="${palette.mid}"/>
      <stop offset=".76" stop-color="#232C3A"/>
      <stop offset="1" stop-color="${palette.dark}"/>
    </linearGradient>
    <linearGradient id="glassDeep" x1="10" y1="8" x2="40" y2="42" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#8D9AAD"/>
      <stop offset=".32" stop-color="#3B4657"/>
      <stop offset=".72" stop-color="#151C27"/>
      <stop offset="1" stop-color="${palette.dark}"/>
    </linearGradient>
    <linearGradient id="glassMid" x1="9" y1="7" x2="40" y2="43" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#DDE7F3"/>
      <stop offset=".22" stop-color="#96A3B5"/>
      <stop offset=".55" stop-color="#4A5565"/>
      <stop offset=".82" stop-color="#1A2230"/>
      <stop offset="1" stop-color="${palette.dark}"/>
    </linearGradient>
    <linearGradient id="outline" x1="8" y1="6" x2="41" y2="43" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${palette.bright}"/>
      <stop offset=".32" stop-color="#B7C4D4"/>
      <stop offset=".68" stop-color="${palette.mid}"/>
      <stop offset="1" stop-color="${palette.ice}" stop-opacity=".58"/>
    </linearGradient>
    <linearGradient id="faceTop" x1="15" y1="8" x2="34" y2="24" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#C8D4E3" stop-opacity=".62"/>
      <stop offset="1" stop-color="${palette.mid}" stop-opacity=".16"/>
    </linearGradient>
    <linearGradient id="faceLeft" x1="9" y1="14" x2="24" y2="36" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${palette.mid}" stop-opacity=".38"/>
      <stop offset="1" stop-color="${palette.dark}" stop-opacity=".7"/>
    </linearGradient>
    <linearGradient id="faceRight" x1="25" y1="14" x2="41" y2="38" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#2A3443" stop-opacity=".8"/>
      <stop offset="1" stop-color="${palette.dark}" stop-opacity=".92"/>
    </linearGradient>
    <linearGradient id="iceFace" x1="26" y1="23" x2="38" y2="36" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${palette.ice}" stop-opacity=".42"/>
      <stop offset="1" stop-color="${palette.ice}" stop-opacity=".1"/>
    </linearGradient>
  </defs>`;

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none">${defs}\n${body}\n</svg>\n`;

/* ------------------------------------------------------------------ */
/* Home: trace the supplied hand-drawn mark, then rebuild it in glass. */
/* ------------------------------------------------------------------ */

async function traceHome() {
  const base64 = (await fs.readFile(homeSource)).toString("base64");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("about:blank");
  const traced = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const max = 320;
    const scale = Math.min(
      1,
      max / Math.max(img.naturalWidth, img.naturalHeight),
    );
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const a = data[i * 4 + 3];
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      mask[i] = a > 128 && l < 160 ? 1 : 0;
    }

    const points = new Map();
    const key = (x, y) => `${x.toFixed(4)},${y.toFixed(4)}`;
    const at = (x, y) =>
      x < 0 || y < 0 || x >= w || y >= h ? 0 : mask[y * w + x];
    const segments = [];
    for (let y = -1; y < h; y++) {
      for (let x = -1; x < w; x++) {
        const c =
          at(x, y) |
          (at(x + 1, y) << 1) |
          (at(x + 1, y + 1) << 2) |
          (at(x, y + 1) << 3);
        if (!c || c === 15) continue;
        const top = [x + 0.5, y];
        const right = [x + 1, y + 0.5];
        const bottom = [x + 0.5, y + 1];
        const left = [x, y + 0.5];
        const table = {
          1: [[left, top]],
          2: [[top, right]],
          3: [[left, right]],
          4: [[right, bottom]],
          5: [
            [left, top],
            [right, bottom],
          ],
          6: [[top, bottom]],
          7: [[left, bottom]],
          8: [[bottom, left]],
          9: [[top, bottom]],
          10: [
            [top, right],
            [bottom, left],
          ],
          11: [[right, bottom]],
          12: [[left, right]],
          13: [[top, right]],
          14: [[left, top]],
        };
        for (const [a, b] of table[c]) {
          const ka = key(...a);
          const kb = key(...b);
          if (!points.has(ka)) points.set(ka, a);
          if (!points.has(kb)) points.set(kb, b);
          segments.push([ka, kb]);
        }
      }
    }

    const adjacency = new Map();
    for (const [a, b] of segments) {
      if (!adjacency.has(a)) adjacency.set(a, []);
      if (!adjacency.has(b)) adjacency.set(b, []);
      adjacency.get(a).push(b);
      adjacency.get(b).push(a);
    }
    const used = new Set();
    const loops = [];
    for (const [a, b] of segments) {
      const edge = [a, b].sort().join("|");
      if (used.has(edge)) continue;
      const loop = [a];
      used.add(edge);
      let current = b;
      let guard = 0;
      while (current !== a && guard++ < 200000) {
        loop.push(current);
        const next = (adjacency.get(current) ?? []).find(
          (candidate) =>
            !used.has([current, candidate].sort().join("|")),
        );
        if (!next) break;
        used.add([current, next].sort().join("|"));
        current = next;
      }
      if (current === a) loops.push(loop.map((k) => points.get(k)));
    }

    const area = (loop) => {
      let sum = 0;
      for (let i = 0; i < loop.length; i++) {
        const [x1, y1] = loop[i];
        const [x2, y2] = loop[(i + 1) % loop.length];
        sum += x1 * y2 - x2 * y1;
      }
      return sum / 2;
    };
    const bounds = (loop) => {
      const xs = loop.map((p) => p[0]);
      const ys = loop.map((p) => p[1]);
      return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        w: Math.max(...xs) - Math.min(...xs),
        h: Math.max(...ys) - Math.min(...ys),
      };
    };
    return loops.map((loop) => ({
      loop,
      area: area(loop),
      ...bounds(loop),
    }));
  }, `data:image/webp;base64,${base64}`);
  await browser.close();

  // Drop the registered-mark loops in the upper-right corner; keep the mark
  // body, its central gap and the two loop cut-outs.
  const loops = traced.filter(
    (loop) => Math.abs(loop.area) > 30 && (loop.x < 140 || loop.y > 80),
  );
  const outer = loops.reduce(
    (acc, loop) => ({
      x: Math.min(acc.x, loop.x),
      y: Math.min(acc.y, loop.y),
      right: Math.max(acc.right, loop.x + loop.w),
      bottom: Math.max(acc.bottom, loop.y + loop.h),
    }),
    { x: Infinity, y: Infinity, right: -Infinity, bottom: -Infinity },
  );
  const width = outer.right - outer.x;
  const height = outer.bottom - outer.y;
  const unit = 34.5 / Math.max(width, height);
  const dx = 24 - (outer.x + width / 2) * unit;
  const dy = 24 - (outer.y + height / 2) * unit;

  const simplify = (points, epsilon) => {
    if (points.length < 4) return points;
    const sqDistToSegment = (p, a, b) => {
      let x = a[0];
      let y = a[1];
      let dx = b[0] - x;
      let dy = b[1] - y;
      if (dx || dy) {
        const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
        if (t > 1) {
          x = b[0];
          y = b[1];
        } else if (t > 0) {
          x += dx * t;
          y += dy * t;
        }
      }
      dx = p[0] - x;
      dy = p[1] - y;
      return dx * dx + dy * dy;
    };
    const simplifySection = (section) => {
      if (section.length < 3) return section;
      const first = section[0];
      const last = section[section.length - 1];
      let index = 0;
      let max = 0;
      for (let i = 1; i < section.length - 1; i++) {
        const d = sqDistToSegment(section[i], first, last);
        if (d > max) {
          index = i;
          max = d;
        }
      }
      if (max > epsilon * epsilon) {
        const left = simplifySection(section.slice(0, index + 1));
        const right = simplifySection(section.slice(index));
        return left.slice(0, -1).concat(right);
      }
      return [first, last];
    };
    const closed = points[0].join() === points[points.length - 1].join();
    const source = closed ? points.slice(0, -1) : points;
    return simplifySection(source.concat([source[0]]));
  };

  const paths = loops.map(({ loop }) => {
    const simplified = simplify(loop, 0.9);
    const scaled = simplified.map(([x, y]) => [
      +(x * unit + dx).toFixed(2),
      +(y * unit + dy).toFixed(2),
    ]);
    return (
      "M" + scaled.map(([x, y]) => `${x} ${y}`).join("L") + "Z"
    );
  });

  // A single ice-blue ring sits inside the larger hand-drawn loop: the mark's
  // signature detail, and the only saturated colour in the glyph.
  const signatureLoop =
    loops.find(
      (loop) =>
        loop.x > 70 && loop.x < 78 && loop.y > 58 && loop.y < 66,
    ) ?? loops[0];
  const loopCentre = {
    x: (signatureLoop.x + signatureLoop.w / 2) * unit + dx,
    y: (signatureLoop.y + signatureLoop.h / 2) * unit + dy,
  };

  return `<path d="${paths.join("")}" fill="url(#glassDeep)" fill-rule="evenodd" stroke="url(#outline)" stroke-width="1.5" stroke-linejoin="round"/>
  <circle cx="${loopCentre.x.toFixed(2)}" cy="${loopCentre.y.toFixed(2)}" r="1.4" stroke="${palette.ice}" stroke-width="1.2"/>`;
}

/* --------------------- Connections (secondary) ---------------------- */

/**
 * The plugs sit in the same sidebar, so their gold prongs are re-baked into
 * the silver ramp once. Alpha and shading survive; hue does not.
 */
async function bakeConnections() {
  const base64 = (await fs.readFile(path.resolve("public/media/connections-plugs.webp"))).toString("base64");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const dataUrl = await page.evaluate(async (src) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    const canvas = new OffscreenCanvas(image.naturalWidth, image.naturalHeight);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const stops = [
      [11, 15, 24],
      [111, 122, 140],
      [234, 242, 255],
    ];
    const ramp = (t) => {
      const scaled = Math.min(1, Math.max(0, t)) * (stops.length - 1);
      const index = Math.min(stops.length - 2, Math.floor(scaled));
      const mix = scaled - index;
      return stops[index].map((channel, i) =>
        Math.round(channel + (stops[index + 1][i] - channel) * mix),
      );
    };
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      const luma =
        (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      const [r, g, b] = ramp(luma);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    ctx.putImageData(new ImageData(data, canvas.width, canvas.height), 0, 0);
    const blob = await canvas.convertToBlob({ type: "image/png" });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1)
      binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }, `data:image/webp;base64,${base64}`);
  await browser.close();
  return Buffer.from(dataUrl, "base64");
}

/* ------------------------------- Cubes ------------------------------ */

function cubes() {
  const top = { x: 24, y: 11.8 };
  const left = { x: 14.9, y: 28.2 };
  const right = { x: 33.1, y: 28.2 };
  const cube = (c, r = 8.8) => {
    const v = r * 0.62;
    const pts = {
      top: [c.x, c.y - r],
      topRight: [c.x + r * 0.9, c.y - v],
      bottomRight: [c.x + r * 0.9, c.y + v],
      bottom: [c.x, c.y + r],
      bottomLeft: [c.x - r * 0.9, c.y + v],
      topLeft: [c.x - r * 0.9, c.y - v],
    };
    const p = (point) =>
      Array.isArray(point)
        ? `${point[0].toFixed(1)} ${point[1].toFixed(1)}`
        : `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    return {
      pts,
      topFace: `M${p(pts.top)}L${p(pts.topRight)}L${p(c)}L${p(pts.topLeft)}Z`,
      leftFace: `M${p(pts.topLeft)}L${p(c)}L${p(pts.bottom)}L${p(pts.bottomLeft)}Z`,
      rightFace: `M${p(pts.topRight)}L${p(c)}L${p(pts.bottom)}L${p(pts.bottomRight)}Z`,
      outline: `M${p(pts.top)}L${p(pts.topRight)}L${p(pts.bottomRight)}L${p(pts.bottom)}L${p(pts.bottomLeft)}L${p(pts.topLeft)}Z`,
      y: `M${p(pts.topLeft)}L${p(c)}L${p(pts.topRight)}M${p(c)}L${p(pts.bottom)}`,
    };
  };
  const shapes = [cube(top), cube(left), cube(right)];
  const faces = shapes
    .map((s, index) => {
      const signatureFace =
        index === 2
          ? `<path d="${s.rightFace}" fill="url(#iceFace)" stroke="${palette.ice}" stroke-opacity=".58" stroke-width="1"/>`
          : `<path d="${s.rightFace}" fill="url(#faceRight)"/>`;
      return `<path d="${s.topFace}" fill="url(#faceTop)"/><path d="${s.leftFace}" fill="url(#faceLeft)"/>${signatureFace}`;
    })
    .join("");
  const outlines = shapes
    .map(
      (s) =>
        `<path d="${s.outline}" stroke="url(#outline)" stroke-width="1.5" stroke-linejoin="round"/><path d="${s.y}" stroke="url(#outline)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join("");
  return `<g>${faces}${outlines}</g>`;
}

/* --------------------------- Screen stack --------------------------- */

function screenStack() {
  const win = (x, y, w, h, tone) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.4" fill="${tone}" stroke="url(#outline)" stroke-width="1.5"/>
    <path d="M${x + 1.5} ${y + 5}H${x + w - 1.5}" stroke="url(#outline)" stroke-width="1.1" stroke-opacity=".6"/>
    <circle cx="${x + 3.6}" cy="${y + 2.7}" r=".8" fill="${palette.mid}" fill-opacity=".7"/>`;
  return `<g>
    ${win(15, 4.5, 28, 20, "url(#glassDeep)")}
    ${win(9.7, 9, 28.6, 21, "url(#glassDeep)")}
    ${win(4.4, 13.5, 30.8, 23.5, "url(#glass)")}
    <g stroke="url(#outline)" stroke-opacity=".42" stroke-width="1.2" stroke-linecap="round">
      <path d="M8.4 21.6h12.2M8.4 24.6h7.4M8.4 32.2h5.6M29.4 32.2h2.4"/>
    </g>
    <path d="M17.6 31.6l2.6-3.2 2 4.3 2.7-7.3 2.8 6 1.7-2.4h3.1" stroke="${palette.ice}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

/* ------------------------------ Folder ------------------------------ */

function folder() {
  return `<g>
    <rect x="13.4" y="7.6" width="21.4" height="16.6" rx="2.2" transform="rotate(-2 24 16)" fill="url(#glassDeep)" stroke="url(#outline)" stroke-width="1.5"/>
    <rect x="17.4" y="10.2" width="20.6" height="15.8" rx="2.2" transform="rotate(2 27.7 18)" fill="url(#glassDeep)" stroke="url(#outline)" stroke-width="1.5"/>
    <g stroke="url(#outline)" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round">
      <path d="M21.2 14.8h9.2M21.8 17.8h7.2M20.4 20.8h5.8"/>
    </g>
    <path d="M5.4 15.2h12l3 3.2h18.2c1.3 0 2.2 1 2.2 2.2v14.1c0 1.4-1 2.4-2.4 2.4H7.6c-1.4 0-2.4-1-2.4-2.4V17.2c0-1.1.9-2 2-2Z" fill="url(#glass)" stroke="url(#outline)" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M6.8 22.2h34.4" stroke="url(#outline)" stroke-width="1.1" stroke-opacity=".45"/>
    <path d="M6.8 15.8h9.8" stroke="${palette.ice}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M9.2 18.8h31.2" stroke="${palette.bright}" stroke-width="1" stroke-opacity=".16"/>
  </g>`;
}

/* ------------------------------- Brain ------------------------------ */

function brain() {
  return `<g>
    <path d="M24 8.6C22.2 6.1 18.9 5.5 17 7.1 16 5.8 14.2 5.7 13 6.6 11.3 6.1 9.4 7.1 9.2 8.9 7.1 9.5 5.9 11.4 6.3 13.4 4.8 14.7 4.5 16.8 5.5 18.4 4.8 20.3 5.7 22.4 7.6 23.3 7.5 25.4 9.1 27.3 11.3 27.4 12.1 29.5 14.6 30.4 16.7 29.3 18.3 31.1 21.1 31.4 22.8 29.8L24 31.1 25.2 29.8C26.9 31.4 29.7 31.1 31.3 29.3 33.4 30.4 35.9 29.5 36.7 27.4 38.9 27.3 40.5 25.4 40.4 23.3 42.3 22.4 43.2 20.3 42.5 18.4 43.5 16.8 43.2 14.7 41.7 13.4 42.1 11.4 40.9 9.5 38.8 8.9 38.6 7.1 36.7 6.1 35 6.6 33.8 5.7 32 5.8 31 7.1 29.1 5.5 25.8 6.1 24 8.6Z" fill="url(#glass)" stroke="url(#outline)" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M24 9.4c-1.6 3.1 1.5 5.2.2 8.1-1.2 2.7 1.4 5 .2 7.8" stroke="${palette.dark}" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M23.2 9.6c-1.6 3.1 1.5 5.2.2 8.1-1.2 2.7 1.4 5 .2 7.8" stroke="${palette.mid}" stroke-opacity=".55" stroke-width="1" stroke-linecap="round"/>
    <g stroke="url(#outline)" stroke-opacity=".4" stroke-width="1.15" stroke-linecap="round" fill="none">
      <path d="M10.6 12.8c2.8-1.4 5.4-.2 6 2.3M8.9 18.4c2.4 1.4 4.9.4 5.8-1.6M12.2 23.9c1.9-1.2 4.2-.4 5.1 1.4M16.4 10.9c1.4 1.6 1.3 3.6-.1 4.7"/>
      <path d="M34.2 11.6c1.5 1.5 1.4 3.4.2 4.7M37 18.1c-2.2 1.5-4.7.8-5.7-1.1M34.8 24.7c-1.6-1.2-3.7-.6-4.6 1.1"/>
    </g>
    <g stroke="${palette.ice}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M27.4 16.4h4.2v3.8h3.1M34.7 25.1h-4v3.2"/>
      <path d="M27.4 16.4v2.9" stroke-opacity=".6"/>
    </g>
    <g fill="${palette.ice}">
      <circle cx="31.6" cy="16.4" r="1"/><circle cx="34.7" cy="20.2" r="1"/><circle cx="30.7" cy="28.3" r="1"/>
    </g>
  </g>`;
}

/* ------------------------------- Heart ------------------------------ */

function heart() {
  // The compact engine mark is live media; this overlay only carries the one
  // ice-blue signature (the pulse) so the video stays the heart silhouette.
  return `<g>
    <path d="M10.2 30.5h5.6l1.9-4 2.6 7.5 2.8-9.8 2.7 7.8 1.8-2.8h6.6" stroke="${palette.ice}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M15.8 24.2c2.1-1.1 4.1-.4 5.1 1.3" stroke="${palette.bright}" stroke-opacity=".22" stroke-width="1.2" stroke-linecap="round"/>
  </g>`;
}

await fs.mkdir(outDir, { recursive: true });
const assets = {
  "nav-home.svg": await traceHome(),
  "nav-playground.svg": cubes(),
  "nav-history.svg": screenStack(),
  "nav-watchers.svg": folder(),
  "nav-brain.svg": brain(),
  "nav-heart.svg": heart(),
};
for (const [name, body] of Object.entries(assets)) {
  await fs.writeFile(path.join(outDir, name), svg(body), "utf8");
  console.log(`Wrote ${path.join("public/media/nav", name)}`);
}
await fs.writeFile(
  path.join(outDir, "nav-connections.png"),
  await bakeConnections(),
);
console.log(`Wrote ${path.join("public/media/nav", "nav-connections.png")}`);
