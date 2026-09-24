import { beforeEach, describe, expect, test } from 'vitest';
import { activities } from '../data/activities';
import { createFavoriteRecord, loadFavorites, saveFavorites } from './storage';

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
