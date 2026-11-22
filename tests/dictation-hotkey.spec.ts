import { expect, test, type Page } from "@playwright/test";
import { SAMPLE_TRANSCRIPT } from "../src/lib/dictation/contracts";

async function enable(page: Page) {
  await page.goto("/settings?tab=dictation");
  await page.getByRole("switch", { name: "Enable dictation preview" }).click();
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Enable preview", exact: true })
    .click();
  await expect(page.getByText("Ready · demo", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Notepad preview text" }).focus();
}

async function listening(page: Page) {
  const pill = page.locator("[data-dictation-overlay]");
  await expect(pill).toHaveAttribute("data-phase", "LISTENING");
  await expect(pill.locator(".dictation-elapsed")).toHaveText("00:01");
}

for (const code of ["CapsLock", ""])
  test(`trusted Caps event with unknown key label and ${code || "legacy numeric"} code toggles the full flow`, async ({
    page,
    context,
  }) => {
    await enable(page);
    const client = await context.newCDPSession(page);
    const caps = {
      key: "Unidentified",
      code,
      windowsVirtualKeyCode: 20,
      nativeVirtualKeyCode: 20,
    };
    const tap = async () => {
      await client.send("Input.dispatchKeyEvent", {
        ...caps,
        type: "rawKeyDown",
      });
      await client.send("Input.dispatchKeyEvent", { ...caps, type: "keyUp" });
    };
    await tap();
    await listening(page);
    await expect(page.getByTestId("dictation-shortcut-status")).toContainText(
      "Caps Lock detected · 1 press.",
    );
    await tap();
    await expect(
      page.getByRole("textbox", { name: "Notepad preview text" }),
    ).toHaveValue(SAMPLE_TRANSCRIPT);
    await expect(page.locator("[data-dictation-overlay]")).toHaveCount(0);
    await expect(page.getByTestId("dictation-shortcut-status")).toContainText(
      "Caps Lock detected · 2 presses.",
    );
  });

test("a text control stopping bubbling cannot swallow the consented page shortcut", async ({
  page,
}) => {
  await enable(page);
  const target = page.getByRole("textbox", { name: "Notepad preview text" });
  await target.evaluate((element) => {
    for (const type of ["keydown", "keyup"])
      element.addEventListener(type, (event) => event.stopPropagation());
  });
  await page.keyboard.press("CapsLock");
  await listening(page);
  await expect(target).toBeFocused();
  await page.keyboard.press("CapsLock");
  await expect(target).toHaveValue(SAMPLE_TRANSCRIPT);
  await expect(target).toBeFocused();
});

test("losing a keyup does not block a fresh physical Caps press", async ({
  page,
  context,
}) => {
  await enable(page);
  const client = await context.newCDPSession(page);
  const caps = {
    key: "CapsLock",
    code: "CapsLock",
    windowsVirtualKeyCode: 20,
    nativeVirtualKeyCode: 20,
  };
  await client.send("Input.dispatchKeyEvent", { ...caps, type: "rawKeyDown" });
  await listening(page);
  await client.send("Input.dispatchKeyEvent", { ...caps, type: "rawKeyDown" });
  await client.send("Input.dispatchKeyEvent", { ...caps, type: "keyUp" });
  await expect(
    page.getByRole("textbox", { name: "Notepad preview text" }),
  ).toHaveValue(SAMPLE_TRANSCRIPT);
  await expect(page.locator("[data-dictation-overlay]")).toHaveCount(0);
});

test("focus feedback explains another tab and returning focus keeps the shortcut usable", async ({
  page,
  context,
}) => {
  await enable(page);
  await page.keyboard.press("CapsLock");
  await listening(page);
  const other = await context.newPage();
  await other.goto("about:blank");
  await other.bringToFront();
  await expect(page.getByTestId("dictation-shortcut-status")).toContainText(
    "Page unfocused",
  );
  await other.keyboard.press("CapsLock");
  await expect(page.locator("[data-dictation-overlay]")).toHaveAttribute(
    "data-phase",
    "LISTENING",
  );
  await page.bringToFront();
  await page.getByRole("textbox", { name: "Notepad preview text" }).focus();
  await page.keyboard.press("CapsLock");
  await expect(
    page.getByRole("textbox", { name: "Notepad preview text" }),
  ).toHaveValue(SAMPLE_TRANSCRIPT);
  await other.close();
});

test("modified and forwarded Caps events explain why they were ignored", async ({
  page,
}) => {
  await enable(page);
  const feedback = page.getByTestId("dictation-shortcut-status");
  await page.keyboard.press("Shift+CapsLock");
  await expect(feedback).toContainText("Release Shift, Ctrl, Alt and Windows");
  await expect(page.locator("[data-dictation-overlay]")).toHaveCount(0);
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "CapsLock" }));
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "CapsLock" }));
  });
  await expect(feedback).toContainText("Forwarded Caps Lock event blocked");
  await expect(page.locator("[data-dictation-overlay]")).toHaveCount(0);
  await page.keyboard.press("CapsLock");
  await listening(page);
  await expect(feedback).toContainText("Caps Lock detected · 1 press.");
});
