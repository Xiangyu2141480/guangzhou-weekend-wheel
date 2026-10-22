import { expect, test, type Page } from '@playwright/test';
import { monitorRuntime } from './helpers';

const origin = 'https://runtime-monitor.test';
const asset = '/assets/run-monitor.png';

async function failedAsset(page: Page, kind: 'image' | 'script', status?: number) {
  await page.route(`${origin}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === asset) {
      if (status) await route.fulfill({ status, contentType: 'text/plain', body: 'unavailable' });
      else await route.abort('aborted');
      return;
    }
    await route.fulfill({
      contentType: 'text/html',
      body: kind === 'image'
        ? `<img class="yuwan-mascot" src="${asset}" alt="鱼丸">`
        : `<script src="${asset}"></script>`,
    });
  });
  const finished = status
    ? page.waitForResponse((response) => response.url().endsWith(asset))
    : page.waitForEvent('requestfailed', (request) => request.url().endsWith(asset));
  await page.goto(origin, { waitUntil: 'load' });
  await finished;
}

test('已被状态切换撤销的旧鱼丸图片请求不算资源故障', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await failedAsset(page, 'image');
  await page.locator('img').evaluate((image) => image.remove());
  await expect(Promise.resolve().then(assertRuntime)).resolves.toBeUndefined();
});

test('仍在使用的图片即使取消也必须报告', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await failedAsset(page, 'image');
  await expect(Promise.resolve().then(assertRuntime)).rejects.toThrow(/ERR_ABORTED/);
});

test('脚本请求取消不能当作图片切换忽略', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await failedAsset(page, 'script');
  await expect(Promise.resolve().then(assertRuntime)).rejects.toThrow(/ERR_ABORTED/);
});

test('图片真实HTTP错误不能因元素随后移除而忽略', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await failedAsset(page, 'image', 503);
  await page.locator('img').evaluate((image) => image.remove());
  await expect(Promise.resolve().then(assertRuntime)).rejects.toThrow(/503/);
});
