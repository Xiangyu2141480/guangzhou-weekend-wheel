import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { activities } from '../data/activities';
import { useWheel } from './useWheel';

describe('useWheel', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('locks while spinning and reveals the preselected candidate', () => {
    const random = vi.fn(() => 0.25);
    const { result } = renderHook(() =>
      useWheel(activities.slice(0, 12), { duration: 1000, random }),
    );

    act(() => result.current.spin());
    const preselected = result.current.candidates[result.current.selectedIndex];
    const lockedRotation = result.current.rotation;
    act(() => result.current.spin());

    expect(result.current.isSpinning).toBe(true);
    expect(result.current.rotation).toBe(lockedRotation);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.selectedActivity).toEqual(preselected);
    expect(result.current.isSpinning).toBe(false);
  });

  test('refreshes candidates when filters change', () => {
    const { result, rerender } = renderHook(
      ({ items }) => useWheel(items, { duration: 100 }),
      { initialProps: { items: activities.slice(0, 12) } },
    );

    rerender({ items: activities.slice(20, 28) });
    expect(result.current.candidates.every((item) => activities.slice(20, 28).includes(item))).toBe(true);
  });
});
