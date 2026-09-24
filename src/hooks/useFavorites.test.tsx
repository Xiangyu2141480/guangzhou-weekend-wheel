import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { activities } from '../data/activities';
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

test('migrates legacy Guangzhou ids once, keeps unresolved records, and retains the old key', () => {
  const activity = activities[0];
  const legacyId = activity.legacyIds?.[0];
  expect(legacyId).toBeTruthy();
  localStorage.setItem(
    LEGACY_FAVORITES_STORAGE_KEY,
    JSON.stringify([legacyId, legacyId, 'removed-guangzhou-place', 42]),
  );

  const first = renderHook(() => useFavorites());
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

  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('denied');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('denied');
  });
  const unavailable = renderHook(() => useFavorites());
  expect(unavailable.result.current.records).toEqual([]);
  act(() => unavailable.result.current.toggleFavorite(activities[0]));
  expect(unavailable.result.current.records).toHaveLength(1);
});
