import { beforeEach, describe, expect, test } from 'vitest';
import { activities } from '../data/activities';
import { createFavoriteRecord, loadFavorites, saveFavorites, resolveLegacyFavorites } from './storage';

describe('favorites storage', () => {
  beforeEach(() => localStorage.clear());

  test('persists and deduplicates favorite records', () => {
    const record = createFavoriteRecord(activities[0], '2026-09-24T00:00:00.000Z');
    saveFavorites([record, record]);
    expect(loadFavorites()).toEqual([record]);

    saveFavorites([]);
    expect(loadFavorites()).toEqual([]);
  });

  test('recovers safely from corrupt JSON', () => {
    localStorage.setItem('where-to-go:favorites:v2', '{broken');
    localStorage.setItem('gzww:favorites', '{also-broken');

    expect(loadFavorites()).toEqual([]);
  });
});


test('resolves every legacy identity losslessly while retaining unknown favorites and the old key', () => {
  localStorage.clear();
  const oldIds = activities.flatMap((activity) => activity.legacyIds ?? []);
  expect(oldIds).toHaveLength(189);
  localStorage.setItem('gzww:favorites', JSON.stringify([...oldIds, 'old-removed-place']));
  const provisional = loadFavorites();
  expect(provisional[0]).toEqual({ activityId: oldIds[0], cityId: 'guangzhou', savedAt: null, snapshot: null });
  const resolved = resolveLegacyFavorites(provisional, activities);
  expect(resolved).toEqual([
    ...activities.filter((activity) => activity.legacyIds?.length).map((activity) => createFavoriteRecord(activity, null)),
    { activityId: 'old-removed-place', cityId: 'guangzhou', savedAt: null, snapshot: null },
  ]);
  expect(JSON.parse(localStorage.getItem('gzww:favorites')!)).toEqual([...oldIds, 'old-removed-place']);
});
