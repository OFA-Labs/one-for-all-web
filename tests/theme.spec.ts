import { test, expect, type Page } from "@playwright/test";

type Theme = {
  id: string;
  name: string;
  caption: string;
  canvas: string;
  sidebar: string;
  card: string;
  inner: string;
  innerText: string;
};

/** The exact surfaces required by the three-theme specification. */
const THEMES: Theme[] = [
  {
    id: "obsidian",
    name: "Obsidian",
    caption: "Pure Black",
    canvas: "rgb(0, 0, 0)",
    sidebar: "rgb(5, 5, 5)",
    card: "rgb(9, 9, 9)",
    inner: "rgb(16, 16, 16)",
    innerText: "rgb(255, 255, 255)",
  },
  {
    id: "titanium",
    name: "Titanium",
    caption: "Black + Grey",
    canvas: "rgb(52, 52, 52)",
    sidebar: "rgb(41, 41, 41)",
    card: "rgb(41, 41, 41)",
    inner: "rgb(255, 255, 255)",
    innerText: "rgb(0, 0, 0)",
  },
  {
    id: "aurora",
    name: "Aurora",
    caption: "White + Grey + Black",
    canvas: "rgb(255, 255, 255)",
    sidebar: "rgb(247, 247, 247)",
    card: "rgb(166, 166, 166)",
    inner: "rgb(23, 23, 23)",
    innerText: "rgb(255, 255, 255)",
  },
];

async function openMenu(page: Page) {
  await page.getByRole("button", { name: /^Theme:/ }).click();
}

async function chooseTheme(page: Page, name: string) {
  await openMenu(page);
  await page.getByRole("menuitemradio", { name: new RegExp(name) }).click();
  // Several surfaces have short colour transitions; wait for them to settle.
  await page.waitForTimeout(250);
}

async function styleOf(page: Page, selector: string, property: string) {
  return page.locator(selector).first().evaluate((el, prop) => {
    return (getComputedStyle(el) as unknown as Record<string, string>)[prop];
  }, property);
}

test("shows exactly three themes and defaults to Obsidian", async ({ page }) => {
  await page.goto("/playground");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "obsidian");
  await expect(page.locator(".theme-trigger-name")).toHaveText("Obsidian");

  await openMenu(page);
  const options = page.getByRole("menuitemradio");
  await expect(options).toHaveCount(3);
  for (const [i, t] of THEMES.entries()) {
    await expect(options.nth(i)).toContainText(t.name);
    await expect(options.nth(i)).toContainText(t.caption);
  }
  await expect(options.nth(0)).toHaveAttribute("aria-checked", "true");
  await expect(options.nth(1)).toHaveAttribute("aria-checked", "false");
  await expect(options.nth(2)).toHaveAttribute("aria-checked", "false");

  // Each option previews canvas / outer card / inner card with the real tokens.
  const swatch = options.nth(2).locator(".theme-swatch i");
  await expect(swatch).toHaveCount(3);
});

for (const theme of THEMES)
  test(`${theme.id}: specified surfaces apply across shared components`, async ({
    page,
  }) => {
    await page.goto("/playground");
    await chooseTheme(page, theme.name);

    await expect(page.locator("html")).toHaveAttribute("data-theme", theme.id);
    expect(await styleOf(page, ".topbar", "backgroundColor")).toBe(theme.canvas);
    expect(await styleOf(page, ".sidebar", "backgroundColor")).toBe(theme.sidebar);
    expect(await styleOf(page, ".scenario-card", "backgroundColor")).toBe(
      theme.card,
    );
    // Inner content panel keeps its own text colour in every theme.
    expect(await styleOf(page, ".notice", "backgroundColor")).toBe(theme.inner);
    expect(await styleOf(page, ".notice", "color")).toBe(theme.innerText);

    await page.goto("/history");
    expect(await styleOf(page, ".history-calendar", "backgroundColor")).toBe(
      theme.card,
    );
    await page.goto("/watchers");
    expect(await styleOf(page, ".panel", "backgroundColor")).toBe(theme.card);
  });

test("persists the selection after refresh and client navigation", async ({
  page,
}) => {
  await page.goto("/playground");
  await chooseTheme(page, "Titanium");
  expect(await page.evaluate(() => localStorage.getItem("one-for-all-theme"))).toBe(
    "titanium",
  );

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "titanium");
  await expect(page.locator(".theme-trigger-name")).toHaveText("Titanium");

  await page.goto("/settings");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "titanium");
});

test("switching is instant: no reload and no component remount", async ({
  page,
}) => {
  await page.goto("/history");
  const search = page.getByPlaceholder("Search task history");
  await search.fill("keep me");
  await page.evaluate(() => {
    (window as unknown as Record<string, unknown>).__themeSentinel = true;
  });

  await chooseTheme(page, "Aurora");

  expect(
    await page.evaluate(
      () =>
        (window as unknown as Record<string, unknown>).__themeSentinel === true,
    ),
  ).toBe(true);
  await expect(search).toHaveValue("keep me");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "aurora");
});

test("selector keyboard and dismissal behaviour", async ({ page }) => {
  await page.goto("/playground");
  const trigger = page.getByRole("button", { name: /^Theme:/ });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu", { name: "Premium themes" })).toHaveCount(0);

  await trigger.click();
  await page.locator("main h1").click();
  await expect(page.getByRole("menu", { name: "Premium themes" })).toHaveCount(0);
});

test("no runtime errors while switching themes on any route", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  for (const route of ["/playground", "/history", "/watchers", "/"]) {
    await page.goto(route);
    for (const theme of THEMES) await chooseTheme(page, theme.name);
  }
  expect(errors).toEqual([]);
});
