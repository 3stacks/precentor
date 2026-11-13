import { defineConfig, devices } from '@playwright/test'

// The release tests of the web app. They run on the build in dist/. Run `npm run build` first.
const port = Number(process.env.E2E_PORT ?? 18180)

export default defineConfig({
  testDir: 'e2e/web',
  outputDir: 'test-results',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    // The service worker keeps old files. Each test must load the build from the server.
    serviceWorkers: 'block',
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `node e2e/web/serve.mjs ${port}`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } },
    },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
