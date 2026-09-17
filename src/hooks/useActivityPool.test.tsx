import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { activities } from '../data/activities';
import type { LiveActivity } from '../data/types';
import { useActivityPool } from './useActivityPool';

const evergreen = activities.slice(0, 3);
const now = new Date('2026-09-02T00:00:00+08:00');
const liveActivity: LiveActivity = {
  ...activities[0],
  id: 'live-test-event',
  name: '广州近期测试活动',
  shortName: '近期活动',
  live: true,
  sourceType: 'official',
  sourceName: '测试官方来源',
  sourceUrl: 'https://example.gov.cn/event/1',
  eventStart: '2026-09-05T10:00:00+08:00',
  eventEnd: '2026-09-05T18:00:00+08:00',
  fetchedAt: '2026-08-31T00:00:00.000Z',
  lastVerifiedAt: '2026-08-31T00:00:00.000Z',
  status: 'upcoming',
};

const syncStatus = {
  generatedAt: '2026-08-31T00:00:00.000Z',
  configuredSources: 3,
  successfulSources: 3,
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

function jsonResponse(value: unknown): Response {
  return { ok: true, status: 200, json: async () => value } as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useActivityPool', () => {
  it('uses the configured Pages base URL and merges valid live records', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse([liveActivity]))
      .mockResolvedValueOnce(jsonResponse(syncStatus));

    const { result } = renderHook(() => useActivityPool(evergreen, {
      baseUrl: '/guangzhou-weekend-wheel/',
      fetcher,
      now,
    }));

    await waitFor(() => expect(result.current.liveCount).toBe(1));
    expect(fetcher).toHaveBeenCalledWith(
      '/guangzhou-weekend-wheel/data/live-activities.json',
      expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) }),
    );
    expect(fetcher).toHaveBeenCalledWith(
      '/guangzhou-weekend-wheel/data/sync-status.json',
      expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) }),
    );
    expect(result.current.activities).toEqual([...evergreen, liveActivity]);
    expect(result.current.syncStatus).toEqual(syncStatus);
    expect(result.current.availability).toBe('normal');
  });

  it('keeps evergreen activities after fetch failure', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { result } = renderHook(() => useActivityPool(evergreen, { fetcher, now }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activities).toEqual(evergreen);
    expect(result.current.liveCount).toBe(0);
    expect(result.current.availability).toBe('evergreen-only');
  });

  it('drops malformed live records without discarding valid ones', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse([liveActivity, { ...liveActivity, id: 'bad', venue: '' }]))
      .mockResolvedValueOnce(jsonResponse(syncStatus));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { result } = renderHook(() => useActivityPool(evergreen, { fetcher, now }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.liveCount).toBe(1);
    expect(result.current.activities.at(-1)).toEqual(liveActivity);
  });

  it('marks a fallback snapshot as degraded', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse([liveActivity]))
      .mockResolvedValueOnce(jsonResponse({
        ...syncStatus,
        successfulSources: 2,
        failedSources: 1,
        fallbackCount: 1,
        usedFallback: true,
      }));

    const { result } = renderHook(() => useActivityPool(evergreen, { fetcher, now }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.availability).toBe('degraded');
  });

  it('rejects insecure URLs, timezone-less dates, and reversed ranges', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse([
        { ...liveActivity, id: 'http', sourceUrl: 'http://example.gov.cn/event/1' },
        { ...liveActivity, id: 'no-zone', eventStart: '2026-09-05T10:00:00' },
        {
          ...liveActivity,
          id: 'reversed',
          eventStart: '2026-09-06T10:00:00+08:00',
          eventEnd: '2026-09-05T18:00:00+08:00',
        },
      ]))
      .mockResolvedValueOnce(jsonResponse({ ...syncStatus, finalCount: 0 }));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { result } = renderHook(() => useActivityPool(evergreen, { fetcher, now }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.liveCount).toBe(0);
    expect(result.current.availability).toBe('evergreen-only');
  });

  it('drops expired records and recomputes live statuses at load time', async () => {
    const ongoing = {
      ...liveActivity,
      id: 'live-ongoing',
      eventStart: '2026-09-01T10:00:00+08:00',
      eventEnd: '2026-09-03T18:00:00+08:00',
      status: 'upcoming',
    } satisfies LiveActivity;
    const expired = {
      ...liveActivity,
      id: 'live-expired',
      eventStart: '2026-08-31T10:00:00+08:00',
      eventEnd: '2026-09-01T18:00:00+08:00',
      status: 'ongoing',
    } satisfies LiveActivity;
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse([liveActivity, ongoing, expired]))
      .mockResolvedValueOnce(jsonResponse(syncStatus));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { result } = renderHook(() => useActivityPool(evergreen, { fetcher, now }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.liveCount).toBe(2);
    expect(result.current.activities).not.toContainEqual(expired);
    expect(result.current.activities.at(-2)).toMatchObject({
      id: liveActivity.id,
      status: 'upcoming',
    });
    expect(result.current.activities.at(-1)).toMatchObject({
      id: ongoing.id,
      status: 'ongoing',
    });
  });
});
