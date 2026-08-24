import { defineConfig, devices } from "@playwright/test";

const previewUrl = "http://localhost:4174";

/**
 * Offline verification runs against the built artefact, not the dev server.
 *
 * The service worker and its precache only exist in the production build, so
 * the ordinary browser suite — which runs against Vite's dev server for speed —
 * cannot exercise them. This configuration builds the release and serves it,
 * which is also the only honest way to test the thing that actually ships.
 */
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "**/*.offline.ts",
  outputDir: ".artifacts/playwright-offline",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  // Matches the browser suite. This suite gates a merge, so a single transient
  // failure should not block one; a reproducible failure still will.
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "line",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: previewUrl,
    viewport: { width: 1280, height: 720 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run build && npx vite preview --port 4174 --strictPort",
    url: previewUrl,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
