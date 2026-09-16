import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { activities } from '../data/activities';
import { useWheel } from './useWheel';

describe('useWheel', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('locks the ten visible candidates while spinning and reveals the preselected candidate', () => {
    const random = vi.fn(() => 0.25);
    const { result } = renderHook(() =>
      useWheel(activities.slice(0, 12), { duration: 1000, random }),
    );

    const visibleCandidateIds = result.current.candidates.map((item) => item.id);
    expect(visibleCandidateIds).toHaveLength(10);
    act(() => result.current.spin());
    const preselected = result.current.candidates[result.current.selectedIndex];
    const lockedRotation = result.current.rotation;
    act(() => result.current.spin());

    expect(result.current.isSpinning).toBe(true);
    expect(result.current.candidates.map((item) => item.id)).toEqual(visibleCandidateIds);
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

  test('keeps the selected candidate stable when items change during a spin', () => {
    const initialItems = activities.slice(0, 12);
    const replacementItems = activities.slice(20, 28);
    const { result, rerender } = renderHook(
      ({ items }) => useWheel(items, { duration: 100, random: () => 0.25 }),
      { initialProps: { items: initialItems } },
    );
    const lockedIds = result.current.candidates.map((item) => item.id);

    act(() => result.current.spin());
    const preselected = result.current.candidates[result.current.selectedIndex];
    rerender({ items: replacementItems });

    expect(result.current.candidates.map((item) => item.id)).toEqual(lockedIds);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.selectedActivity).toEqual(preselected);
    expect(result.current.candidates.every((item) => replacementItems.includes(item))).toBe(true);
  });

  test('rerolls ten candidates without selecting a result and retains two rounds of history', () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const { result } = renderHook(() =>
      useWheel(activities.slice(0, 40), { duration: 100, random }),
    );
    const firstRound = result.current.candidates.map((item) => item.id);

    act(() => result.current.reroll());

    expect(result.current.candidates).toHaveLength(10);
    expect(result.current.candidates.map((item) => item.id)).not.toEqual(firstRound);
    expect(result.current.selectedActivity).toBeNull();
    expect(result.current.recentCandidateIds).toHaveLength(20);
  });

  test('changes mode while idle and ignores reroll while spinning', () => {
    const { result } = renderHook(() =>
      useWheel(activities.slice(0, 24), { duration: 100 }),
    );

    act(() => result.current.setMode('fate'));
    expect(result.current.mode).toBe('fate');

    act(() => result.current.spin());
    const lockedIds = result.current.candidates.map((item) => item.id);
    let rerolled = true;
    act(() => {
      rerolled = result.current.reroll();
    });

    expect(rerolled).toBe(false);
    expect(result.current.candidates.map((item) => item.id)).toEqual(lockedIds);
  });
});
