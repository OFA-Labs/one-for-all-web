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
    expect(bounds).toEqual({
      x: 0,
      y: 0,
      width,
      height: width > 700 ? 960 : 460,
    });
    const copy = (await page.locator(".ofa-hero-center").boundingBox())!;
    expect(copy.x + copy.width / 2).toBeCloseTo(width / 2, 1);
    expect(copy.y).toBeGreaterThan(60);
    expect(copy.y + copy.height).toBeLessThan(300);
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
  test(`tapping speak shows the orb inside the head at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/");
    const trigger = page.getByRole("button", {
      name: "Tap to speak",
      exact: true,
    });
    await trigger.click();
    const slot = page.locator(".home-hero-orb-slot");
    await expect(slot).toBeVisible();
    await expect(
      page.getByRole("dialog", { name: "O F A", exact: true }),
    ).toHaveCount(0);
    const orb = (await slot.boundingBox())!;
    const head = (await page.locator(".home-hero-gaze").boundingBox())!;
    expect(orb.width).toBeCloseTo(orb.height, 0);
    expect(orb.x + orb.width / 2).toBeCloseTo(head.x + head.width * 0.4995, 0);
    expect(orb.y + orb.height / 2).toBeCloseTo(
      head.y + head.height * 0.4985,
      0,
    );
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    await expect(slot).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
}
