import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  reporter: 'line',
  use: {
    baseURL: process.env['EC_FRONTEND_URL'] ?? 'http://localhost:4200',
    channel: 'chrome',
    headless: true,
  },
});
