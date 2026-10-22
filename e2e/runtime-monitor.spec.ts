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

test('相同URL被新的屏外lazy图片引用时必须实际加载成功才能排除旧取消', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await failedAsset(page, 'image');
  await page.route(`${origin}${asset}`, async (route) => {
    await route.fulfill({ contentType: 'image/png', body: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=',
      'base64',
    ) });
  });
  await page.locator('img').evaluate((image) => {
    const next = image.cloneNode() as HTMLImageElement;
    next.loading = 'lazy';
    next.style.cssText = 'position:absolute;top:10000px;width:1px;height:1px';
    image.replaceWith(next);
  });
  expect(await page.locator('img').evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(0);

  await expect(Promise.resolve().then(assertRuntime)).resolves.toBeUndefined();
  expect(await page.locator('img').evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(1);
});

test('等待旧图片恢复时发生的新取消仍必须报告', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await failedAsset(page, 'image');
  let recoveryStarted!: () => void;
  let releaseRecovery!: () => void;
  let releaseLateFailure!: () => void;
  const started = new Promise<void>((resolve) => { recoveryStarted = resolve; });
  const recoveryGate = new Promise<void>((resolve) => { releaseRecovery = resolve; });
  const failureGate = new Promise<void>((resolve) => { releaseLateFailure = resolve; });
  await page.route(`${origin}${asset}`, async (route) => {
    recoveryStarted();
    await recoveryGate;
    await route.fulfill({ contentType: 'image/png', body: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=',
      'base64',
    ) });
  });
  const lateAsset = '/assets/think-monitor.png';
  await page.route(`${origin}${lateAsset}`, async (route) => {
    await failureGate;
    await route.abort('aborted');
  });
  await page.locator('img').evaluate((image, lateUrl) => {
    const next = image.cloneNode() as HTMLImageElement;
    next.loading = 'lazy';
    next.style.cssText = 'position:absolute;top:10000px;width:1px;height:1px';
    image.replaceWith(next);
    const late = document.createElement('img');
    late.className = 'yuwan-mascot';
    late.src = lateUrl;
    document.body.append(late);
  }, lateAsset);
  const failed = page.waitForEvent('requestfailed', (request) => request.url().endsWith(lateAsset));
  const verification = assertRuntime();
  await started;
  releaseLateFailure();
  await failed;
  releaseRecovery();

  await expect(verification).rejects.toThrow(/think-monitor.*ERR_ABORTED/);
});

test('等待解码时替换的同URL实例未恢复仍必须报告', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await failedAsset(page, 'image');
  let recoveryStarted!: () => void;
  let releaseFailure!: () => void;
  const started = new Promise<void>((resolve) => { recoveryStarted = resolve; });
  const gate = new Promise<void>((resolve) => { releaseFailure = resolve; });
  await page.route(`${origin}${asset}`, async (route) => {
    recoveryStarted();
    await gate;
    await route.abort('aborted');
  });
  const replaceWithLazy = () => page.locator('img').evaluate((image) => {
    const next = image.cloneNode() as HTMLImageElement;
    next.loading = 'lazy';
    next.style.cssText = 'position:absolute;top:10000px;width:1px;height:1px';
    image.replaceWith(next);
  });
  await replaceWithLazy();
  const verification = assertRuntime();
  await started;
  await replaceWithLazy();
  releaseFailure();

  await expect(verification).rejects.toThrow(/run-monitor.*ERR_ABORTED/);
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
