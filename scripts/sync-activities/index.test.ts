import { describe, expect, it, vi } from 'vitest';
import type { CityId } from '../../src/data/cities';
import { isActivity } from '../../src/data/types';
import { normalizeActivity } from './normalize';
import {
  defaultAdapters,
  createCitySnapshot,
  createDeploymentSummary,
  parseCliArgs,
  runCli,
  runPublication,
  runSync,
  selectAdapters,
  validateCommittedFiles,
  validateSyncOutput,
} from './index';
import { createManifest } from './snapshot';
import type {
  NormalizedLiveActivity,
  RawActivityRecord,
  SourceAdapter,
} from './types';

const fetchedAt = '2026-08-31T00:00:00.000Z';
const now = new Date(fetchedAt);

function activity(
  overrides: Partial<RawActivityRecord> = {},
  cityId: 'guangzhou' | 'shanghai' = 'guangzhou',
): NormalizedLiveActivity {
  return normalizeActivity({
    name: '本周新展览',
    venue: '广州图书馆',
    district: cityId === 'guangzhou' ? '天河区' : '黄浦区',
    eventStart: '2026-09-02T10:00:00+08:00',
    eventEnd: '2026-09-04T18:00:00+08:00',
    sourceId: 'test-source',
    sourceType: 'official-venue',
    sourceName: '测试官方源',
    sourceUrl: 'https://www.gzlib.org.cn/event/1',
    ...overrides,
  }, cityId, fetchedAt, now, cityId === 'guangzhou' ? ['gzlib.org.cn'] : ['shanghai.gov.cn']);
}

function adapter(overrides: Partial<SourceAdapter> = {}): SourceAdapter {
  return {
    id: 'test-source',
    cityId: 'guangzhou',
    name: '测试官方源',
    sourceType: 'official-venue',
    allowedHosts: ['gzlib.org.cn'],
    allowEmptyResult: false,
    fetch: async () => [],
    ...overrides,
  };
}

describe('live activity sync orchestration', () => {
  it('keeps successful sources, validates output, and reports every pipeline count', async () => {
    const valid = activity();
    const duplicate = activity({ sourceUrl: 'https://www.gzlib.org.cn/event/duplicate' });
    const expired = activity({
      name: '已结束活动',
      eventStart: '2026-08-20T10:00:00+08:00',
      eventEnd: '2026-08-20T18:00:00+08:00',
    });
    const malformed = { ...activity({ name: '坏数据' }), venue: '' } as NormalizedLiveActivity;
    const loadPrevious = vi.fn(async () => [activity({ name: '旧快照活动' })]);

    const result = await runSync({
      adapters: [
        adapter({ fetch: async () => [valid, duplicate, expired, malformed] }),
        adapter({
          id: 'failed-source',
          name: '失败源',
          fetch: async () => { throw new Error('source offline'); },
        }),
      ],
      cityIds: ['guangzhou'],
      loadPrevious,
      now,
    });

    expect(loadPrevious).toHaveBeenCalledOnce();
    expect(result.activities).toHaveLength(1);
    expect(result.activities.every(isActivity)).toBe(true);
    expect(result.status).toMatchObject({
      configuredSources: 2,
      successfulSources: 1,
      failedSources: 1,
      fetchedCount: 4,
      invalidCount: 1,
      expiredCount: 1,
      duplicateCount: 1,
      fallbackCount: 0,
      finalCount: 1,
      usedFallback: false,
      cityIds: ['guangzhou'],
      sourceCounts: { 'test-source': 4, 'failed-source': 0 },
    });
    expect(result.status.warnings[0]).toContain('失败源');
    expect(result.summary).toContain('| Fetched | 4 |');
    expect(result.summary).toContain('| Final live activities | 1 |');
  });

  it('filters expired fallback records and restores only a failed source valid records', async () => {
    const validPrevious = activity({
      name: '失败源旧活动',
      sourceId: 'failed-source',
      sourceName: '失败源',
    });
    const expiredPrevious = activity({
      name: '失败源过期活动',
      sourceId: 'failed-source',
      sourceName: '失败源',
      eventStart: '2026-08-20T10:00:00+08:00',
      eventEnd: '2026-08-20T18:00:00+08:00',
    });
    const healthyPrevious = activity({ name: '成功源旧活动' });
    const current = activity({ name: '成功源新活动' });

    const result = await runSync({
      adapters: [
        adapter({ fetch: async () => [current] }),
        adapter({
          id: 'failed-source',
          name: '失败源',
          fetch: async () => { throw new Error('offline'); },
        }),
      ],
      loadPrevious: async () => [validPrevious, expiredPrevious, healthyPrevious],
      now,
    });

    expect(result.activities.map((item) => item.name)).toEqual([
      '成功源新活动',
      '失败源旧活动',
    ]);
    expect(result.status).toMatchObject({
      usedFallback: true,
      fallbackCount: 1,
      finalCount: 2,
    });
  });

  it('treats a disallowed empty result as failure and restores only that source', async () => {
    const previous = activity({ name: '空结果源旧活动' });
    const result = await runSync({
      adapters: [adapter({ fetch: async () => [] })],
      cityIds: ['guangzhou'],
      loadPrevious: async () => [previous],
      now,
    });

    expect(result.activities.map((item) => item.name)).toEqual(['空结果源旧活动']);
    expect(result.status).toMatchObject({
      successfulSources: 0,
      failedSources: 1,
      fallbackCount: 1,
      usedFallback: true,
    });
    expect(result.status.warnings[0]).toContain('empty result');
  });

  it('returns an empty live pool when every source fails and no valid fallback exists', async () => {
    const result = await runSync({
      adapters: [
        adapter({
          id: 'failed-one',
          name: '失败源一',
          fetch: async () => { throw new Error('offline'); },
        }),
        adapter({
          id: 'failed-two',
          name: '失败源二',
          fetch: async () => { throw new Error('offline'); },
        }),
      ],
      loadPrevious: async () => [activity({
        sourceId: 'failed-one',
        sourceName: '失败源一',
        eventStart: '2026-08-20T10:00:00+08:00',
        eventEnd: '2026-08-20T18:00:00+08:00',
      })],
      now,
    });

    expect(result.activities).toEqual([]);
    expect(result.status).toMatchObject({
      successfulSources: 0,
      failedSources: 2,
      fallbackCount: 0,
      finalCount: 0,
    });
  });

  it('rejects records outside the configured source domain', async () => {
    const result = await runSync({
      adapters: [adapter({
        id: 'official',
        name: '官方源',
        allowedHosts: ['trusted.gov.cn'],
        fetch: async () => [{
          ...activity({ sourceId: 'official', sourceName: '官方源' }),
          sourceUrl: 'https://evil.example/event/1',
        }],
      })],
      loadPrevious: async () => [],
      now,
    });

    expect(result.activities).toEqual([]);
    expect(result.status.invalidCount).toBe(1);
  });

  it('rejects duplicate output and inconsistent status counts', () => {
    const item = activity();
    const status = {
      generatedAt: fetchedAt,
      cityIds: ['guangzhou'],
      configuredSources: 1,
      successfulSources: 1,
      failedSources: 0,
      failedSourceIds: [],
      sourceCounts: { 测试源: 1 },
      fetchedCount: 1,
      invalidCount: 0,
      expiredCount: 0,
      duplicateCount: 0,
      fallbackCount: 0,
      finalCount: 1,
      usedFallback: false,
      warnings: [],
    };

    expect(() => validateSyncOutput([item, item], status, [adapter()], ['guangzhou']))
      .toThrow(/duplicate fingerprints/u);
    expect(() => validateSyncOutput(
      [item],
      { ...status, finalCount: 2 },
      [adapter()],
      ['guangzhou'],
    )).toThrow(/counts/u);
  });
});

describe('city-aware source selection', () => {
  it('registers at least one reviewed official source for every launch city', () => {
    expect(defaultAdapters).toHaveLength(7);
    expect(defaultAdapters.every((source) =>
      source.allowedHosts.length > 0 &&
      source.allowEmptyResult === false
    )).toBe(true);
    expect(new Set(defaultAdapters.map((source) => source.cityId))).toEqual(new Set([
      'beijing',
      'shanghai',
      'guangzhou',
      'shenzhen',
      'suzhou',
    ]));
    expect(defaultAdapters.map((source) => source.id)).toEqual([
      'beijing-city-events',
      'shanghai-culture-events',
      'gz-library',
      'gz-exhibition',
      'gz-culture-performances',
      'shenzhen-culture-events',
      'suzhou-museum-exhibitions',
    ]);
  });

  it('runs only adapters registered for the selected city', async () => {
    const guangzhouFetch = vi.fn(async () => [activity()]);
    const shanghaiFetch = vi.fn(async () => []);
    const adapters: SourceAdapter[] = [
      adapter({ fetch: guangzhouFetch }),
      adapter({
        id: 'shanghai-source',
        cityId: 'shanghai',
        name: '上海官方源',
        allowedHosts: ['shanghai.gov.cn'],
        fetch: shanghaiFetch,
      }),
    ];

    const result = await runSync({
      adapters,
      cityIds: ['guangzhou'],
      loadPrevious: async () => [],
      now,
    });

    expect(selectAdapters(adapters, ['guangzhou'])).toHaveLength(1);
    expect(guangzhouFetch).toHaveBeenCalledOnce();
    expect(shanghaiFetch).not.toHaveBeenCalled();
    expect(result.activities.every((item) => item.cityId === 'guangzhou')).toBe(true);
  });

  it('publishes an atomic bootstrap snapshot for all five cities', async () => {
    const adapters = ([
      ['beijing', 'beijing-source'],
      ['shanghai', 'shanghai-source'],
      ['guangzhou', 'guangzhou-source'],
      ['shenzhen', 'shenzhen-source'],
      ['suzhou', 'suzhou-source'],
    ] as const).map(([cityId, id]) => adapter({
      id,
      cityId,
      name: `${cityId} source`,
      fetch: async () => [],
    }));

    const result = await runPublication(
      ['beijing', 'shanghai', 'guangzhou', 'shenzhen', 'suzhou'],
      { adapters, loadPrevious: async () => [], now },
    );

    expect(result.manifest.schemaVersion).toBe(2);
    expect(result.manifest.cities.map((city) => city.cityId)).toEqual([
      'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'suzhou',
    ]);
    expect(result.snapshots).toHaveLength(5);
    expect(result.snapshots.every((snapshot) =>
      snapshot.availability === 'evergreen-only' &&
      snapshot.activities.length === 0
    )).toBe(true);
    expect(result.compatibilityActivities).toEqual(
      result.snapshots.find((snapshot) => snapshot.cityId === 'guangzhou')?.activities,
    );
  });

  it('keeps current and fallback records isolated by city and source', async () => {
    const shanghaiPrevious = activity({
      name: '上海旧活动',
      venue: '上海文化馆',
      sourceId: 'shanghai-source',
      sourceName: '上海官方源',
      sourceUrl: 'https://www.shanghai.gov.cn/event/1',
    }, 'shanghai');
    const guangzhouPrevious = activity({
      name: '广州旧活动',
      sourceId: 'test-source',
    });

    const result = await runSync({
      adapters: [
        adapter({ fetch: async () => [activity({ name: '广州新活动' })] }),
        adapter({
          id: 'shanghai-source',
          cityId: 'shanghai',
          name: '上海官方源',
          allowedHosts: ['shanghai.gov.cn'],
          fetch: async () => { throw new Error('offline'); },
        }),
      ],
      cityIds: ['guangzhou', 'shanghai'],
      loadPrevious: async () => [guangzhouPrevious, shanghaiPrevious],
      now,
    });

    expect(result.activities.map((item) => [item.cityId, item.name])).toEqual([
      ['guangzhou', '广州新活动'],
      ['shanghai', '上海旧活动'],
    ]);
    expect(result.status.fallbackCount).toBe(1);
  });

  it('rejects unsupported cities with the complete allow-list', () => {
    expect(() => parseCliArgs(['--city', 'hangzhou'])).toThrow(
      /beijing\|shanghai\|guangzhou\|shenzhen\|suzhou/u,
    );
    expect(parseCliArgs(['--city', 'guangzhou'])).toEqual({
      validateOnly: false,
      cityIds: ['guangzhou'],
    });
    expect(parseCliArgs(['--all']).cityIds).toEqual([
      'beijing',
      'shanghai',
      'guangzhou',
      'shenzhen',
      'suzhou',
    ]);
  });

  it('keeps validate-only read-only and does not start synchronization', async () => {
    const validateFiles = vi.fn(async () => undefined);
    const publish = vi.fn();
    const write = vi.fn();

    await runCli(['--validate-only'], { validateFiles, publish, write });

    expect(validateFiles).toHaveBeenCalledOnce();
    expect(publish).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it('validates the committed manifest, five bootstrap snapshots, and Guangzhou compatibility', async () => {
    await expect(validateCommittedFiles()).resolves.toBeUndefined();
  });

  it('exposes per-city and per-source deployment summary data', async () => {
    const result = await runSync({
      adapters: [adapter({ fetch: async () => [activity()] })],
      cityIds: ['guangzhou'],
      loadPrevious: async () => [],
      now,
    });
    const citySnapshot = createCitySnapshot(result, 'guangzhou', [adapter()]);
    const cityIds: CityId[] = [
      'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'suzhou',
    ];
    const snapshots = cityIds.map((cityId) => cityId === 'guangzhou'
      ? citySnapshot
      : {
        ...citySnapshot,
        cityId,
        sources: [],
        activities: [],
        availability: 'evergreen-only' as const,
        counts: {
          fetched: 0, invalid: 0, expired: 0, duplicate: 0,
          current: 0, fallback: 0, final: 0,
        },
      });
    const summary = createDeploymentSummary(
      createManifest(snapshots),
      snapshots,
      '0123456789abcdef',
    );

    expect(summary).toContain('Commit SHA: `0123456789abcdef`');
    expect(summary).toContain('| guangzhou | fresh | 1 | 0 | 1 | 0 | 1 |');
    expect(summary).toContain('| guangzhou | 测试官方源 | success | fresh | 1 | 1 |');
    expect(summary).toContain('| beijing | evergreen-only | 0 | 0 | 0 | 0 | 0 |');
    expect(summary).toContain('Oldest lastVerifiedAt');
  });
});
