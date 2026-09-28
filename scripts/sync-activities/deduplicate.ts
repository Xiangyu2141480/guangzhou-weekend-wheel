import { isCityId, type CityId } from '../../src/data/cities';
import type { NormalizedLiveActivity } from './types';

export interface DeduplicateResult {
  activities: NormalizedLiveActivity[];
  duplicateCount: number;
}

export function deduplicateActivities(
  activities: NormalizedLiveActivity[],
  cityIds?: readonly CityId[],
): DeduplicateResult {
  const allowedCities = cityIds ? new Set<CityId>(cityIds) : null;
  const unique = new Map<string, NormalizedLiveActivity>();
  for (const activity of activities) {
    if (!isCityId(activity.cityId) || (allowedCities && !allowedCities.has(activity.cityId))) {
      throw new TypeError(`Activity "${activity.id}" does not belong to the selected cities`);
    }
    if (!unique.has(activity.fingerprint)) unique.set(activity.fingerprint, activity);
  }
  return {
    activities: [...unique.values()],
    duplicateCount: activities.length - unique.size,
  };
}
