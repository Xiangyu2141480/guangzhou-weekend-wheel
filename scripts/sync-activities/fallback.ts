import { deduplicateActivities } from './deduplicate';
import type { NormalizedLiveActivity } from './types';

export interface SnapshotInput {
  previous: NormalizedLiveActivity[];
  current: NormalizedLiveActivity[];
  failedSourceNames: readonly string[];
}

export interface SnapshotDecision {
  activities: NormalizedLiveActivity[];
  usedFallback: boolean;
  fallbackCount: number;
  warning?: string;
}

export function selectSnapshot(input: SnapshotInput): SnapshotDecision {
  const failedSources = new Set(input.failedSourceNames);
  const fallback = input.previous.filter((activity) => failedSources.has(activity.sourceName));
  const merged = deduplicateActivities([...input.current, ...fallback]).activities;
  const fallbackCount = merged.length - input.current.length;

  return {
    activities: merged,
    usedFallback: fallbackCount > 0,
    fallbackCount,
    warning: fallbackCount > 0
      ? `restored ${fallbackCount} valid previous record(s) for failed sources`
      : undefined,
  };
}
