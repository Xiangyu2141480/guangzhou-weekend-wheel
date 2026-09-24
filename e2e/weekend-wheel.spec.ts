import { expect, test } from '@playwright/test';
import {
  expectNoSeriousAxeViolations,
  monitorRuntime,
  tabTo,
} from './helpers';

const viewports = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 1440, height: 900 },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('where-to-go:selected-city:v1', 'guangzhou');
  });
});

const liveActivity = {
  schemaVersion: 2,
  id: 'event:guangzhou:e2e-activity',
  cityId: 'guangzhou',
  name: 'E2E 本周限定活动',
  shortName: 'E2E 活动',
  category: 'art',
  district: '越秀区',
  venue: '广州图书馆测试馆',
  budget: 0,
  budgetLabel: '免费',
  priceStatus: 'free',
  duration: '2小时',
  timeTags: ['short'],
  indoorOutdoor: 'indoor',
  tags: ['展览'],
  emoji: '🎨',
  reason: '验证实时活动加载。',
  mapKeyword: '广州图书馆',
  transport: '地铁可达',
  live: true,
  sourceId: 'gz-library',
  sourceType: 'official-venue',
  sourceName: '广州图书馆',
  sourceUrl: 'https://www.gzlib.org.cn/events/e2e',
  eventStart: '2099-01-01T00:00:00+08:00',
  eventEnd: '2099-12-31T23:59:59+08:00',
  fetchedAt: '2026-09-17T00:00:00+08:00',
  lastVerifiedAt: '2026-09-17T00:00:00+08:00',
  status: 'upcoming',
};

for (const viewport of viewports) {
  test(`fits the ${viewport.width}px viewport with the V2 essentials`, async ({ browser }) => {
    const page = await browser.newPage({ viewport });
    await page.addInitScript(() => {
      window.localStorage.setItem('where-to-go:selected-city:v1', 'guangzhou');
    });
    const expectNoRuntimeErrors = monitorRuntime(page);
    await page.goto('./');

    await expect(page.getByRole('heading', { name: '今天去哪玩？' })).toBeVisible();
    await expect(page.locator('.header-dog [data-mascot-state="point"]')).toBeVisible();
    await expect(page.locator('details.more-filters')).not.toHaveAttribute('open', '');
    await expect(page.locator('.pool-status')).toContainText(/符合 \d+ 个 · 本轮 10 个/);
    await expect(page.getByLabel('广州周末随机转盘')).toBeVisible();
    const sizes = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(sizes.content).toBeLessThanOrEqual(sizes.viewport);
    const candidateIds = (await page.getByLabel('广州周末随机转盘').getAttribute('data-candidate-ids'))?.split(',');
    expect(candidateIds).toHaveLength(10);
    expectNoRuntimeErrors();
    await page.close();
  });
}

test('keeps the stopped sector and result card consistent, then persists a favorite', async ({ page }) => {
  const expectNoRuntimeErrors = monitorRuntime(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const wheel = page.getByLabel('广州周末随机转盘');

  await page.getByRole('button', { name: '开转！' }).click();
  await expect(page.getByRole('button', { name: '命运选择中……' })).toBeDisabled();
  const candidateIds = (await wheel.getAttribute('data-candidate-ids'))!.split(',');
  const dialog = page.getByRole('dialog', { name: '命运决定了！' });
  await expect(dialog).toBeVisible({ timeout: 6_000 });
  await expect(dialog).toContainText('WEEKEND PASS');
  await expect(dialog.locator('[data-mascot-state="ticket"]')).toBeVisible();
  const selectedIndex = Number(await wheel.getAttribute('data-selected-index'));
  const resultId = await dialog.getAttribute('data-activity-id');
  expect(resultId).toBe(candidateIds[selectedIndex]);

  await dialog.getByRole('button', { name: '收藏这个地点' }).click();
  await expect(dialog.getByRole('button', { name: '取消收藏这个地点' })).toBeVisible();
  await expect(dialog.getByRole('link', { name: '去地图看看' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /分享|复制|下载/ })).toHaveCount(0);
  await dialog.getByRole('button', { name: '关闭结果' }).click();

  await page.reload();
  await page.getByRole('button', { name: /我的收藏，共 1 个/ }).click();
  await expect(page.getByRole('dialog', { name: '我的收藏' }).locator('li')).toHaveCount(1);
  expectNoRuntimeErrors();
});

test('offers a one-click reset when filters have no matches', async ({ page }) => {
  const expectNoRuntimeErrors = monitorRuntime(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await page.getByRole('button', { name: '演出' }).click();
  await page.getByText('再挑一点').click();
  await page.getByRole('button', { name: '¥50以内' }).click();

  await expect(page.getByRole('button', { name: '放宽一点条件' })).toBeVisible();
  await page.getByRole('button', { name: '放宽一点条件' }).click();
  await expect(page.getByLabel('广州周末随机转盘')).toBeVisible();
  expectNoRuntimeErrors();
});

test('completes the filtered journey by keyboard and restores focus from both dialogs', async ({ page }) => {
  test.setTimeout(30_000);
  const expectNoRuntimeErrors = monitorRuntime(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-pool-loading', 'false');
  await expectNoSeriousAxeViolations(page);

  const category = page.getByRole('button', { name: '看展' });
  await tabTo(page, category);
  await page.keyboard.press('Enter');
  await expect(category).toHaveAttribute('aria-pressed', 'true');

  const spinButton = page.getByRole('button', { name: '开转！' });
  await tabTo(page, spinButton);
  await page.keyboard.press('Enter');
  const resultDialog = page.getByRole('dialog', { name: '命运决定了！' });
  await expect(resultDialog).toBeVisible({ timeout: 6_000 });
  await expectNoSeriousAxeViolations(page);

  const favoriteButton = resultDialog.getByRole('button', { name: '收藏这个地点' });
  await tabTo(page, favoriteButton);
  await page.keyboard.press('Enter');
  await expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');

  await page.keyboard.press('Escape');
  await expect(resultDialog).toBeHidden();
  await expect(spinButton).toBeFocused();

  const favoritesTrigger = page.getByRole('button', { name: '我的收藏，共 1 个' });
  await tabTo(page, favoritesTrigger);
  await page.keyboard.press('Enter');
  const favoritesDialog = page.getByRole('dialog', { name: '我的收藏' });
  await expect(favoritesDialog).toBeVisible();
  await expect(favoritesDialog.locator('li')).toHaveCount(1);
  await expectNoSeriousAxeViolations(page);

  await page.keyboard.press('Escape');
  await expect(favoritesDialog).toBeHidden();
  await expect(favoritesTrigger).toBeFocused();
  expectNoRuntimeErrors();
});

test('shows the result promptly when reduced motion is requested', async ({ browser }) => {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  await page.addInitScript(() => {
    window.localStorage.setItem('where-to-go:selected-city:v1', 'guangzhou');
  });
  const expectNoRuntimeErrors = monitorRuntime(page);
  await page.goto('./');

  await page.getByRole('button', { name: '开转！' }).click();
  await expect(page.getByRole('dialog', { name: '命运决定了！' })).toBeVisible({
    timeout: 1_000,
  });
  expectNoRuntimeErrors();
  await page.close();
});

const degradedCases = [
  {
    name: 'live 404',
    setup: async (page: Parameters<typeof monitorRuntime>[0]) => {
      await page.route('**/data/live-activities.json', (route) =>
        route.fulfill({ status: 404, body: 'not found' }),
      );
    },
    allowedHttpErrors: [/\/data\/live-activities\.json$/],
    allowedConsoleErrors: [/Failed to load resource: the server responded with a status of 404/],
  },
  {
    name: 'invalid live JSON',
    setup: async (page: Parameters<typeof monitorRuntime>[0]) => {
      await page.route('**/data/live-activities.json', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{"broken":',
        }),
      );
    },
  },
  {
    name: 'only expired live activities',
    setup: async (page: Parameters<typeof monitorRuntime>[0]) => {
      await page.route('**/data/live-activities.json', (route) =>
        route.fulfill({
          json: [{
            ...liveActivity,
            eventStart: '2020-01-01T00:00:00+08:00',
            eventEnd: '2020-01-02T00:00:00+08:00',
          }],
        }),
      );
    },
  },
];

for (const degradedCase of degradedCases) {
  test(`falls back safely when ${degradedCase.name}`, async ({ page }) => {
    await degradedCase.setup(page);
    const expectNoRuntimeErrors = monitorRuntime(page, {
      allowedConsoleErrors: degradedCase.allowedConsoleErrors,
      allowedHttpErrors: degradedCase.allowedHttpErrors,
    });
    await page.goto('./');

    const shell = page.locator('.app-shell');
    await expect(shell).toHaveAttribute('data-pool-loading', 'false');
    await expect(shell).toHaveAttribute('data-pool-availability', 'evergreen-only');
    await expect(shell).toHaveAttribute('data-live-count', '0');
    await expect(page.locator('.pool-status')).toContainText('广州实时活动暂不可用，当前使用常驻灵感');
    await expect(page.getByRole('button', { name: '开转！' })).toBeEnabled();
    expectNoRuntimeErrors();
  });
}

test('keeps the locked result consistent when live data arrives during a spin', async ({ page }) => {
  let releaseLiveResponse = () => {};
  const liveResponseGate = new Promise<void>((resolve) => {
    releaseLiveResponse = resolve;
  });
  await page.route('**/data/cities/guangzhou.json', async (route) => {
    await liveResponseGate;
    await route.fulfill({
      json: {
        schemaVersion: 2,
        cityId: 'guangzhou',
        generatedAt: '2026-09-17T00:00:00+08:00',
        availability: 'fresh',
        sources: [],
        counts: {
          fetched: 1,
          invalid: 0,
          expired: 0,
          duplicate: 0,
          current: 1,
          fallback: 0,
          final: 1,
        },
        warnings: [],
        activities: [liveActivity],
      },
    });
  });
  const expectNoRuntimeErrors = monitorRuntime(page);
  await page.goto('./');

  const wheel = page.getByLabel('广州周末随机转盘');
  const spinButton = page.getByRole('button', { name: '开转！' });
  const candidateIds = (await wheel.getAttribute('data-candidate-ids'))!.split(',');
  await spinButton.click();
  releaseLiveResponse();

  await expect(page.locator('.app-shell')).toHaveAttribute('data-live-count', '1');
  await expect(wheel).toHaveAttribute('data-candidate-ids', candidateIds.join(','));
  const dialog = page.getByRole('dialog', { name: '命运决定了！' });
  await expect(dialog).toBeVisible({ timeout: 6_000 });
  const selectedIndex = Number(await wheel.getAttribute('data-selected-index'));
  expect(await dialog.getAttribute('data-activity-id')).toBe(candidateIds[selectedIndex]);
  expectNoRuntimeErrors();
});
