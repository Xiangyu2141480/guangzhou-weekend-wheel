import { beforeEach, describe, expect, test } from 'vitest';
import { loadFavorites, removeFavorite, saveFavorites } from './storage';

describe('favorites storage', () => {
  beforeEach(() => localStorage.clear());

  test('persists and removes favorite activity IDs', () => {
    saveFavorites(['haizhu-wetland']);
    expect(loadFavorites()).toEqual(['haizhu-wetland']);

    removeFavorite('haizhu-wetland');
    expect(loadFavorites()).toEqual([]);
  });

  test('recovers safely from corrupt JSON', () => {
    localStorage.setItem('gzww:favorites', '{broken');

    expect(loadFavorites()).toEqual([]);
  });
});
