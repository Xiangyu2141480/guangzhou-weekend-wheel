import { describe, expect, it, vi } from 'vitest';
import { isActivity } from '../../src/data/types';
import { normalizeActivity } from './normalize';
import { runSync } from './index';
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
    sourceType: 'official',
    sourceName: '测试官方源',
    sourceUrl: 'https://example.gov.cn/event/1',
    ...overrides,
  }, fetchedAt, now);
}

describe('live activity sync orchestration', () => {
  it('keeps successful sources, validates output, and reports every pipeline count', async () => {
    const valid = activity();
    const duplicate = activity({ sourceUrl: 'https://example.gov.cn/event/duplicate' });
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
      finalCount: 1,
      usedFallback: false,
      sourceCounts: { 成功源: 4, 失败源: 0 },
    });
    expect(result.status.warnings[0]).toContain('失败源');
    expect(result.summary).toContain('| Fetched | 4 |');
    expect(result.summary).toContain('| Final live activities | 1 |');
  });
});
