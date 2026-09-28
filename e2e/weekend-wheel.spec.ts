import { expect, test, type Page } from '@playwright/test';
import type { CityId } from '../src/data/cities';
import {
  expectNoSeriousAxeViolations,
  launchCities,
  makeLiveActivity,
  makeSnapshot,
  mockDataRoutes,
  monitorRuntime,
} from './helpers';

const selectedCityKey = 'where-to-go:selected-city:v1';
const viewports = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 1440, height: 900 },
];

async function startInCity(page: Page, cityId: CityId) {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [selectedCityKey, cityId],
  );
  await mockDataRoutes(page);
  await page.goto('./');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-pool-loading', 'false');
}

test('首访选择上海，刷新后保持上海', async ({ page }) => {
  await mockDataRoutes(page);
  const expectNoRuntimeErrors = monitorRuntime(page);
  await page.goto('./');

  const selector = page.getByRole('dialog', { name: '先选一座城市' });
  await expect(selector).toBeVisible();
  await expectNoSeriousAxeViolations(page);
  await selector.getByRole('button', { name: '上海' }).click();
  await expect(page.locator('.app-shell')).toHaveAttribute('data-city-id', 'shanghai');
  await expect(page.getByRole('button', { name: '当前城市：上海，点击切换城市' })).toBeVisible();

  await page.reload();
  await expect(page.locator('.app-shell')).toHaveAttribute('data-city-id', 'shanghai');
  await expect(page.getByRole('dialog', { name: '先选一座城市' })).toHaveCount(0);
  expectNoRuntimeErrors();
});

test('上海切换深圳会清空筛选、结果和行政区，且不混入跨城活动', async ({ page }) => {
  await startInCity(page, 'shanghai');
  const expectNoRuntimeErrors = monitorRuntime(page);
  await page.getByRole('button', { name: '看展' }).click();
  await page.getByText('再挑一点').click();
  await page.getByRole('button', { name: '黄浦区' }).click();
  await page.getByRole('button', { name: '开转！' }).click();
  const result = page.getByRole('dialog', { name: '命运决定了！' });
  await expect(result).toBeVisible();
  await result.getByRole('button', { name: '关闭结果' }).click();

  await page.getByRole('button', { name: '当前城市：上海，点击切换城市' }).click();
  await page.getByRole('dialog', { name: '切换城市' }).getByRole('button', { name: '深圳' }).click();

  const shell = page.locator('.app-shell');
  await expect(shell).toHaveAttribute('data-city-id', 'shenzhen');
  await expect(page.getByRole('button', { name: '看展' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: '黄浦区' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '福田区' })).toBeVisible();
  await expect(page.getByLabel('深圳周末随机转盘')).toHaveAttribute(
    'data-candidate-ids',
    /^(?:place|event):shenzhen:/,
  );
  expect((await page.getByLabel('深圳周末随机转盘').getAttribute('data-candidate-ids'))!
    .split(',')
    .every((id) => id.startsWith('place:shenzhen:') || id.startsWith('event:shenzhen:')))
    .toBe(true);
  expectNoRuntimeErrors();
});

test('迁移旧 gzww 广州收藏且保留无法映射的记录', async ({ page }) => {
  await page.addInitScript(([key, cityKey]) => {
    window.localStorage.setItem(cityKey, 'shanghai');
    window.localStorage.setItem(key, JSON.stringify([
      'guangdong-museum',
      'guangdong-museum',
      'removed-guangzhou-place',
    ]));
  }, ['gzww:favorites', selectedCityKey]);
  await mockDataRoutes(page);
  await page.goto('./');

  await page.getByRole('button', { name: /我的收藏，共 2 个/ }).click();
  const favorites = page.getByRole('dialog', { name: '我的收藏' });
  await expect(favorites.locator('li')).toHaveCount(2);
  await expect(favorites).toContainText('广东省博物馆');
  await expect(favorites).toContainText('原广州收藏暂不可用');
  const migrated = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('where-to-go:favorites:v2') ?? '[]'));
  expect(migrated).toHaveLength(2);
  expect(await page.evaluate(() => window.localStorage.getItem('gzww:favorites'))).not.toBeNull();
});

for (const city of launchCities) {
  test(`${city.name}可完成筛选、换批、开转、结果和收藏`, async ({ page }) => {
    await startInCity(page, city.id);
    const expectNoRuntimeErrors = monitorRuntime(page);
    const wheel = page.getByLabel(`${city.name}周末随机转盘`);
    await page.getByRole('button', { name: '看展' }).click();
    const poolSizes = await page.locator('.pool-status b').textContent();
    const sizeMatch = poolSizes?.match(/符合 (\d+) 个 · 本轮 (\d+) 个/u);
    expect(sizeMatch, `无法读取 ${city.name} 的 eligible/candidate 规模`).not.toBeNull();
    const eligibleCount = Number(sizeMatch![1]);
    const candidateCount = Number(sizeMatch![2]);
    const readCandidateIds = async () =>
      (await wheel.getAttribute('data-candidate-ids'))?.split(',').sort() ?? [];
    const firstBatchIds = await readCandidateIds();
    expect(firstBatchIds).toHaveLength(candidateCount);

    const reroll = page.getByRole('button', { name: '换一批' });
    await reroll.click();
    if (eligibleCount > candidateCount) {
      await expect.poll(readCandidateIds).not.toEqual(firstBatchIds);
    } else {
      await expect.poll(readCandidateIds).toEqual(firstBatchIds);
      await expect(reroll).toBeEnabled();
    }

    await page.getByRole('button', { name: '开转！' }).click();
    const result = page.getByRole('dialog', { name: '命运决定了！' });
    await expect(result).toBeVisible();
    await expect(result).toContainText(city.name);
    await result.getByRole('button', { name: '收藏这个地点' }).click();
    await expect(result.getByRole('button', { name: '取消收藏这个地点' })).toBeVisible();
    await result.getByRole('button', { name: '关闭结果' }).click();
    await page.getByRole('button', { name: /我的收藏，共 1 个/ }).click();
    await expect(page.getByRole('dialog', { name: '我的收藏' }).locator('li')).toHaveCount(1);
    expectNoRuntimeErrors();
  });
}

const degradationCases: Array<{
  name: string;
  override: Parameters<typeof mockDataRoutes>[1]['shanghai'];
  allowedHttpErrors?: RegExp[];
  allowedConsoleErrors?: RegExp[];
}> = [
  {
    name: '快照 404',
    override: { status: 404, body: 'not found' },
    allowedHttpErrors: [/\/data\/cities\/shanghai\.json$/],
    allowedConsoleErrors: [/Failed to load resource: the server responded with a status of 404/],
  },
  {
    name: '快照非法 JSON',
    override: { status: 200, body: '{"broken":' },
  },
  {
    name: '快照 cityId 不匹配',
    override: { body: makeSnapshot('shenzhen') },
  },
  {
    name: '快照活动全部过期',
    override: {
      body: makeSnapshot('shanghai', {
        activities: [makeLiveActivity('shanghai', {
          eventStart: '2020-01-01T00:00:00+08:00',
          eventEnd: '2020-01-02T00:00:00+08:00',
        })],
      }),
    },
  },
];

for (const degradationCase of degradationCases) {
  test(`${degradationCase.name}时只降级到上海常驻池`, async ({ page }) => {
    await page.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [selectedCityKey, 'shanghai'],
    );
    await mockDataRoutes(page, { shanghai: degradationCase.override });
    const expectNoRuntimeErrors = monitorRuntime(page, {
      allowedHttpErrors: degradationCase.allowedHttpErrors,
      allowedConsoleErrors: degradationCase.allowedConsoleErrors,
    });
    await page.goto('./');

    const shell = page.locator('.app-shell');
    await expect(shell).toHaveAttribute('data-pool-loading', 'false');
    await expect(shell).toHaveAttribute('data-pool-availability', 'evergreen-only');
    await expect(shell).toHaveAttribute('data-live-count', '0');
    await expect(page.locator('.pool-status')).toContainText(
      '上海实时活动暂不可用，当前使用常驻灵感',
    );
    await expect(page.getByRole('button', { name: '开转！' })).toBeEnabled();
    expect((await page.getByLabel('上海周末随机转盘').getAttribute('data-candidate-ids'))!
      .split(',')
      .every((id) => id.startsWith('place:shanghai:')))
      .toBe(true);
    expectNoRuntimeErrors();
  });
}

test('上海 degraded 不影响深圳正常加载', async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [selectedCityKey, 'shanghai'],
  );
  await mockDataRoutes(page, {
    shanghai: {
      body: makeSnapshot('shanghai', {
        availability: 'partial',
        warnings: ['一个上海测试来源不可用'],
      }),
    },
  });
  await page.goto('./');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-pool-availability', 'degraded');

  await page.getByRole('button', { name: '当前城市：上海，点击切换城市' }).click();
  await page.getByRole('dialog', { name: '切换城市' }).getByRole('button', { name: '深圳' }).click();
  await expect(page.locator('.app-shell')).toHaveAttribute('data-city-id', 'shenzhen');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-pool-availability', 'normal');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-live-count', '1');
});

test('旋转期间禁止切换城市', async ({ page }) => {
  await startInCity(page, 'guangzhou');
  const cityTrigger = page.getByRole('button', { name: '当前城市：广州，点击切换城市' });
  await page.getByRole('button', { name: '开转！' }).click();

  await expect(page.getByRole('button', { name: '命运选择中……' })).toBeDisabled();
  await expect(cityTrigger).toBeDisabled();
  await expect(page.getByRole('dialog', { name: '切换城市' })).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: '命运决定了！' })).toBeVisible();
  await expect(page.locator('.app-shell')).toHaveAttribute('data-city-id', 'guangzhou');
});

for (const viewport of viewports) {
  test(`${viewport.width}px 视口无水平溢出`, async ({ browser }) => {
    const page = await browser.newPage({ viewport });
    await startInCity(page, 'guangzhou');
    const sizes = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(sizes.content).toBeLessThanOrEqual(sizes.viewport);
    await page.close();
  });
}

test('CitySelector、Result 和 Favorites 的 axe serious/critical 为 0', async ({ page }) => {
  await mockDataRoutes(page);
  await page.goto('./');
  await expectNoSeriousAxeViolations(page);
  await page.getByRole('button', { name: '广州' }).click();

  await page.getByRole('button', { name: '开转！' }).click();
  const result = page.getByRole('dialog', { name: '命运决定了！' });
  await expect(result).toBeVisible();
  await expectNoSeriousAxeViolations(page);
  await result.getByRole('button', { name: '收藏这个地点' }).click();
  await result.getByRole('button', { name: '关闭结果' }).click();

  await page.getByRole('button', { name: /我的收藏，共 1 个/ }).click();
  await expect(page.getByRole('dialog', { name: '我的收藏' })).toBeVisible();
  await expectNoSeriousAxeViolations(page);
});

test('Pages 子路径加载 manifest、五城快照和广州兼容文件', async ({ page }) => {
  const requestedDataPaths = await mockDataRoutes(page);
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [selectedCityKey, 'guangzhou'],
  );
  await page.goto('./');
  const statuses = await page.evaluate(async () => {
    const paths = [
      'data/manifest.json',
      'data/cities/beijing.json',
      'data/cities/shanghai.json',
      'data/cities/guangzhou.json',
      'data/cities/shenzhen.json',
      'data/cities/suzhou.json',
      'data/live-activities.json',
      'data/sync-status.json',
    ];
    return Promise.all(paths.map(async (path) => (await fetch(path)).status));
  });

  expect(statuses).toEqual(Array(8).fill(200));
  for (const suffix of [
    '/data/manifest.json',
    '/data/cities/beijing.json',
    '/data/cities/shanghai.json',
    '/data/cities/guangzhou.json',
    '/data/cities/shenzhen.json',
    '/data/cities/suzhou.json',
    '/data/live-activities.json',
    '/data/sync-status.json',
  ]) {
    expect(requestedDataPaths.some((path) =>
      path === `/guangzhou-weekend-wheel${suffix}`)).toBe(true);
  }
});
