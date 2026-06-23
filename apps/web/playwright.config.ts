import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Tests run against a local dev server (reused if already running)
 * and a seeded local DB. `global-setup` seeds two deterministic E2E tenants
 * (see packages/database/prisma/seed-e2e.ts) before the suite.
 *
 * Tests share one DB, so they run serially and assert on entities they create
 * themselves (uniquely named) rather than on absolute counts.
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
