// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://127.0.0.1:8080',
    // pwa.js reloads the page the first time the service worker takes
    // control; mid-test, that reload destroyed the execution context and
    // failed a different handful of tests on every run. Suites that test
    // the reload path itself opt back in with serviceWorkers: 'allow'.
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Loopback only: never bind 0.0.0.0 (see CLAUDE.md).
    command: 'npx http-server -a 127.0.0.1 -p 8080 -c-1',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: !process.env.CI,
  },
});
