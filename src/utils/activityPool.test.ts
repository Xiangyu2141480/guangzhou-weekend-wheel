import { describe, expect, it } from 'vitest';
import { activities } from '../data/activities';
import type { Activity, LiveActivity } from '../data/types';
import { filterActivityPool, sampleCandidates } from './activityPool';

function makeLive(index: number): LiveActivity {
  const base = activities[index % activities.length];
  return {
    ...base,
    id: `live-${index}`,
    name: `近期活动 ${index}`,
    shortName: `近期 ${index}`,
    live: true,
    sourceId: 'test-source',
    sourceType: 'official-venue',
    sourceName: '测试官方来源',
    sourceUrl: `https://example.com/${index}`,
    eventStart: '2026-09-01T10:00:00+08:00',
    eventEnd: '2026-09-02T18:00:00+08:00',
    fetchedAt: '2026-08-31T00:00:00Z',
    lastVerifiedAt: '2026-08-31T00:00:00Z',
    status: 'upcoming',
  };
}

const deterministic = () => 0.42;

describe('filterActivityPool', () => {
  it('excludes unknown prices under a strict budget', () => {
    const unknown: Activity = {
      ...makeLive(0),
      id: 'unknown-price-live',
      budget: null,
      budgetLabel: '价格待确认',
      priceStatus: 'unknown',
    };

    const filtered = filterActivityPool([unknown, ...activities.slice(0, 8)], {
      categories: new Set(),
      maxBudget: 100,
      environment: null,
      districts: new Set(),
      time: null,
      states: new Set(),
    });

    expect(filtered).not.toContain(unknown);
  });
});

describe('sampleCandidates', () => {
  const pool = [...Array.from({ length: 8 }, (_, index) => makeLive(index)), ...activities.slice(0, 20)];

  it('samples four live and six evergreen items in fresh mode', () => {
    const result = sampleCandidates(pool, {
      mode: 'fresh',
      count: 10,
      recentCandidateIds: [],
      recentSelectedIds: [],
      random: deterministic,
    });

    expect(result).toHaveLength(10);
    expect(result.filter((item) => item.live)).toHaveLength(4);
    expect(new Set(result.map((item) => item.id)).size).toBe(10);
  });

  it('samples without replacement in fate mode', () => {
    const result = sampleCandidates(pool, {
      mode: 'fate',
      count: 10,
      recentCandidateIds: [],
      recentSelectedIds: [],
      random: deterministic,
    });

    expect(result).toHaveLength(10);
    expect(new Set(result.map((item) => item.id)).size).toBe(10);
  });

  it('avoids the last three selected results when alternatives exist', () => {
    const recentSelectedIds = pool.slice(0, 3).map((item) => item.id);
    const result = sampleCandidates(pool, {
      mode: 'fate',
      count: 10,
      recentCandidateIds: [],
      recentSelectedIds,
      random: deterministic,
    });

    expect(result.some((item) => recentSelectedIds.includes(item.id))).toBe(false);
  });

  it('relaxes recent candidate history for a small pool instead of returning short', () => {
    const smallPool = activities.slice(0, 10);
    const result = sampleCandidates(smallPool, {
      mode: 'fate',
      count: 10,
      recentCandidateIds: smallPool.map((item) => item.id),
      recentSelectedIds: [],
      random: deterministic,
    });

    expect(result).toHaveLength(10);
  });
});
