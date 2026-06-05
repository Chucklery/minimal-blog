// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: 1,
  use: {
    baseURL: 'http://localhost:8088',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
  },
  webServer: {
    command: 'npx serve dist -l 8088',
    port: 8088,
    reuseExistingServer: true,
  },
});
