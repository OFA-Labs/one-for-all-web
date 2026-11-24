import { expect, test, type Locator } from "@playwright/test";

test("artwork stays transparent while the active slot uses a calm theme surface", async ({
  page,
}) => {
  await page.goto("/arc-reactor");
  for (const theme of ["obsidian", "aurora"]) {
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    for (const selector of [
      ".sidebar .nav-artwork",
      ".sidebar .reactor-visual",
      ".sidebar .arc-toggle",
      ".sidebar .watcher-seen",
    ]) {
      for (const element of await page.locator(selector).all()) {
        await expect(element).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      }
    }
    for (const link of await page
      .locator(".sidebar .nav-link:not(.active)")
      .all()) {
      await expect(link).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    }
    const active = page.locator(".sidebar .nav-link.active");
    await expect(active).toHaveCount(1);
    expect(
      await active.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).not.toBe("rgba(0, 0, 0, 0)");
    for (const image of await page
      .locator(".sidebar .nav-artwork-image.is-monochrome")
      .all()) {
      await expect(image).toHaveCSS("filter", /url\(/);
    }
    const home = page.locator('.sidebar a.nav-link[href="/"]');
    await home.hover();
    expect(
      await home.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).not.toBe("rgba(0, 0, 0, 0)");
    await page.mouse.move(500, 80);
    await expect(home).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  }
});

test("the active indicator slides between every navigation group", async ({
  page,
}) => {
  await page.goto("/arc-reactor");
  const indicator = page.locator(".sidebar .nav-indicator");
  await expect(indicator).toHaveCSS("opacity", "1");
  expect((await indicator.boundingBox())!.width).toBeLessThanOrEqual(3);

  const center = async (locator: Locator) => {
    const box = (await locator.boundingBox())!;
    return box.y + box.height / 2;
  };
  const main = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });
  const settings = page.getByRole("navigation", {
    name: "Workspace settings",
    exact: true,
  });
  const active = main.getByRole("link", {
    name: "OFA Engine",
    exact: true,
  });
  expect(Math.abs((await center(indicator)) - (await center(active)))).toBeLessThanOrEqual(1);
  const before = await center(indicator);

  await main
    .getByRole("link", { name: "Playground", exact: true })
    .click();
  await expect(page).toHaveURL(/\/playground$/);
  await page.waitForTimeout(400);
  const playground = main.getByRole("link", {
    name: "Playground",
    exact: true,
  });
  expect(
    Math.abs((await center(indicator)) - (await center(playground))),
  ).toBeLessThanOrEqual(1);
  expect(await center(indicator)).not.toBe(before);

  await settings
    .getByRole("link", { name: "Connections", exact: true })
    .click();
  await expect(page).toHaveURL(/\/connections$/);
  await page.waitForTimeout(400);
  const connections = settings.getByRole("link", {
    name: "Connections",
    exact: true,
  });
  expect(
    Math.abs((await center(indicator)) - (await center(connections))),
  ).toBeLessThanOrEqual(1);
});

test("the compact icon navigation hides labels and shows names on hover and focus", async ({
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
    expect((await link.boundingBox())!.height).toBeCloseTo(64, 1);
    // The accessible section name takes no space alongside its icon.
    const label = link.locator(".sr-only");
    expect((await label.boundingBox())!.width).toBeLessThanOrEqual(1);
  }
  const slots = await navigation.locator(".nav-link").evaluateAll((links) =>
    links.map((link) => {
      const box = link.getBoundingClientRect();
      const artwork = link
        .querySelector(".nav-icon")!
        .getBoundingClientRect();
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        axis: artwork.x + artwork.width / 2,
        artwork: artwork.width,
      };
    }),
  );
  for (const [index, slot] of slots.entries()) {
    expect(slot.width).toBeCloseTo(64, 1);
    expect(slot.height).toBeCloseTo(64, 1);
    expect(slot.x).toBeCloseTo(slots[0].x, 1);
    expect(slot.axis).toBeCloseTo(slots[0].axis, 1);
    expect(slot.artwork).toBeCloseTo(48, 1);
    if (index > 0) expect(slot.y - slots[index - 1].y).toBeCloseTo(72, 1);
  }
  const settingsSlots = await page
    .locator(".sidebar-lower .nav-link")
    .evaluateAll((links) =>
      links.map((link) => {
        const box = link.getBoundingClientRect();
        return { x: box.x, width: box.width, height: box.height };
      }),
    );
  for (const slot of settingsSlots) {
    expect(slot.width).toBeCloseTo(64, 1);
    expect(slot.height).toBeCloseTo(64, 1);
    expect(slot.x).toBeCloseTo(slots[0].x, 1);
  }
  const home = navigation.getByRole("link", { name: "Home", exact: true });
  await expect(home.locator("img")).toHaveAttribute(
    "src",
    "/media/nav/nav-home.svg",
  );
  await expect(
    navigation
      .getByRole("link", { name: "e-brain", exact: true })
      .locator("img"),
  ).toHaveAttribute("src", "/media/nav/nav-brain.svg");
  for (const [name, source] of [
    ["Playground", "/media/nav/nav-playground.svg"],
    ["Watchers", "/media/nav/nav-watchers.svg"],
    ["History", "/media/nav/nav-history.svg"],
    ["Connections", "/media/nav/nav-connections.png"],
    ["Settings", "/media/settings-gears.webp"],
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
    "Shared memory for Claude Code, Codex and the voice agent.",
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
  ).toHaveAttribute("src", "/media/nav/nav-home.svg");
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
    .toEqual({ x: 0, y: 0, width: 88 });
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

test("the rail scrolls at short viewport heights without losing the last item", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 520 });
  await page.goto("/arc-reactor");
  const sidebar = page.locator(".sidebar");
  const metrics = await sidebar.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    overflowY: getComputedStyle(element).overflowY,
    scrollbarWidth: getComputedStyle(element).scrollbarWidth,
  }));
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  expect(metrics.overflowY).toBe("auto");
  expect(metrics.scrollbarWidth).toBe("none");

  const developer = page
    .getByRole("navigation", { name: "Workspace settings", exact: true })
    .getByRole("link", { name: "Developer handoff", exact: true });
  await developer.scrollIntoViewIfNeeded();
  await expect(developer).toBeInViewport();
  await developer.click();
  await expect(page).toHaveURL(/\/handoff$/);
});
