import { expect, test } from "@playwright/test";

test("navigation icons have no individual fills or paper backgrounds in any theme", async ({
  page,
}) => {
  await page.goto("/arc-reactor");
  for (const theme of ["obsidian", "titanium", "aurora"]) {
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    for (const selector of [
      ".sidebar .nav-link",
      ".sidebar .nav-artwork",
      ".sidebar .reactor-visual",
      ".sidebar .watcher-eye",
      ".sidebar .arc-toggle",
      ".sidebar .watcher-seen",
      ".sidebar-person .avatar",
    ]) {
      for (const element of await page.locator(selector).all()) {
        await expect(element).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      }
    }
    for (const image of await page
      .locator(".sidebar .nav-artwork-image.is-monochrome")
      .all()) {
      await expect(image).toHaveCSS("filter", /url\(/);
    }
    await page
      .locator('.sidebar a[href="/"]')
      .filter({ has: page.locator(".nav-artwork") })
      .hover();
    await expect(page.locator('.sidebar a.nav-link[href="/"]')).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
  }
});

test("the larger icon navigation hides labels and shows names on hover and focus", async ({
  page,
}) => {
  await page.goto("/arc-reactor");
  const navigation = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });
  await expect(navigation.getByRole("link")).toHaveCount(6);
  for (const name of [
    "Home",
    "Playground",
    "History",
    "Watchers",
    "OFA Engine",
    "e-brain",
  ]) {
    const link = navigation.getByRole("link", { name, exact: true });
    await expect(link).toBeVisible();
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(64);
    // The accessible section name takes no space alongside its icon.
    const label = link.locator(".sr-only");
    expect((await label.boundingBox())!.width).toBeLessThanOrEqual(1);
  }
  const home = navigation.getByRole("link", { name: "Home", exact: true });
  await expect(home.locator("img")).toHaveAttribute(
    "src",
    "/media/home-relaxing.webp",
  );
  await expect(
    navigation
      .getByRole("link", { name: "e-brain", exact: true })
      .locator("img"),
  ).toHaveAttribute("src", "/media/e-brain-mark.webp");
  for (const [name, source] of [
    ["Connections", "/media/connections-plugs.webp"],
    ["Settings", "/media/settings-gears.webp"],
    ["History", "/media/history-plugins.webp"],
  ]) {
    await expect(
      page
        .locator(".sidebar")
        .getByRole("link", { name, exact: true })
        .locator("img"),
    ).toHaveAttribute("src", source);
  }
  await home.hover();
  await expect(page.getByRole("tooltip")).toHaveText("Home");
  await page.mouse.move(500, 80);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await navigation
    .getByRole("link", { name: "Playground", exact: true })
    .focus();
  await expect(page.getByRole("tooltip")).toHaveText("Playground");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("opening e-brain shows the supplied mark, section title, and purpose", async ({
  page,
}) => {
  await page.goto("/arc-reactor");
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "e-brain", exact: true })
    .click();
  await expect(page).toHaveURL(/\/e-brain$/);
  await expect(
    page.getByRole("heading", { name: "e-brain", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".page-title p")).toHaveText(
    "A home for the knowledge and context your assistant can use.",
  );
  const artwork = page.getByRole("img", {
    name: "e-brain: a brain inside the letter e",
  });
  await expect(artwork).toBeVisible();
  await expect(artwork).toHaveAttribute("src", "/media/e-brain-mark.webp");
  await expect
    .poll(() =>
      artwork.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBe(true);
});

test("mobile navigation uses icons and keeps the resting engine after switching off", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/arc-reactor");
  const quickNavigation = page.getByRole("navigation", {
    name: "Mobile quick navigation",
  });
  const engine = quickNavigation.getByRole("link", {
    name: "OFA Engine",
    exact: true,
  });
  await expect(engine.locator("video")).toBeVisible();
  await page.locator(".reactor-stage").click();
  await expect(page.locator(".reactor-panel")).toHaveAttribute(
    "data-reactor-state",
    "active",
  );
  await page.locator(".reactor-stage").click();
  await expect(page.locator(".reactor-panel")).toHaveAttribute(
    "data-reactor-state",
    "idle",
  );
  await expect(engine.locator(".reactor-visual")).toHaveCSS("opacity", "1");
  await expect(engine.locator("video")).toBeVisible();
  await expect(engine.locator("video")).toHaveCSS("transform", "none");
  await expect
    .poll(() =>
      engine.locator("video").evaluate((v: HTMLVideoElement) => v.paused),
    )
    .toBe(true);
  await expect(
    quickNavigation
      .getByRole("link", { name: "Home", exact: true })
      .locator("img"),
  ).toHaveAttribute("src", "/media/home-relaxing.webp");
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  const drawer = page.getByRole("dialog", { name: "Navigation", exact: true });
  await expect(drawer).toBeVisible();
  await expect
    .poll(async () => {
      const bounds = await drawer.boundingBox();
      return { x: bounds?.x, y: bounds?.y, width: bounds?.width };
    })
    .toEqual({ x: 0, y: 0, width: 112 });
  await expect(
    drawer.getByRole("link", { name: "Connections", exact: true }),
  ).toBeVisible();
  await drawer.getByRole("link", { name: "e-brain", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "e-brain", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});
