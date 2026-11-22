import { expect, test } from "@playwright/test";

test("one O F A destination preserves task and reading drafts across its modes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Open workspace", exact: true }).click();
  const navigation = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });
  await expect(
    navigation.getByRole("link", { name: "Home", exact: true }),
  ).toHaveCount(1);
  await expect(
    navigation.getByRole("link", { name: /^(Assistant|Reader)$/ }),
  ).toHaveCount(0);
  await page
    .getByLabel("Your request", { exact: true })
    .fill("Keep this task draft.");
  await page.getByRole("tab", { name: "Read & listen", exact: true }).click();
  await page
    .getByLabel("What would you like to hear?", { exact: true })
    .fill("Keep this reading draft. Another sentence.");
  await page.getByLabel("Reading speed", { exact: true }).selectOption("1.5");
  await page
    .getByLabel("Reading voice", { exact: true })
    .selectOption("Bright & warm");
  await page.getByRole("tab", { name: "Ask & act", exact: true }).click();
  await expect(page.getByLabel("Your request", { exact: true })).toHaveValue(
    "Keep this task draft.",
  );
  await page.getByRole("tab", { name: "Read & listen", exact: true }).click();
  await expect(
    page.getByLabel("What would you like to hear?", { exact: true }),
  ).toHaveValue("Keep this reading draft. Another sentence.");
  await expect(page.getByLabel("Reading speed", { exact: true })).toHaveValue(
    "1.5",
  );
  await expect(page.getByLabel("Reading voice", { exact: true })).toHaveValue(
    "Bright & warm",
  );
});

test("legacy Reader links open reading mode in the unified workspace", async ({
  page,
}) => {
  await page.goto("/reader");
  await expect(page).toHaveURL(/\/\?mode=read#ofa-workspace$/);
  await expect(
    page.getByRole("tab", { name: "Read & listen", exact: true }),
  ).toHaveAttribute("data-state", "active");
  await expect(
    page.getByLabel("What would you like to hear?", { exact: true }),
  ).toBeInViewport();
  await expect(
    page.getByRole("heading", { name: "Assistant", exact: true }),
  ).toBeVisible();
});

test("reading finishes without automatically stopping the orb, and Stop interrupts it", async ({
  page,
}) => {
  await page.goto("/?mode=read#ofa-workspace");
  await page
    .getByLabel("What would you like to hear?", { exact: true })
    .fill("One short sentence.");
  await expect(
    page.getByLabel("What would you like to hear?", { exact: true }),
  ).toHaveValue("One short sentence.");
  await page
    .getByRole("button", { name: "Preview reading", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "O F A", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("One short sentence.");
  const video = dialog.getByTestId("voice-animation");
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => !element.paused))
    .toBe(true);
  await expect(dialog).toContainText("Animation playing", { timeout: 8000 });
  expect(
    await video.evaluate((element: HTMLVideoElement) => element.paused),
  ).toBe(false);
  await dialog.getByRole("button", { name: "Stop", exact: true }).click();
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.paused))
    .toBe(true);
  await expect(dialog).toContainText("Stopped");
  await dialog
    .getByRole("button", { name: "Open workspace", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Preview reading", exact: true }),
  ).toBeVisible();
});
