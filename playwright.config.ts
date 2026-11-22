import { defineConfig } from "@playwright/test";
import path from "node:path";
process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve(".cache/ms-playwright");
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  retries: 0,
  timeout: 45000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    // Most journeys start from an already-signed-in preview now that "/" and
    // "/onboarding" are guarded. The guest entry flow has its own test.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://127.0.0.1:3100",
          localStorage: [
            { name: "one-for-all-role", value: "member" },
            { name: "one-for-all-onboarding-complete", value: "true" },
          ],
        },
      ],
    },
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
  },
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 45000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } },
    },
  ],
});
