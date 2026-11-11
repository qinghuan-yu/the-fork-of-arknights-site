import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const channel = process.env.PLAYWRIGHT_BROWSER_CHANNEL || 'chrome';

export default defineConfig({
  testDir: './tests',
  testMatch: 'frontend.spec.mjs',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  use: {
    baseURL,
    ...(executablePath ? { launchOptions: { executablePath } } : { channel }),
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'node ../server.mjs',
    url: baseURL,
    // Do not accidentally verify a stale build or a different local application.
    reuseExistingServer: false,
  },
});
