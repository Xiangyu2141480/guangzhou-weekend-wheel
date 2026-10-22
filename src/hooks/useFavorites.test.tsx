import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { activities } from '../data/activities';
import { encodeEvergreenPayload } from '../data/evergreenCodec';
import { getEvergreenActivities } from '../data/evergreen';
import {
  FAVORITES_STORAGE_KEY,
  LEGACY_FAVORITES_STORAGE_KEY,
  createFavoriteRecord,
} from '../utils/storage';
import { useFavorites } from './useFavorites';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

test('toggles favorites and restores them in a new hook instance', () => {
  const activity = activities[0];
  const first = renderHook(() => useFavorites());

  act(() => first.result.current.toggleFavorite(activity));
  expect(first.result.current.isFavorite(activity.id)).toBe(true);
  expect(first.result.current.records[0]).toMatchObject({
    activityId: activity.id,
    cityId: 'guangzhou',
    snapshot: { name: activity.name },
  });
  first.unmount();

  const restored = renderHook(() => useFavorites());
  expect(restored.result.current.favoriteIds).toEqual([activity.id]);

  act(() => restored.result.current.toggleFavorite(activity));
  expect(restored.result.current.favoriteIds).toEqual([]);
});

test('migrates legacy Guangzhou ids once, keeps unresolved records, and retains the old key', async () => {
  const activity = activities[0];
  const legacyId = activity.legacyIds?.[0];
  expect(legacyId).toBeTruthy();
  localStorage.setItem(
    LEGACY_FAVORITES_STORAGE_KEY,
    JSON.stringify([legacyId, legacyId, 'removed-guangzhou-place', 42]),
  );

  const fetcher = vi.fn(async () => ({ ok: true, json: async () => encodeEvergreenPayload('guangzhou', getEvergreenActivities('guangzhou')) }) as Response);
  const first = renderHook(() => useFavorites({ fetcher }));
  await waitFor(() => expect(first.result.current.records[0]?.activityId).toBe(activity.id));
  expect(first.result.current.records).toEqual([
    createFavoriteRecord(activity, null),
    {
      activityId: 'removed-guangzhou-place',
      cityId: 'guangzhou',
      savedAt: null,
      snapshot: null,
    },
  ]);
  expect(localStorage.getItem(LEGACY_FAVORITES_STORAGE_KEY)).not.toBeNull();
  expect(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]')).toHaveLength(2);
  first.unmount();

  const second = renderHook(() => useFavorites());
  expect(second.result.current.records).toHaveLength(2);
  act(() => second.result.current.removeFavorite('removed-guangzhou-place'));
  expect(second.result.current.records).toHaveLength(1);
});

test('accepts valid V2 items while dropping malformed entries without remigrating legacy data', () => {
  const record = createFavoriteRecord(activities[0], '2026-09-24T00:00:00.000Z');
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([record, { activityId: 3 }, null]));
  localStorage.setItem(LEGACY_FAVORITES_STORAGE_KEY, JSON.stringify(['legacy-must-not-return']));

  const result = renderHook(() => useFavorites());
  expect(result.result.current.records).toEqual([record]);

  localStorage.setItem(FAVORITES_STORAGE_KEY, '[]');
  result.unmount();
  const empty = renderHook(() => useFavorites());
  expect(empty.result.current.records).toEqual([]);
});

test('safely falls back for invalid JSON and unavailable localStorage', () => {
  localStorage.setItem(FAVORITES_STORAGE_KEY, '{broken');
  localStorage.setItem(LEGACY_FAVORITES_STORAGE_KEY, '{also-broken');
  expect(renderHook(() => useFavorites()).result.current.records).toEqual([]);

  vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
    throw new DOMException('denied');
  });
  vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
    throw new DOMException('denied');
  });
  const unavailable = renderHook(() => useFavorites());
  expect(unavailable.result.current.records).toEqual([]);
  act(() => unavailable.result.current.toggleFavorite(activities[0]));
  expect(unavailable.result.current.records).toHaveLength(1);
});


 test('does not resurrect removed aliases or overwrite additions during asynchronous migration', async () => {
  const legacy = activities[0].legacyIds![0];
  const another = activities[1];
  localStorage.setItem(LEGACY_FAVORITES_STORAGE_KEY, JSON.stringify([legacy, 'unknown-old-id']));
  let resolve!: (response: Response) => void;
  const fetcher = vi.fn(() => new Promise<Response>((done) => { resolve = done; }));
  const { result } = renderHook(() => useFavorites({ fetcher }));
  expect(result.current.favoriteIds).toEqual([legacy, 'unknown-old-id']);
  act(() => {
    result.current.removeFavorite(legacy);
    result.current.toggleFavorite(another);
  });
  await act(async () => resolve({ ok: true, json: async () => encodeEvergreenPayload('guangzhou', getEvergreenActivities('guangzhou')) } as Response));
  await waitFor(() => expect(result.current.records).toEqual([
    { activityId: 'unknown-old-id', cityId: 'guangzhou', savedAt: null, snapshot: null },
    expect.objectContaining({ activityId: another.id, snapshot: expect.objectContaining({ name: another.name }) }),
  ]));
  expect(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)!)).toEqual(result.current.records);
  expect(JSON.parse(localStorage.getItem(LEGACY_FAVORITES_STORAGE_KEY)!)).toEqual([legacy, 'unknown-old-id']);
 });

 test('honors canonical deletion and keeps a newly added canonical record when its alias resolves', async () => {
  localStorage.setItem(LEGACY_FAVORITES_STORAGE_KEY, JSON.stringify([activities[0].legacyIds![0], activities[1].legacyIds![0]]));
  let resolve!: (response: Response) => void;
  const fetcher = vi.fn(() => new Promise<Response>((done) => { resolve = done; }));
  const { result } = renderHook(() => useFavorites({ fetcher }));
  act(() => {
    result.current.removeFavorite(activities[0].id);
    result.current.toggleFavorite(activities[1]);
  });
  const savedAt = result.current.records.find((item) => item.activityId === activities[1].id)!.savedAt;
  await act(async () => resolve({ ok: true, json: async () => encodeEvergreenPayload('guangzhou', getEvergreenActivities('guangzhou')) } as Response));
  await waitFor(() => expect(result.current.records).toEqual([createFavoriteRecord(activities[1], savedAt)]));
 });

test('preserves a canonical removal when migration is interrupted and resumed on a new mount', async () => {
  const activity = activities[0];
  localStorage.setItem(LEGACY_FAVORITES_STORAGE_KEY, JSON.stringify([activity.legacyIds![0]]));
  const offlineFetcher = vi.fn(() => new Promise<Response>(() => undefined));
  const first = renderHook(() => useFavorites({ fetcher: offlineFetcher }));
  act(() => first.result.current.toggleFavorite(activity));
  act(() => first.result.current.toggleFavorite(activity));
  first.unmount();
  const onlineFetcher = vi.fn(async () => ({ ok: true, json: async () => encodeEvergreenPayload('guangzhou', getEvergreenActivities('guangzhou')) }) as Response);
  const resumed = renderHook(() => useFavorites({ fetcher: onlineFetcher }));
  await waitFor(() => expect(resumed.result.current.records).toEqual([]));
  expect(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)!)).toEqual([]);
});

test('keeps migration resumable when saving the resolved V2 records fails', async () => {
  const activity = activities[0];
  localStorage.setItem(LEGACY_FAVORITES_STORAGE_KEY, JSON.stringify([activity.legacyIds![0]]));
  let resolve!: (response: Response) => void;
  const fetcher = vi.fn(() => new Promise<Response>((done) => { resolve = done; }));
  const first = renderHook(() => useFavorites({ fetcher }));
  const originalSet = localStorage.setItem.bind(localStorage);
  const denied = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
    if (key === FAVORITES_STORAGE_KEY) throw new Error('quota');
    originalSet(key, value);
  });
  await act(async () => resolve({ ok: true, json: async () => encodeEvergreenPayload('guangzhou', getEvergreenActivities('guangzhou')) } as Response));
  expect(first.result.current.favoriteIds).toEqual([activity.id]);
  first.unmount();
  denied.mockRestore();
  const onlineFetcher = vi.fn(async () => ({ ok: true, json: async () => encodeEvergreenPayload('guangzhou', getEvergreenActivities('guangzhou')) }) as Response);
  const second = renderHook(() => useFavorites({ fetcher: onlineFetcher }));
  await waitFor(() => expect(second.result.current.favoriteIds).toEqual([activity.id]));
});

test('resolves readable legacy favorites in memory when storage rejects every write from the start', async () => {
  const activity = activities[0];
  localStorage.setItem(LEGACY_FAVORITES_STORAGE_KEY, JSON.stringify([activity.legacyIds![0]]));
  vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
    throw new DOMException('quota exceeded', 'QuotaExceededError');
  });
  const fetcher = vi.fn(async () => ({ ok: true, json: async () => encodeEvergreenPayload('guangzhou', getEvergreenActivities('guangzhou')) }) as Response);
  const first = renderHook(() => useFavorites({ fetcher }));

  await waitFor(() => expect(first.result.current.records).toEqual([createFavoriteRecord(activity, null)]));
  expect(first.result.current.isFavorite(activity.id)).toBe(true);
  act(() => first.result.current.toggleFavorite(activity));
  expect(first.result.current.records).toEqual([]);
});
