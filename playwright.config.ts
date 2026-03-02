import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['allure-playwright'],
  ],
  timeout: 30_000,

  use: {
    baseURL: 'https://previz-engine-m1mm9ayva-valid.vercel.app',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /mobile\.spec/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: /mobile\.spec/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: /mobile\.spec/,
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
