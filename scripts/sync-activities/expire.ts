import { getLiveStatus, isExpired } from '../../src/utils/date';
import type { NormalizedLiveActivity } from './types';

export interface ExpiryResult {
  activities: NormalizedLiveActivity[];
  expiredCount: number;
}

export function removeExpiredActivities(
  activities: NormalizedLiveActivity[],
  now = new Date(),
): ExpiryResult {
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
