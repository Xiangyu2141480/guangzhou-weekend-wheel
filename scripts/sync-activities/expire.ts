import { getLiveStatus, isExpired } from '../../src/utils/date';
import { isCityId, type CityId } from '../../src/data/cities';
import type { NormalizedLiveActivity } from './types';

export interface ExpiryResult {
  activities: NormalizedLiveActivity[];
  expiredCount: number;
}

export function removeExpiredActivities(
  activities: NormalizedLiveActivity[],
  now = new Date(),
  cityIds?: readonly CityId[],
): ExpiryResult {
  const allowedCities = cityIds ? new Set<CityId>(cityIds) : null;
  for (const activity of activities) {
    if (!isCityId(activity.cityId) || (allowedCities && !allowedCities.has(activity.cityId))) {
      throw new TypeError(`Activity "${activity.id}" does not belong to the selected cities`);
    }
  }
  const active = activities
    .filter((activity) => !isExpired(activity, now))
    .map((activity) => ({
      ...activity,
      status: getLiveStatus(activity, now),
    }));
  return {
    activities: active,
    expiredCount: activities.length - active.length,
  };
}
