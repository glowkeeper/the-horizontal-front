import { defineConfig, devices } from "@playwright/test";

const browserBaseUrl = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "**/*.e2e.ts",
  outputDir: ".artifacts/playwright",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["line"], ["html", {
    outputFolder: ".artifacts/playwright-report",
    open: "never",
  }]] : "line",
  timeout: 45_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: browserBaseUrl,
    viewport: { width: 1280, height: 720 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort",
    url: browserBaseUrl,
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
  }],
});
