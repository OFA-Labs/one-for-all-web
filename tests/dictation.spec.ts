import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { SAMPLE_TRANSCRIPT } from "../src/lib/dictation/contracts";

async function enable(page: Page) {
  await page
    .getByRole("switch", { name: "Enable dictation preview", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.getByRole("checkbox").check();
    await dialog
      .getByRole("button", { name: "Enable preview", exact: true })
      .click();
  }
  await expect(page.getByText("Ready · demo", { exact: true })).toBeVisible();
}
async function begin(page: Page) {
  await page.getByRole("textbox", { name: /preview text$/ }).focus();
  await page.keyboard.press("CapsLock");
  await expect(page.locator("[data-dictation-overlay]")).toHaveAttribute(
    "data-phase",
    "LISTENING",
  );
  await expect(page.locator(".dictation-elapsed")).toHaveText("00:01");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/settings?tab=dictation");
});

test("all mock app tabs, consent and active indicator have valid accessibility relationships", async ({
  page,
}) => {
  const audit = async () => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  };
  for (const app of ["Notepad", "Code editor", "Chat"]) {
    await page.getByRole("tab", { name: app, exact: true }).click();
    await expect(
      page
        .getByRole("region", { name: "Dictation target preview" })
        .getByRole("tabpanel"),
    ).toBeVisible();
    await audit();
  }
  await page
    .getByRole("switch", { name: "Enable dictation preview", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await audit();
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Enable preview", exact: true })
    .click();
  await expect(page.getByText("Ready · demo", { exact: true })).toBeVisible();
  await begin(page);
  await audit();
});

test("off and consent are inert; a held Caps press starts one focus-preserving browser preview", async ({
  page,
}) => {
  await page.keyboard.press("CapsLock");
  await expect(page.locator("[data-dictation-overlay]")).toHaveCount(0);
  await page
    .getByRole("switch", { name: "Enable dictation preview", exact: true })
    .click();
  const consent = page.getByRole("dialog");
  await expect(
    consent.getByRole("button", { name: "Enable preview", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("CapsLock");
  await expect(page.locator("[data-dictation-overlay]")).toHaveCount(0);
  await consent.getByRole("checkbox").check();
  await consent
    .getByRole("button", { name: "Enable preview", exact: true })
    .click();
  await expect(page.getByText("Ready · demo", { exact: true })).toBeVisible();
  const target = page.getByRole("textbox", {
    name: "Notepad preview text",
    exact: true,
  });
  await target.focus();
  await page.keyboard.down("CapsLock");
  for (let count = 0; count < 12; count++) await page.keyboard.down("CapsLock");
  await page.keyboard.up("CapsLock");
  const indicator = page.locator("[data-dictation-overlay]");
  await expect(indicator).toHaveAttribute("data-phase", "LISTENING");
  await expect(target).toBeFocused();
  await expect(indicator.locator(".dictation-elapsed")).toHaveText("00:01");
  await expect(indicator).toHaveAttribute("data-phase", "LISTENING");
  expect((await indicator.boundingBox())!.height).toBe(44);
  await page.keyboard.press("CapsLock");
  await expect(indicator).toHaveAttribute("data-phase", "PROCESSING");
  await expect(target).toHaveValue(SAMPLE_TRANSCRIPT);
  await expect(target).toBeFocused();
  await expect(indicator).toHaveCount(0);
});

test("app switches and minimize do not stop capture; original-target preview receives the exact multiline result", async ({
  page,
}) => {
  await enable(page);
  const text = `${SAMPLE_TRANSCRIPT}\nconst value = { text: "ok" };\n  next();`;
  await page
    .getByRole("textbox", { name: "Simulated transcript", exact: true })
    .fill(text);
  await begin(page);
  await page.getByRole("tab", { name: "Chat", exact: true }).click();
  await page
    .getByRole("button", { name: "Minimize preview window", exact: true })
    .click();
  await expect(page.locator("[data-dictation-overlay]")).toHaveAttribute(
    "data-phase",
    "LISTENING",
  );
  await page.keyboard.press("CapsLock");
  await expect(
    page.getByText(
      "Inserted in Notepad preview only. No external app was changed.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restore preview", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Chat preview text", exact: true }),
  ).toHaveValue("");
  await page.getByRole("tab", { name: "Notepad", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Notepad preview text", exact: true }),
  ).toHaveValue(text);
});

test("retry progress and busy presses retain a failed session until a successful retry", async ({
  page,
}) => {
  await page
    .getByLabel("Dictation service scenario")
    .selectOption("network-error");
  await enable(page);
  await begin(page);
  await page.keyboard.press("CapsLock");
  await expect(page.locator(".dictation-pill-text")).toContainText("retry 1/2");
  await page.keyboard.press("CapsLock");
  await expect(page.locator("[data-dictation-overlay]")).toHaveAttribute(
    "data-phase",
    "PROCESSING",
  );
  await expect(
    page.getByRole("button", { name: "Retry preview", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Dictation service scenario").selectOption("success");
  await page
    .getByRole("button", { name: "Retry preview", exact: true })
    .click();
  await expect(page.locator(".dictation-recent-list article")).toHaveCount(1);
  await expect(
    page.getByRole("textbox", { name: "Notepad preview text", exact: true }),
  ).toHaveValue(SAMPLE_TRANSCRIPT);
  await expect(page.locator(".dictation-recent-list article")).toHaveCount(0);
});

test("fallback leaves external clipboard untouched; explicit Copy text is the only browser clipboard write", async ({
  page,
}) => {
  await page.evaluate(() => {
    (window as unknown as { dictationCopies: string[] }).dictationCopies = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          (
            window as unknown as { dictationCopies: string[] }
          ).dictationCopies.push(value);
        },
      },
    });
  });
  await enable(page);
  await begin(page);
  await page.getByLabel("Dictation target condition").selectOption("closed");
  await page.keyboard.press("CapsLock");
  await expect(
    page.getByRole("textbox", { name: "Preview clipboard text", exact: true }),
  ).toHaveValue(SAMPLE_TRANSCRIPT);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { dictationCopies: string[] }).dictationCopies,
    ),
  ).toEqual([]);
  await page
    .locator(".dictation-preview-clipboard")
    .getByRole("button", { name: "Copy text", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { dictationCopies: string[] }).dictationCopies,
    ),
  ).toEqual([SAMPLE_TRANSCRIPT]);
  await expect(page.locator(".dictation-recent-list article")).toHaveCount(1);
});

test("disable keeps an unfinished preview and the controls menu can disable again without an overlay", async ({
  page,
}) => {
  await enable(page);
  await begin(page);
  await page
    .getByRole("switch", { name: "Enable dictation preview", exact: true })
    .click();
  await expect(page.locator("[data-dictation-overlay]")).toHaveCount(0);
  await expect(page.locator(".dictation-recent-list article")).toHaveCount(1);
  await page.keyboard.press("CapsLock");
  await expect(page.locator("[data-dictation-overlay]")).toHaveCount(0);
  await enable(page);
  await page
    .getByRole("button", { name: "Dictation controls: Ready", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Disable dictation preview", exact: true })
    .click();
  await expect(
    page.getByRole("switch", { name: "Enable dictation preview", exact: true }),
  ).not.toBeChecked();
});

test("interrupted preview recovers after reload while enablement resets to off", async ({
  page,
}) => {
  await enable(page);
  await begin(page);
  await page.reload();
  await expect(
    page.getByRole("switch", { name: "Enable dictation preview", exact: true }),
  ).not.toBeChecked();
  await expect(page.locator(".dictation-recent-list article")).toHaveCount(1);
  await expect(page.locator(".dictation-recent-list")).toContainText(
    "Recovered after the preview closed",
  );
  await enable(page);
  await page
    .getByRole("button", { name: "Retry preview", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Notepad preview text", exact: true }),
  ).toHaveValue(SAMPLE_TRANSCRIPT);
});

test("Caps handling survives site navigation and refuses actual in-page password inputs", async ({
  page,
}) => {
  await enable(page);
  await begin(page);
  await page
    .getByRole("navigation", { name: "Workspace settings", exact: true })
    .getByRole("link", { name: "Settings", exact: true })
    .click();
  await expect(page.locator("[data-dictation-overlay]")).toHaveAttribute(
    "data-phase",
    "LISTENING",
  );
  await page.keyboard.press("CapsLock");
  await expect(page.locator("[data-dictation-overlay]")).toHaveCount(0);
  await page.goto("/settings?tab=dictation");
  // A full reload deliberately disables the preview; enable it explicitly again.
  await enable(page);
  await page
    .getByRole("navigation", { name: "Workspace settings", exact: true })
    .getByRole("link", { name: "Settings", exact: true })
    .click();
  await page
    .getByRole("link", { name: "ONE FOR ALL home", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Workspace shortcuts", exact: true })
    .getByRole("link", { name: "Settings", exact: true })
    .click();
  await page.evaluate(() => {
    const input = document.createElement("input");
    input.type = "password";
    input.setAttribute("aria-label", "Password guard test");
    document.body.append(input);
    input.focus();
  });
  await page.keyboard.press("CapsLock");
  await expect(page.locator(".dictation-pill-text")).toHaveText(
    "Dictation is off in password fields",
  );
});

test("preview uses no microphone or network services, and reduced motion renders a static meter", async ({
  page,
}, testInfo) => {
  const external: string[] = [];
  const allowed = new URL(String(testInfo.project.use.baseURL)).origin;
  page.on("request", (request) => {
    if (
      request.url().startsWith("http") &&
      (new URL(request.url()).origin !== allowed ||
        new URL(request.url()).pathname.startsWith("/v1/"))
    )
      external.push(request.url());
  });
  await page.evaluate(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () => {
          throw new Error("Microphone must never be used");
        },
      },
    });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enable(page);
  await begin(page);
  await expect(page.locator(".dictation-meter")).not.toBeVisible();
  await expect(page.locator(".dictation-static-dot")).toBeVisible();
  await page.keyboard.press("CapsLock");
  await expect(
    page.getByRole("textbox", { name: "Notepad preview text", exact: true }),
  ).toHaveValue(SAMPLE_TRANSCRIPT);
  expect(external).toEqual([]);
});

test("a simulated microphone error is actionable and the next press can start a new preview", async ({
  page,
}) => {
  await page
    .getByLabel("Dictation service scenario")
    .selectOption("mic-denied");
  await enable(page);
  await page
    .getByRole("button", { name: "Start preview", exact: true })
    .click();
  await expect(page.locator(".dictation-pill-text")).toContainText(
    "Mic unavailable",
  );
  await expect(page.locator(".dictation-recent-list article")).toHaveCount(1);
  await page.getByLabel("Dictation service scenario").selectOption("success");
  await page.keyboard.press("CapsLock");
  await expect(page.locator("[data-dictation-overlay]")).toHaveAttribute(
    "data-phase",
    "LISTENING",
  );
  await page
    .getByRole("button", {
      name: "Cancel and discard dictation preview",
      exact: true,
    })
    .click();
  await expect(page.locator("[data-dictation-overlay]")).toHaveCount(0);
});

test("empty speech produces no insertion or retained transcript", async ({
  page,
}) => {
  await page.getByLabel("Dictation service scenario").selectOption("empty");
  await enable(page);
  await begin(page);
  await page.keyboard.press("CapsLock");
  await expect(
    page.getByText("No speech detected. Nothing was inserted.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Notepad preview text", exact: true }),
  ).toHaveValue("");
  await expect(page.locator(".dictation-recent-list article")).toHaveCount(0);
});

test("simulated keyboard availability failure stays inactive and has a retry control", async ({
  page,
}) => {
  await page
    .getByLabel("Dictation service scenario")
    .selectOption("hook-failure");
  await page
    .getByRole("switch", { name: "Enable dictation preview", exact: true })
    .click();
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Enable preview", exact: true })
    .click();
  await expect(
    page
      .getByRole("group", { name: "Dictation preferences", exact: true })
      .getByRole("alert"),
  ).toContainText("Inactive: keyboard preview unavailable");
  await page.keyboard.press("CapsLock");
  await expect(
    page.getByRole("textbox", { name: "Notepad preview text", exact: true }),
  ).toHaveValue("");
  await page.getByLabel("Dictation service scenario").selectOption("success");
  await page
    .getByRole("button", { name: "Retry availability", exact: true })
    .click();
  await expect(page.getByText("Ready · demo", { exact: true })).toBeVisible();
});
