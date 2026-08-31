import type { NormalizedLiveActivity } from './types';

export interface DeduplicateResult {
  activities: NormalizedLiveActivity[];
  duplicateCount: number;
}

export function deduplicateActivities(
  activities: NormalizedLiveActivity[],
): DeduplicateResult {
  const unique = new Map<string, NormalizedLiveActivity>();
  for (const activity of activities) {
    if (!unique.has(activity.fingerprint)) unique.set(activity.fingerprint, activity);
  }
  return {
    activities: [...unique.values()],
    duplicateCount: activities.length - unique.size,
  };
}
