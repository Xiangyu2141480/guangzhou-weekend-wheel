import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SELECTED_CITY_STORAGE_KEY, useSelectedCity } from './useSelectedCity';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('useSelectedCity', () => {
  it('keeps missing and invalid stored values unselected', () => {
    const missing = renderHook(() => useSelectedCity());
    expect(missing.result.current.selectedCity).toBeNull();
    missing.unmount();

    localStorage.setItem(SELECTED_CITY_STORAGE_KEY, 'not-a-city');
    const invalid = renderHook(() => useSelectedCity());
    expect(invalid.result.current.selectedCity).toBeNull();
  });

  it('restores and persists valid city ids', () => {
    localStorage.setItem(SELECTED_CITY_STORAGE_KEY, 'shanghai');
    const { result } = renderHook(() => useSelectedCity());
    expect(result.current.selectedCity).toBe('shanghai');

    act(() => {
      expect(result.current.selectCity('shenzhen')).toBe(true);
    });
    expect(result.current.selectedCity).toBe('shenzhen');
    expect(localStorage.getItem(SELECTED_CITY_STORAGE_KEY)).toBe('shenzhen');
  });

  it('keeps an in-memory selection when storage writes fail', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useSelectedCity());

    act(() => {
      result.current.selectCity('suzhou');
    });

    expect(result.current.selectedCity).toBe('suzhou');
  });
});
