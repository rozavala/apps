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
    // The family is in Santa Clara, CA: pin the zone so date-sensitive tests
    // give the same answer on a UTC dev box, CI and a laptop. Specs that
    // care about another zone set their own timezoneId.
    timezoneId: 'America/Los_Angeles',
    locale: 'en-US',
    // Tests are hermetic: every host except loopback fails to resolve at
    // once. Pages link Google Fonts (a stylesheet, so it holds up the load
    // event) and some apps fetch GitHub/OpenFootball data; on a slow or
    // stalled network `page.goto` waited out the 30 s test timeout, and a
    // different test failed each run. This also keeps headless runs away
    // from the live sync server (*.tail57521e.ts.net, see CLAUDE.md).
    launchOptions: {
      args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost'],
    },
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
