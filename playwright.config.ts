import { defineConfig } from '@playwright/test';

const remoteBaseUrl = process.env.QA_BASE_URL;
const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './e2e',
  timeout: 15_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: remoteBaseUrl ?? 'http://127.0.0.1:4173/guangzhou-weekend-wheel/',
    browserName: 'chromium',
    colorScheme: 'light',
    locale: 'zh-CN',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    launchOptions: chromiumExecutablePath
      ? { executablePath: chromiumExecutablePath }
      : undefined,
  },
  webServer: remoteBaseUrl
    ? undefined
    : {
        command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
        url: 'http://127.0.0.1:4173/guangzhou-weekend-wheel/',
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
