import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 15_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173/guangzhou-weekend-wheel/',
    browserName: 'chromium',
    colorScheme: 'light',
    locale: 'zh-CN',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/guangzhou-weekend-wheel/',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
