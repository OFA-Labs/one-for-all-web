import { test, expect } from "@playwright/test";
for (const width of [375, 1440]) {
  test(`O F A starts with its small centered orb at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/");
    const stage = page.locator(".assistant-hero");
    await expect(stage).toBeVisible();
    const bounds = (await stage.boundingBox())!;
    // The hero is a focused, single-screen stage on desktop and is shortened on
    // phones so the workspace controls appear in the first screen.
    expect(bounds).toEqual({ x: 0, y: 0, width, height: width > 700 ? 960 : 460 });
    const orb = (await page
      .locator(".hero-orb-button .voice-video-stage")
      .boundingBox())!;
    expect(orb.width).toBeLessThanOrEqual(width > 700 ? 64 : 92);
    expect(orb.x + orb.width / 2).toBeCloseTo(width / 2, 1);
    const orbCenter = orb.y + orb.height / 2;
    expect(orbCenter).toBeGreaterThan(100);
    expect(orbCenter).toBeLessThan(520);
    await expect(
      page.getByRole("button", { name: "Tap to speak", exact: true }),
    ).toBeInViewport();
    await expect(
      page.getByRole("navigation", { name: "Workspace shortcuts" }),
    ).toBeVisible();
    await expect(page.locator(".sidebar")).not.toBeVisible();
    const workspace = page.getByRole("region", {
      name: "O F A workspace",
      exact: true,
    });
    expect((await workspace.boundingBox())!.y).toBeGreaterThanOrEqual(
      width > 700 ? 960 : 460,
    );
    await page
      .getByRole("link", { name: "Open workspace", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Assistant", exact: true }),
    ).toBeInViewport();
    await expect(
      page.getByLabel("Your request", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Read & listen", exact: true }),
    ).toBeVisible();
    if (width > 700) await expect(page.locator(".sidebar")).toBeVisible();
  });
  test(`tapping the small orb opens the larger O F A session at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/");
    const trigger = page.getByRole("button", {
      name: "Tap to speak",
      exact: true,
    });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "O F A", exact: true });
    await expect(dialog).toBeVisible();
    const disc = (await dialog.locator(".ofa-session-orb").boundingBox())!;
    expect(disc.width).toBe(215);
    expect(disc.height).toBe(215);
    const orb = (await dialog.locator(".voice-video-stage").boundingBox())!;
    // The globe sits compactly inside the black disc with breathing room.
    expect(orb.width).toBeGreaterThan(150);
    expect(orb.width).toBeLessThan(disc.width - 20);
    expect(orb.height).toBeCloseTo(orb.width, 0);
    expect(orb.x - disc.x).toBeCloseTo(disc.x + disc.width - orb.x - orb.width, 0);
    await expect(page.locator(".ofa-orb-overlay")).toHaveCSS(
      "backdrop-filter",
      "blur(16px)",
    );
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
