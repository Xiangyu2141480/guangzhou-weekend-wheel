import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Activity, RandomMode } from '../data/types';
import { sampleCandidates } from '../utils/activityPool';
import { getTargetRotation } from '../utils/random';

interface WheelOptions {
  duration?: number;
  initialMode?: RandomMode;
  random?: () => number;
  reducedMotion?: boolean;
}

const CANDIDATE_COUNT = 10;
const CANDIDATE_HISTORY_LIMIT = CANDIDATE_COUNT * 2;
const RESULT_HISTORY_LIMIT = 3;
const REDUCED_MOTION_DURATION = 200;

export function useWheel(items: Activity[], options: WheelOptions = {}) {
  const duration = options.reducedMotion ? REDUCED_MOTION_DURATION : (options.duration ?? 3800);
  const random = options.random ?? Math.random;
  const [mode, setModeState] = useState<RandomMode>(options.initialMode ?? 'fresh');
  const [lockedCandidates, setLockedCandidates] = useState<Activity[] | null>(null);
  const [lockedItems, setLockedItems] = useState<Activity[] | null>(null);
  const [lockedMode, setLockedMode] = useState<RandomMode | null>(null);
  const [recentCandidateIds, setRecentCandidateIds] = useState<string[]>([]);
  const [recentSelectedIds, setRecentSelectedIds] = useState<string[]>([]);
  const recentCandidateIdsRef = useRef<string[]>([]);
  const recentSelectedIdsRef = useRef<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [categoryHistory, setCategoryHistory] = useState<Activity['category'][]>([]);
  const spinLockRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const previewCandidates = useMemo(
    () => sampleCandidates(items, {
      mode,
      count: CANDIDATE_COUNT,
      recentCandidateIds,
      recentSelectedIds,
      random,
    }),
    [items, mode, random, recentCandidateIds, recentSelectedIds],
  );
  const candidates =
    lockedCandidates &&
    (isSpinning || selectedActivity || (lockedItems === items && lockedMode === mode))
      ? lockedCandidates
      : previewCandidates;

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const rememberCandidateRounds = useCallback((ids: string[]) => {
    const next = ids.slice(-CANDIDATE_HISTORY_LIMIT);
    recentCandidateIdsRef.current = next;
    setRecentCandidateIds(next);
  }, []);

  const spin = useCallback(() => {
    if (spinLockRef.current || candidates.length === 0) return false;

    const nextIndex = Math.min(
      candidates.length - 1,
      Math.floor(random() * candidates.length),
    );
    const nextActivity = candidates[nextIndex];
    if (!nextActivity) return false;

    spinLockRef.current = true;
    setLockedCandidates(candidates);
    setLockedItems(items);
    setLockedMode(mode);
    setSelectedActivity(null);
    setSelectedIndex(nextIndex);
    setIsSpinning(true);
    setRotation((current) =>
      getTargetRotation(nextIndex, candidates.length, current),
    );
    rememberCandidateRounds([
      ...recentCandidateIdsRef.current,
      ...candidates.map((item) => item.id),
    ]);

    timerRef.current = setTimeout(() => {
      const nextSelectedIds = [
        ...recentSelectedIdsRef.current,
        nextActivity.id,
      ].slice(-RESULT_HISTORY_LIMIT);
      recentSelectedIdsRef.current = nextSelectedIds;
      setRecentSelectedIds(nextSelectedIds);
      setSelectedActivity(nextActivity);
      setSpinCount((count) => count + 1);
      setCategoryHistory((history) => [...history.slice(-2), nextActivity.category]);
      setIsSpinning(false);
      spinLockRef.current = false;
    }, duration);

    return true;
  }, [candidates, duration, items, mode, random, rememberCandidateRounds]);

  const reroll = useCallback(() => {
    if (spinLockRef.current) return false;

    const currentIds = candidates.map((item) => item.id);
    const historyWithCurrent = [
      ...recentCandidateIdsRef.current,
      ...currentIds,
    ].slice(-CANDIDATE_HISTORY_LIMIT);
    const nextCandidates = sampleCandidates(items, {
      mode,
      count: CANDIDATE_COUNT,
      recentCandidateIds: historyWithCurrent,
      recentSelectedIds: recentSelectedIdsRef.current,
      random,
    });

    setLockedCandidates(nextCandidates);
    setLockedItems(items);
    setLockedMode(mode);
    setSelectedActivity(null);
    setSelectedIndex(-1);
    rememberCandidateRounds([...currentIds, ...nextCandidates.map((item) => item.id)]);
    return true;
  }, [candidates, items, mode, random, rememberCandidateRounds]);

  const setMode = useCallback((nextMode: RandomMode) => {
    if (spinLockRef.current || nextMode === mode) return false;
    setLockedCandidates(null);
    setLockedItems(null);
    setLockedMode(null);
    setSelectedActivity(null);
    setSelectedIndex(-1);
    setModeState(nextMode);
    return true;
  }, [
    mode,
    setLockedCandidates,
    setLockedItems,
    setLockedMode,
    setModeState,
    setSelectedActivity,
    setSelectedIndex,
  ]);

  const clearResult = useCallback(
    () => setSelectedActivity(null),
    [setSelectedActivity],
  );

  const reset = useCallback(() => {
    if (spinLockRef.current) return false;

    setLockedCandidates(null);
    setLockedItems(null);
    setLockedMode(null);
    recentCandidateIdsRef.current = [];
    recentSelectedIdsRef.current = [];
    setRecentCandidateIds([]);
    setRecentSelectedIds([]);
    setSelectedIndex(-1);
    setSelectedActivity(null);
    setRotation(0);
    setSpinCount(0);
    setCategoryHistory([]);
    setModeState(options.initialMode ?? 'fresh');
    return true;
  }, [options.initialMode]);

  return {
    candidates,
    selectedIndex,
    selectedActivity,
    rotation,
    isSpinning,
    spinCount,
    categoryHistory,
    mode,
    recentCandidateIds,
    recentSelectedIds,
    spin,
    reroll,
    setMode,
    clearResult,
    reset,
    duration,
  };
}
