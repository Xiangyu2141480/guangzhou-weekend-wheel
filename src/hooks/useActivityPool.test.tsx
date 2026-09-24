import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEvergreenActivities } from '../data/evergreen';
import type { CityId } from '../data/cities';
import type { LiveActivity } from '../data/types';
import {
  getSnapshotCacheKey,
  useActivityPool,
  type CityActivitySnapshot,
} from './useActivityPool';

const now = new Date('2026-09-02T00:00:00+08:00');
const guangzhouEvergreen = [...getEvergreenActivities('guangzhou')];
const liveActivity: LiveActivity = {
  ...guangzhouEvergreen[0],
  id: 'event:guangzhou:test',
  name: '广州近期测试活动',
  shortName: '近期活动',
  live: true,
  sourceId: 'test-source',
  sourceType: 'official-venue',
  sourceName: '测试官方来源',
  sourceUrl: 'https://www.gzlib.org.cn/event/1',
  eventStart: '2026-09-05T10:00:00+08:00',
  eventEnd: '2026-09-05T18:00:00+08:00',
  fetchedAt: '2026-08-31T00:00:00.000Z',
  lastVerifiedAt: '2026-08-31T00:00:00.000Z',
  status: 'upcoming',
};

function manifest(cityId: CityId = 'guangzhou') {
  return {
    schemaVersion: 2,
    generatedAt: '2026-08-31T00:00:00.000Z',
    cities: [{
      cityId,
      snapshot: `cities/${cityId}.json`,
      availability: 'fresh',
      generatedAt: '2026-08-31T00:00:00.000Z',
      liveCount: 1,
    }],
  };
}

function snapshot(
  activities: LiveActivity[] = [liveActivity],
  overrides: Partial<CityActivitySnapshot> = {},
): CityActivitySnapshot {
  return {
    schemaVersion: 2,
    cityId: 'guangzhou',
    generatedAt: '2026-08-31T00:00:00.000Z',
    availability: 'fresh',
    sources: [{
      id: 'test-source',
      name: '测试官方来源',
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
    activities,
    ...overrides,
  };
}

function jsonResponse(value: unknown): Response {
  return { ok: true, status: 200, json: async () => value } as Response;
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useActivityPool', () => {
  it('loads only the manifest and selected city snapshot, then caches it', async () => {
    const citySnapshot = snapshot();
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse(manifest()))
      .mockResolvedValueOnce(jsonResponse(citySnapshot));

    const { result } = renderHook(() => useActivityPool('guangzhou', {
      baseUrl: '/guangzhou-weekend-wheel/',
      fetcher,
      now,
    }));

    await waitFor(() => expect(result.current.liveCount).toBe(1));
    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      '/guangzhou-weekend-wheel/data/manifest.json',
      expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) }),
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      '/guangzhou-weekend-wheel/data/cities/guangzhou.json',
      expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) }),
    );
    expect(result.current.activities).toEqual([...guangzhouEvergreen, liveActivity]);
    expect(result.current.availability).toBe('normal');
    expect(JSON.parse(localStorage.getItem(getSnapshotCacheKey('guangzhou')) ?? '{}'))
      .toMatchObject({ cachedAt: now.toISOString(), snapshot: citySnapshot });
  });

  it('uses only a fresh same-city cache after a request failure', async () => {
    localStorage.setItem(getSnapshotCacheKey('guangzhou'), JSON.stringify({
      cachedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1_000).toISOString(),
      snapshot: snapshot(),
    }));
    localStorage.setItem(getSnapshotCacheKey('shanghai'), JSON.stringify({
      cachedAt: now.toISOString(),
      snapshot: { ...snapshot(), cityId: 'shanghai' },
    }));
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { result } = renderHook(() => useActivityPool('guangzhou', { fetcher, now }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.liveCount).toBe(1);
    expect(result.current.availability).toBe('degraded');
    expect(result.current.activities.at(-1)?.cityId).toBe('guangzhou');
  });

  it('rejects expired cache and falls back to the selected city evergreen pool', async () => {
    localStorage.setItem(getSnapshotCacheKey('guangzhou'), JSON.stringify({
      cachedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1_000).toISOString(),
      snapshot: snapshot(),
    }));
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { result } = renderHook(() => useActivityPool('guangzhou', { fetcher, now }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activities).toEqual(guangzhouEvergreen);
    expect(result.current.liveCount).toBe(0);
    expect(result.current.availability).toBe('evergreen-only');
  });

  it('rejects a cross-city snapshot without caching it', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse(manifest()))
      .mockResolvedValueOnce(jsonResponse({ ...snapshot(), cityId: 'shanghai' }));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { result } = renderHook(() => useActivityPool('guangzhou', { fetcher, now }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activities).toEqual(guangzhouEvergreen);
    expect(localStorage.getItem(getSnapshotCacheKey('guangzhou'))).toBeNull();
  });

  it('drops expired live records from an otherwise valid snapshot', async () => {
    const expired = {
      ...liveActivity,
      id: 'event:guangzhou:expired',
      eventStart: '2026-08-31T10:00:00+08:00',
      eventEnd: '2026-09-01T18:00:00+08:00',
      status: 'ongoing',
    } satisfies LiveActivity;
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse(manifest()))
      .mockResolvedValueOnce(jsonResponse(snapshot([liveActivity, expired])));

    const { result } = renderHook(() => useActivityPool('guangzhou', { fetcher, now }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.liveCount).toBe(1);
    expect(result.current.activities).not.toContainEqual(expired);
  });
});
