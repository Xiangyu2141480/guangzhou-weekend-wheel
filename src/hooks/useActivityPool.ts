import { useEffect, useState } from 'react';
import { getDataUrl } from '../config/pages';
import type { Activity, LiveActivity } from '../data/types';
import { isActivity } from '../data/types';

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
  finalCount: number;
  usedFallback: boolean;
  warnings: string[];
}

interface ActivityPoolState {
  activities: Activity[];
  liveCount: number;
  evergreenCount: number;
  syncStatus: ActivitySyncStatus | null;
  loading: boolean;
}

interface ActivityPoolOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function isPublishableLiveActivity(value: unknown): value is LiveActivity {
  return Boolean(
    isActivity(value) &&
      value.live &&
      value.name.trim() &&
      value.venue.trim() &&
      value.sourceName.trim() &&
      isHttpUrl(value.sourceUrl) &&
      !Number.isNaN(new Date(value.eventStart).getTime()) &&
      (!value.eventEnd || !Number.isNaN(new Date(value.eventEnd).getTime())),
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
        liveActivities = activityResult.value.filter(isPublishableLiveActivity);
        const rejectedCount = activityResult.value.length - liveActivities.length;
        if (rejectedCount > 0) {
          console.warn(`Ignored ${rejectedCount} invalid live activity record(s).`);
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
        syncStatus,
        loading: false,
      });
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [baseUrl, evergreen, fetcher]);

  return state;
}
