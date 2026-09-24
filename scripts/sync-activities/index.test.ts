import { describe, expect, it, vi } from 'vitest';
import { isActivity } from '../../src/data/types';
import { normalizeActivity } from './normalize';
import { runSync, validateSyncOutput } from './index';
import type { NormalizedLiveActivity, RawActivityRecord } from './types';

const fetchedAt = '2026-08-31T00:00:00.000Z';
const now = new Date(fetchedAt);

function activity(overrides: Partial<RawActivityRecord> = {}): NormalizedLiveActivity {
  return normalizeActivity({
    name: '本周新展览',
    venue: '广州图书馆',
    district: '天河区',
    eventStart: '2026-09-02T10:00:00+08:00',
    eventEnd: '2026-09-04T18:00:00+08:00',
    sourceId: 'test-source',
    sourceType: 'official-venue',
    sourceName: '测试官方源',
    sourceUrl: 'https://www.gzlib.org.cn/event/1',
    ...overrides,
  }, fetchedAt, now);
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
        { name: '成功源', fetch: async () => [valid, duplicate, expired, malformed] },
        { name: '失败源', fetch: async () => { throw new Error('source offline'); } },
      ],
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
      sourceCounts: { 成功源: 4, 失败源: 0 },
    });
    expect(result.status.warnings[0]).toContain('失败源');
    expect(result.summary).toContain('| Fetched | 4 |');
    expect(result.summary).toContain('| Final live activities | 1 |');
  });

  it('filters expired fallback records and restores only a failed source valid records', async () => {
    const validPrevious = activity({ name: '失败源旧活动', sourceName: '失败源' });
    const expiredPrevious = activity({
      name: '失败源过期活动',
      sourceName: '失败源',
      eventStart: '2026-08-20T10:00:00+08:00',
      eventEnd: '2026-08-20T18:00:00+08:00',
    });
    const healthyPrevious = activity({ name: '成功源旧活动', sourceName: '成功源' });
    const current = activity({ name: '成功源新活动', sourceName: '成功源' });

    const result = await runSync({
      adapters: [
        { name: '成功源', fetch: async () => [current] },
        { name: '失败源', fetch: async () => { throw new Error('offline'); } },
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

  it('fails when every source fails and no non-expired previous record exists', async () => {
    await expect(runSync({
      adapters: [
        { name: '失败源一', fetch: async () => { throw new Error('offline'); } },
        { name: '失败源二', fetch: async () => { throw new Error('offline'); } },
      ],
      loadPrevious: async () => [activity({
        sourceName: '失败源一',
        eventStart: '2026-08-20T10:00:00+08:00',
        eventEnd: '2026-08-20T18:00:00+08:00',
      })],
      now,
    })).rejects.toThrow('All live activity sources failed');
  });

  it('rejects records outside the configured source domain', async () => {
    const result = await runSync({
      adapters: [{
        name: '官方源',
        allowedSourceHosts: ['trusted.gov.cn'],
        fetch: async () => [{
          ...activity(),
          sourceUrl: 'https://evil.example/event/1',
        }],
      }],
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
      configuredSources: 1,
      successfulSources: 1,
      failedSources: 0,
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

    expect(() => validateSyncOutput([item, item], status)).toThrow(/duplicate fingerprints/u);
    expect(() => validateSyncOutput([item], { ...status, finalCount: 2 })).toThrow(/counts/u);
  });
});
