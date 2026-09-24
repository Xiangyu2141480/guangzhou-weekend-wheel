import { useEffect, useState } from 'react';
import { getDataUrl } from '../config/pages';
import { isTrustedHttpsUrl } from '../config/trustedUrls';
import type { Activity, LiveActivity } from '../data/types';
import { isActivity } from '../data/types';
import { upgradeGuangzhouActivity } from '../data/guangzhouCompatibility';
import { getLiveStatus, isExpired } from '../utils/date';

export interface ActivitySyncStatus {
  generatedAt: string | null;
  configuredSources: number;
  successfulSources: number;
  failedSources: number;
  sourceCounts: Record<string, number>;
  fetchedCount: number;
  invalidCount: number;
  expiredCount: number;
  duplicateCount: number;
  fallbackCount: number;
  finalCount: number;
  usedFallback: boolean;
  warnings: string[];
}

export type ActivityPoolAvailability = 'normal' | 'degraded' | 'evergreen-only';

interface ActivityPoolState {
  activities: Activity[];
  liveCount: number;
  evergreenCount: number;
  availability: ActivityPoolAvailability;
  syncStatus: ActivitySyncStatus | null;
  loading: boolean;
}

interface ActivityPoolOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
  now?: Date;
}

const ISO_DATE_TIME_WITH_ZONE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/u;

function isPublishableLiveActivity(value: unknown): value is LiveActivity {
  const activity = upgradeGuangzhouActivity(value);
  if (!isActivity(activity) || !activity.live) return false;
  const start = ISO_DATE_TIME_WITH_ZONE.test(activity.eventStart)
    ? new Date(activity.eventStart)
    : null;
  const end = activity.eventEnd && ISO_DATE_TIME_WITH_ZONE.test(activity.eventEnd)
    ? new Date(activity.eventEnd)
    : null;
  return Boolean(
    activity.name.trim() &&
      activity.venue.trim() &&
      activity.sourceName.trim() &&
      isTrustedHttpsUrl(activity.sourceUrl) &&
      start &&
      !Number.isNaN(start.getTime()) &&
      (!activity.eventEnd || (end && !Number.isNaN(end.getTime()) && end >= start)),
  );
}

function isSyncStatus(value: unknown): value is ActivitySyncStatus {
  if (!value || typeof value !== 'object') return false;
  const status = value as Record<string, unknown>;
  return (
    (typeof status.generatedAt === 'string' || status.generatedAt === null) &&
    typeof status.configuredSources === 'number' &&
    typeof status.successfulSources === 'number' &&
    typeof status.failedSources === 'number' &&
    typeof status.fallbackCount === 'number' &&
    typeof status.finalCount === 'number' &&
    Array.isArray(status.warnings) &&
    status.sourceCounts !== null &&
    typeof status.sourceCounts === 'object'
  );
}

async function loadJson(
  fetcher: typeof fetch,
  url: string,
  signal: AbortSignal,
): Promise<unknown> {
  const response = await fetcher(url, { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json() as Promise<unknown>;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useActivityPool(
  evergreen: Activity[],
  options: ActivityPoolOptions = {},
): ActivityPoolState {
  const baseUrl = options.baseUrl ?? import.meta.env.BASE_URL;
  const fetcher = options.fetcher ?? globalThis.fetch;
  const [state, setState] = useState<ActivityPoolState>(() => ({
    activities: evergreen,
    liveCount: 0,
    evergreenCount: evergreen.length,
    availability: 'evergreen-only',
    syncStatus: null,
    loading: true,
  }));

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const activityRequest = loadJson(
      fetcher,
      getDataUrl('live-activities.json', baseUrl),
      controller.signal,
    );
    const statusRequest = loadJson(
      fetcher,
      getDataUrl('sync-status.json', baseUrl),
      controller.signal,
    );

    void Promise.allSettled([activityRequest, statusRequest]).then(([activityResult, statusResult]) => {
      if (!active) return;

      let liveActivities: LiveActivity[] = [];
      if (activityResult.status === 'fulfilled' && Array.isArray(activityResult.value)) {
        const now = options.now ?? new Date();
        liveActivities = activityResult.value
          .map(upgradeGuangzhouActivity)
          .filter(isPublishableLiveActivity)
          .filter((activity) => !isExpired(activity, now))
          .map((activity) => ({
            ...activity,
            status: getLiveStatus(activity, now),
          }));
        const rejectedCount = activityResult.value.length - liveActivities.length;
        if (rejectedCount > 0) {
          console.warn(`Ignored ${rejectedCount} invalid or expired live activity record(s).`);
        }
      } else {
        const reason = activityResult.status === 'rejected' ? activityResult.reason : 'response is not an array';
        if (!isAbortError(reason)) console.warn('Live activities unavailable; using evergreen pool.', reason);
      }

      const evergreenIds = new Set(evergreen.map((activity) => activity.id));
      const uniqueLive = liveActivities.filter((activity) => {
        if (evergreenIds.has(activity.id)) return false;
        evergreenIds.add(activity.id);
        return true;
      });
      const syncStatus = statusResult.status === 'fulfilled' && isSyncStatus(statusResult.value)
        ? statusResult.value
        : null;
      if (!syncStatus && statusResult.status === 'rejected' && !isAbortError(statusResult.reason)) {
        console.warn('Live activity sync status unavailable.', statusResult.reason);
      }

      setState({
        activities: [...evergreen, ...uniqueLive],
        liveCount: uniqueLive.length,
        evergreenCount: evergreen.length,
        availability: uniqueLive.length === 0
          ? 'evergreen-only'
          : !syncStatus || syncStatus.usedFallback || syncStatus.failedSources > 0
            ? 'degraded'
            : 'normal',
        syncStatus,
        loading: false,
      });
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [baseUrl, evergreen, fetcher, options.now]);

  return state;
}
