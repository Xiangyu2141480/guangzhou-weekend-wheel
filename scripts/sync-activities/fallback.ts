import { deduplicateActivities } from './deduplicate';
import type { CityId } from '../../src/data/cities';
import type { NormalizedLiveActivity } from './types';

export interface FailedSource {
  id: string;
  cityId: CityId;
}

export interface SnapshotInput {
  previous: NormalizedLiveActivity[];
  current: NormalizedLiveActivity[];
  failedSources: readonly FailedSource[];
  cityIds: readonly CityId[];
}

export interface SnapshotDecision {
  activities: NormalizedLiveActivity[];
  usedFallback: boolean;
  fallbackCount: number;
  warning?: string;
}

export function selectSnapshot(input: SnapshotInput): SnapshotDecision {
  deduplicateActivities(input.previous, input.cityIds);
  deduplicateActivities(input.current, input.cityIds);
  const failedSources = new Set(
    input.failedSources.map((source) => `${source.cityId}:${source.id}`),
  );
  const fallback = input.previous.filter((activity) =>
    failedSources.has(`${activity.cityId}:${activity.sourceId}`));
  const merged = deduplicateActivities([...input.current, ...fallback], input.cityIds).activities;
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
