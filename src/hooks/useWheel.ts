import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Activity } from '../data/activities';
import { getTargetRotation, getWheelCandidates } from '../utils/random';

interface WheelOptions {
  duration?: number;
  random?: () => number;
  reducedMotion?: boolean;
}

export function useWheel(items: Activity[], options: WheelOptions = {}) {
  const duration = options.reducedMotion ? 700 : (options.duration ?? 3800);
  const random = options.random ?? Math.random;
  const [lockedCandidates, setLockedCandidates] = useState<Activity[] | null>(null);
  const [lockedItems, setLockedItems] = useState<Activity[] | null>(null);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [categoryHistory, setCategoryHistory] = useState<Activity['category'][]>([]);
  const spinLockRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const previewCandidates = useMemo(
    () => getWheelCandidates(items, lastSelectedId, random),
    [items, lastSelectedId, random],
  );
  const candidates =
    lockedItems === items && lockedCandidates
      ? lockedCandidates
      : previewCandidates;

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const spin = useCallback(() => {
    if (spinLockRef.current || items.length === 0) return false;

    const nextCandidates = getWheelCandidates(
      items,
      lastSelectedId,
      random,
    );
    const nextIndex = Math.min(
      nextCandidates.length - 1,
      Math.floor(random() * nextCandidates.length),
    );
    const nextActivity = nextCandidates[nextIndex];
    if (!nextActivity) return false;

    spinLockRef.current = true;
    setLockedCandidates(nextCandidates);
    setLockedItems(items);
    setSelectedActivity(null);
    setSelectedIndex(nextIndex);
    setIsSpinning(true);
    setRotation((current) =>
      getTargetRotation(nextIndex, nextCandidates.length, current),
    );

    timerRef.current = setTimeout(() => {
      setLastSelectedId(nextActivity.id);
      setSelectedActivity(nextActivity);
      setSpinCount((count) => count + 1);
      setCategoryHistory((history) => [...history.slice(-2), nextActivity.category]);
      setIsSpinning(false);
      spinLockRef.current = false;
    }, duration);

    return true;
  }, [duration, items, lastSelectedId, random]);

  const clearResult = useCallback(() => setSelectedActivity(null), []);

  return {
    candidates,
    selectedIndex,
    selectedActivity,
    rotation,
    isSpinning,
    spinCount,
    categoryHistory,
    spin,
    clearResult,
    duration,
  };
}
