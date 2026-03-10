import { defineConfig, devices } from "@playwright/test"

const isE2E = !!process.env.E2E_TEST
const port = isE2E ? 3100 : 3000
const baseURL = `http://localhost:${port}`
const serverCommand = isE2E
  ? `PORT=${port} NEXTAUTH_URL=${baseURL} AUTH_TRUST_HOST=true node .next/standalone/server.js`
  : `PORT=${port} NEXTAUTH_URL=${baseURL} AUTH_TRUST_HOST=true npm run dev`

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /global-setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/session.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: serverCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI && !isE2E,
    timeout: 120_000,
  },
})
