import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import { useFavorites } from './useFavorites';

beforeEach(() => localStorage.clear());

test('toggles favorites and restores them in a new hook instance', () => {
  const first = renderHook(() => useFavorites());

  act(() => first.result.current.toggleFavorite('haizhu-wetland'));
  expect(first.result.current.isFavorite('haizhu-wetland')).toBe(true);
  first.unmount();

  const restored = renderHook(() => useFavorites());
  expect(restored.result.current.favoriteIds).toEqual(['haizhu-wetland']);

  act(() => restored.result.current.toggleFavorite('haizhu-wetland'));
  expect(restored.result.current.favoriteIds).toEqual([]);
});
