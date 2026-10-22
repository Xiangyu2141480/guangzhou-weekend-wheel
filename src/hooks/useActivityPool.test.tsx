import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEvergreenActivities } from '../data/evergreen';
import { encodeEvergreenPayload } from '../data/evergreenCodec';
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

function withEvergreen(snapshotFetcher: typeof fetch): typeof fetch {
  return vi.fn((url, options) => {
    const match = String(url).match(/evergreen\/(.+)\.json$/u);
    if (match) return Promise.resolve(jsonResponse(encodeEvergreenPayload(match[1] as CityId, getEvergreenActivities(match[1] as CityId))));
    return snapshotFetcher(url, options);
  });
}

describe('useActivityPool', () => {
  it('loads only the selected city evergreen, manifest and live snapshot, then caches them', async () => {
    const citySnapshot = snapshot();
    const fetcher = withEvergreen(vi.fn()
      .mockResolvedValueOnce(jsonResponse(manifest()))
      .mockResolvedValueOnce(jsonResponse(citySnapshot)));

    const { result } = renderHook(() => useActivityPool('guangzhou', {
      baseUrl: '/guangzhou-weekend-wheel/',
      fetcher,
      now,
    }));

    await waitFor(() => expect(result.current.liveCount).toBe(1));
    expect(fetcher).toHaveBeenCalledWith(
      '/guangzhou-weekend-wheel/data/manifest.json',
      expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) }),
    );
    expect(fetcher).toHaveBeenCalledWith(
      '/guangzhou-weekend-wheel/data/cities/guangzhou.json',
      expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) }),
    );
    expect(fetcher).toHaveBeenCalledWith('/guangzhou-weekend-wheel/data/evergreen/guangzhou.json', expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(fetcher).toHaveBeenCalledTimes(3);
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
    const fetcher = withEvergreen(vi.fn().mockRejectedValue(new Error('offline')));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { result } = renderHook(() => useActivityPool('guangzhou', { fetcher, now }));

    await waitFor(() => expect(result.current.liveCount).toBe(1));
    expect(result.current.loading).toBe(false);
    expect(result.current.availability).toBe('degraded');
    expect(result.current.activities.at(-1)?.cityId).toBe('guangzhou');
  });

  it('rejects expired cache and falls back to the selected city evergreen pool', async () => {
    localStorage.setItem(getSnapshotCacheKey('guangzhou'), JSON.stringify({
      cachedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1_000).toISOString(),
      snapshot: snapshot(),
    }));
    const fetcher = withEvergreen(vi.fn().mockRejectedValue(new Error('offline')));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { result } = renderHook(() => useActivityPool('guangzhou', { fetcher, now }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activities).toEqual(guangzhouEvergreen);
    expect(result.current.liveCount).toBe(0);
    expect(result.current.availability).toBe('evergreen-only');
  });

  it('rejects a cross-city snapshot without caching it', async () => {
    const fetcher = withEvergreen(vi.fn()
      .mockResolvedValueOnce(jsonResponse(manifest()))
      .mockResolvedValueOnce(jsonResponse({ ...snapshot(), cityId: 'shanghai' })));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { result } = renderHook(() => useActivityPool('guangzhou', { fetcher, now }));

    await waitFor(() => expect(console.warn).toHaveBeenCalled());
    expect(result.current.loading).toBe(false);
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
    const fetcher = withEvergreen(vi.fn()
      .mockResolvedValueOnce(jsonResponse(manifest()))
      .mockResolvedValueOnce(jsonResponse(snapshot([liveActivity, expired]))));

    const { result } = renderHook(() => useActivityPool('guangzhou', { fetcher, now }));

    await waitFor(() => expect(result.current.liveCount).toBe(1));
    expect(result.current.loading).toBe(false);
    expect(result.current.activities).not.toContainEqual(expired);
  });
});


it('exposes an empty loading state and retry after first evergreen failure', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  let online = false;
  const fetcher = vi.fn(async (url) => {
    if (String(url).includes('/evergreen/') && online) return jsonResponse(encodeEvergreenPayload('guangzhou', guangzhouEvergreen));
    throw new Error('offline');
  });
  const { result } = renderHook(() => useActivityPool('guangzhou', { fetcher, now }));
  expect(result.current.loading).toBe(true);
  expect(result.current.activities).toEqual([]);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBeTruthy();
  online = true;
  act(() => result.current.retry());
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.evergreenCount).toBe(guangzhouEvergreen.length));
  expect(result.current.error).toBeNull();
});

it('isolates A to B to A requests, ignores late responses and aborts old cities', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const pending: { resolve: (response: Response) => void; signal?: AbortSignal | null }[] = [];
  const fetcher = vi.fn((url, options) => {
    if (!String(url).includes('/evergreen/')) return Promise.reject(new Error('snapshot offline'));
    return new Promise<Response>((resolve) => pending.push({ resolve, signal: options?.signal }));
  });
  const { result, rerender } = renderHook(({ city }: { city: CityId | null }) => useActivityPool(city, { fetcher, now }), { initialProps: { city: 'guangzhou' as CityId | null } });
  rerender({ city: 'shanghai' });
  expect(result.current.loading).toBe(true);
  expect(result.current.activities).toEqual([]);
  rerender({ city: 'guangzhou' });
  expect(result.current.loading).toBe(true);
  expect(pending[0].signal?.aborted).toBe(true);
  expect(pending[1].signal?.aborted).toBe(true);
  await act(async () => pending[2].resolve(jsonResponse(encodeEvergreenPayload('guangzhou', guangzhouEvergreen))));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    pending[1].resolve(jsonResponse(encodeEvergreenPayload('shanghai', getEvergreenActivities('shanghai'))));
    pending[0].resolve(jsonResponse(encodeEvergreenPayload('guangzhou', guangzhouEvergreen.slice(0, 1))));
  });
  expect(result.current.activities).toEqual(guangzhouEvergreen);
  rerender({ city: null });
  expect(result.current.loading).toBe(false);
  expect(result.current.activities).toEqual([]);
});

it('publishes an interactive evergreen pool while manifest and live requests are pending, then merges live', async () => {
  let resolveManifest!: (response: Response) => void;
  let resolveLive!: (response: Response) => void;
  const fetcher = withEvergreen(vi.fn((url) => String(url).endsWith('/manifest.json')
    ? new Promise<Response>((resolve) => { resolveManifest = resolve; })
    : new Promise<Response>((resolve) => { resolveLive = resolve; })));
  const { result } = renderHook(() => useActivityPool('guangzhou', { fetcher, now }));

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.activities).toEqual(guangzhouEvergreen);
  expect(result.current.error).toBeNull();
  expect(result.current.liveCount).toBe(0);
  expect(result.current.syncStatus).toBeNull();

  await act(async () => resolveManifest(jsonResponse(manifest())));
  expect(result.current.loading).toBe(false);
  expect(result.current.activities).toEqual(guangzhouEvergreen);
  await act(async () => resolveLive(jsonResponse(snapshot())));
  expect(result.current.activities).toEqual([...guangzhouEvergreen, liveActivity]);
  expect(result.current.loading).toBe(false);
  expect(result.current.availability).toBe('normal');
});

it('never merges or caches delayed live responses from an older A to B to A request', async () => {
  const pending: { cityId: CityId; resolve: (response: Response) => void; signal?: AbortSignal | null }[] = [];
  const fetcher = withEvergreen(vi.fn((url, options) => {
    if (String(url).endsWith('/manifest.json')) return Promise.resolve(jsonResponse({
      schemaVersion: 2,
      cities: ['guangzhou', 'shanghai'].map((cityId) => ({ cityId, snapshot: `cities/${cityId}.json` })),
    }));
    const cityId = String(url).match(/cities\/(.+)\.json$/u)![1] as CityId;
    return new Promise<Response>((resolve) => pending.push({ cityId, resolve, signal: options?.signal }));
  }));
  const { result, rerender } = renderHook(({ city }: { city: CityId }) => useActivityPool(city, { fetcher, now }), { initialProps: { city: 'guangzhou' as CityId } });
  await waitFor(() => expect(result.current.loading).toBe(false));
  rerender({ city: 'shanghai' });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.activities).toEqual(getEvergreenActivities('shanghai'));
  rerender({ city: 'guangzhou' });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(pending).toHaveLength(3);
  expect(pending[0].signal?.aborted).toBe(true);
  expect(pending[1].signal?.aborted).toBe(true);

  const shanghaiLive = { ...liveActivity, ...getEvergreenActivities('shanghai')[0], id: 'event:shanghai:test', live: true } as LiveActivity;
  await act(async () => {
    pending[0].resolve(jsonResponse(snapshot([{ ...liveActivity, id: 'event:guangzhou:stale' }])));
    pending[1].resolve(jsonResponse(snapshot([shanghaiLive], { cityId: 'shanghai' })));
  });
  expect(result.current.activities).toEqual(guangzhouEvergreen);
  expect(result.current.liveCount).toBe(0);
  expect(localStorage.getItem(getSnapshotCacheKey('guangzhou'))).toBeNull();
  expect(localStorage.getItem(getSnapshotCacheKey('shanghai'))).toBeNull();

  await act(async () => pending[2].resolve(jsonResponse(snapshot())));
  expect(result.current.activities).toEqual([...guangzhouEvergreen, liveActivity]);
  expect(result.current.cityId).toBe('guangzhou');
});
