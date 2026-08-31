import { describe, expect, it } from 'vitest';
import { deduplicateActivities } from './deduplicate';
import { removeExpiredActivities } from './expire';
import { selectSnapshot } from './fallback';
import { normalizeActivity, normalizeText } from './normalize';
import type { NormalizedLiveActivity, RawActivityRecord } from './types';
import { validateRawActivity } from './validate';

const fetchedAt = '2026-08-30T04:00:00.000Z';
const now = new Date('2026-08-30T12:00:00+08:00');

function raw(overrides: Partial<RawActivityRecord> = {}): RawActivityRecord {
  return {
    name: ' 羊城学堂：  八月讲座之五 ',
    venue: '广州图书馆',
    district: '天河区',
    eventStart: '2026-08-31T10:00:00+08:00',
    sourceType: 'official',
    sourceName: '广州图书馆',
    sourceUrl: 'https://www.gzlib.org.cn/hdActForecast/index.jhtml',
    priceText: '公益免费',
    ...overrides,
  };
}

function makeLive(count: number): NormalizedLiveActivity[] {
  return Array.from({ length: count }, (_, index) =>
    normalizeActivity(raw({
      name: `测试活动 ${index}`,
      eventStart: `2026-09-${String((index % 20) + 1).padStart(2, '0')}T10:00:00+08:00`,
      venue: `测试场馆 ${index}`,
    }), fetchedAt, now));
}

describe('live activity normalization', () => {
  it('normalizes whitespace and full-width punctuation into a stable fingerprint', () => {
    const first = normalizeActivity(raw(), fetchedAt, now);
    const second = normalizeActivity(raw({ name: '羊城学堂: 八月讲座之五' }), fetchedAt, now);

    expect(normalizeText('  A　B： C  ')).toBe('A B: C');
    expect(first.name).toBe('羊城学堂: 八月讲座之五');
    expect(first.fingerprint).toBe(second.fingerprint);
  });

  it.each([
    ['公益免费', 'free', 0, undefined, undefined],
    ['票价 30—80 元', 'known', 30, 30, 80],
    ['现场为准', 'unknown', null, undefined, undefined],
  ] as const)('keeps price evidence explicit for %s', (priceText, priceStatus, budget, priceMin, priceMax) => {
    const activity = normalizeActivity(raw({ priceText }), fetchedAt, now);
    expect(activity).toMatchObject({ priceStatus, budget, priceMin, priceMax });
  });

  it('reports malformed date, venue, and source URL instead of publishing them', () => {
    expect(validateRawActivity(raw({
      venue: ' ',
      eventStart: 'not-a-date',
      sourceUrl: 'javascript:alert(1)',
    }))).toEqual(expect.arrayContaining(['venue', 'eventStart', 'sourceUrl']));
  });
});

describe('live activity pipeline decisions', () => {
  it('deduplicates normalized title, venue, and Guangzhou calendar date', () => {
    const first = normalizeActivity(raw(), fetchedAt, now);
    const duplicate = normalizeActivity(raw({
      name: '羊城学堂: 八月讲座之五',
      sourceName: '另一个官方索引',
      sourceUrl: 'https://example.gov.cn/event/1',
    }), fetchedAt, now);
    const decision = deduplicateActivities([first, duplicate]);

    expect(decision.activities).toHaveLength(1);
    expect(decision.duplicateCount).toBe(1);
  });

  it('removes expired records and derives upcoming or ongoing status', () => {
    const future = normalizeActivity(raw(), fetchedAt, now);
    const ongoing = normalizeActivity(raw({
      name: '正在进行的展览',
      eventStart: '2026-08-29T10:00:00+08:00',
      eventEnd: '2026-08-30T18:00:00+08:00',
    }), fetchedAt, now);
    const expired = normalizeActivity(raw({
      name: '已经结束的活动',
      eventStart: '2026-08-28T10:00:00+08:00',
      eventEnd: '2026-08-28T18:00:00+08:00',
    }), fetchedAt, now);

    const decision = removeExpiredActivities([future, ongoing, expired], now);
    expect(decision.activities.map((item) => item.status)).toEqual(['upcoming', 'ongoing']);
    expect(decision.expiredCount).toBe(1);
  });

  it('keeps the previous snapshot after multiple failures and a greater-than-70% drop', () => {
    const previous = makeLive(50);
    const current = makeLive(8);
    expect(selectSnapshot({ previous, current, failedSources: 2 })).toMatchObject({
      usedFallback: true,
      activities: previous,
      warning: 'multiple source failures with >70% drop',
    });
  });

  it('keeps a non-empty previous snapshot when all current records disappear', () => {
    const previous = makeLive(4);
    expect(selectSnapshot({ previous, current: [], failedSources: 1 })).toMatchObject({
      usedFallback: true,
      activities: previous,
      warning: 'all current records unavailable',
    });
  });
});
