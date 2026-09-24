import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';
import { CITY_CONFIGS, type CityId } from '../src/data/cities';

type SnapshotOverride =
  | { status: number; body?: string }
  | { body: unknown };

const cityNames = Object.fromEntries(
  CITY_CONFIGS.map((city) => [city.id, city.name]),
) as Record<CityId, string>;

export const launchCities = CITY_CONFIGS.map(({ id, name }) => ({ id, name }));

export function makeLiveActivity(
  cityId: CityId,
  overrides: Record<string, unknown> = {},
) {
  const city = CITY_CONFIGS.find((candidate) => candidate.id === cityId)!;
  return {
    schemaVersion: 2,
    id: `event:${cityId}:e2e-activity`,
    cityId,
    name: `${city.name} E2E 本周限定活动`,
    shortName: 'E2E 活动',
    category: 'art',
    district: city.districts[0],
    venue: `${city.name}测试馆`,
    budget: 0,
    budgetLabel: '免费',
    priceStatus: 'free',
    duration: '2小时',
    timeTags: ['short'],
    indoorOutdoor: 'indoor',
    tags: ['展览'],
    emoji: '🎨',
    reason: '验证多城市实时活动加载。',
    mapKeyword: `${city.name}测试馆`,
    transport: '地铁可达',
    live: true,
    sourceId: `${cityId}-e2e-source`,
    sourceType: 'official-venue',
    sourceName: `${city.name}测试来源`,
    sourceUrl: `https://www.gzlib.org.cn/e2e/${cityId}`,
    eventStart: '2099-01-01T00:00:00+08:00',
    eventEnd: '2099-12-31T23:59:59+08:00',
    fetchedAt: '2026-09-24T00:00:00+08:00',
    lastVerifiedAt: '2026-09-24T00:00:00+08:00',
    status: 'upcoming',
    ...overrides,
  };
}

export function makeSnapshot(
  cityId: CityId,
  overrides: Record<string, unknown> = {},
) {
  const activities = (overrides.activities as unknown[] | undefined) ??
    [makeLiveActivity(cityId)];
  return {
    schemaVersion: 2,
    cityId,
    generatedAt: '2026-09-24T00:00:00+08:00',
    availability: 'fresh',
    sources: [{
      id: `${cityId}-e2e-source`,
      name: `${cityNames[cityId]}测试来源`,
      sourceType: 'official-venue',
      availability: 'fresh',
      fetched: activities.length,
      final: activities.length,
    }],
    counts: {
      fetched: activities.length,
      invalid: 0,
      expired: 0,
      duplicate: 0,
      current: activities.length,
      fallback: 0,
      final: activities.length,
    },
    warnings: [],
    ...overrides,
    activities,
  };
}

export async function mockDataRoutes(
  page: Page,
  snapshotOverrides: Partial<Record<CityId, SnapshotOverride>> = {},
) {
  const requestedDataPaths: string[] = [];
  await page.route('**/data/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    requestedDataPaths.push(pathname);

    if (pathname.endsWith('/data/manifest.json')) {
      await route.fulfill({
        json: {
          schemaVersion: 2,
          generatedAt: '2026-09-24T00:00:00+08:00',
          cities: launchCities.map(({ id }) => ({
            cityId: id,
            snapshot: `cities/${id}.json`,
            availability: 'fresh',
            generatedAt: '2026-09-24T00:00:00+08:00',
            liveCount: 1,
          })),
        },
      });
      return;
    }

    const cityId = pathname.match(/\/data\/cities\/([a-z]+)\.json$/u)?.[1] as
      | CityId
      | undefined;
    if (cityId) {
      const override = snapshotOverrides[cityId];
      if (override && 'status' in override) {
        await route.fulfill({ status: override.status, body: override.body ?? '' });
      } else {
        await route.fulfill({
          json: override && 'body' in override ? override.body : makeSnapshot(cityId),
        });
      }
      return;
    }

    if (pathname.endsWith('/data/live-activities.json')) {
      await route.fulfill({ json: [makeLiveActivity('guangzhou')] });
      return;
    }
    if (pathname.endsWith('/data/sync-status.json')) {
      await route.fulfill({
        json: { generatedAt: '2026-09-24T00:00:00+08:00', cityIds: ['guangzhou'] },
      });
      return;
    }

    await route.fulfill({ status: 404, body: 'unknown mocked data path' });
  });
  return requestedDataPaths;
}

interface RuntimeMonitorOptions {
  allowedConsoleErrors?: RegExp[];
  allowedHttpErrors?: RegExp[];
}

export function monitorRuntime(
  page: Page,
  {
    allowedConsoleErrors = [],
    allowedHttpErrors = [],
  }: RuntimeMonitorOptions = {},
) {
  const errors: string[] = [];
  const isSameOrigin = (url: string) => {
    if (page.url() === 'about:blank') return false;
    return new URL(url).origin === new URL(page.url()).origin;
  };

  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !allowedConsoleErrors.some((pattern) => pattern.test(message.text()))
    ) {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on('requestfailed', (request) => {
    if (isSameOrigin(request.url())) {
      errors.push(`resource: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
    }
  });
  page.on('response', (response) => {
    const url = response.url();
    if (
      response.status() >= 400 &&
      isSameOrigin(url) &&
      !allowedHttpErrors.some((pattern) => pattern.test(url))
    ) {
      errors.push(`resource: ${response.status()} ${url}`);
    }
  });

  return () => {
    expect(errors, errors.join('\n')).toEqual([]);
  };
}

export async function expectNoSeriousAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const violations = results.violations
    .filter(({ impact }) => impact === 'serious' || impact === 'critical')
    .map(({ id, impact, nodes }) => ({
      id,
      impact,
      targets: nodes.map((node) => node.target.join(' ')),
    }));

  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

export async function tabTo(page: Page, target: Locator, limit = 100) {
  for (let step = 0; step < limit; step += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  await expect(target).toBeFocused();
}
