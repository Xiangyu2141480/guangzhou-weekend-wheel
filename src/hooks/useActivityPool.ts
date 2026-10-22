import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDataUrl } from '../config/pages';
import { isTrustedHttpsUrl } from '../config/trustedUrls';
import type { CityId } from '../data/cities';
import { loadCityEvergreen } from '../data/evergreenLoader';
import type { Activity, EvergreenActivity, LiveActivity } from '../data/types';
import { isActivity } from '../data/types';
import { getLiveStatus, isExpired } from '../utils/date';

export type ActivityPoolAvailability = 'normal' | 'degraded' | 'evergreen-only';
type SnapshotAvailability = 'fresh' | 'partial' | 'stale' | 'evergreen-only';

interface SnapshotSource {
  id: string;
  name: string;
  sourceType: 'government' | 'official-venue';
  availability: 'fresh' | 'fallback' | 'unavailable';
  fetched: number;
  final: number;
}

interface SnapshotCounts {
  fetched: number;
  invalid: number;
  expired: number;
  duplicate: number;
  current: number;
  fallback: number;
  final: number;
}

export interface CityActivitySnapshot {
  schemaVersion: 2;
  cityId: CityId;
  generatedAt: string | null;
  availability: SnapshotAvailability;
  sources: SnapshotSource[];
  counts: SnapshotCounts;
  warnings: string[];
  activities: LiveActivity[];
}

interface ActivityPoolState {
  cityId: CityId | null;
  activities: Activity[];
  liveCount: number;
  evergreenCount: number;
  availability: ActivityPoolAvailability;
  syncStatus: CityActivitySnapshot | null;
  loading: boolean;
  error: string | null;
}

interface ActivityPoolOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
  now?: Date;
  storage?: Storage | null;
}

interface CachedSnapshot {
  cachedAt: string;
  snapshot: CityActivitySnapshot;
}

const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000;
const SNAPSHOT_AVAILABILITIES = new Set<SnapshotAvailability>([
  'fresh', 'partial', 'stale', 'evergreen-only',
]);
const SOURCE_AVAILABILITIES = new Set<SnapshotSource['availability']>([
  'fresh', 'fallback', 'unavailable',
]);
const ISO_DATE_TIME_WITH_ZONE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/u;

export function getSnapshotCacheKey(cityId: CityId): string {
  return `where-to-go:snapshot:${cityId}:v2`;
}

function getStorage(storage: Storage | null | undefined): Storage | null {
  if (storage !== undefined) return storage;
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isPublishableLiveActivity(value: unknown, cityId: CityId): value is LiveActivity {
  if (!isActivity(value) || !value.live || value.cityId !== cityId) return false;
  const start = ISO_DATE_TIME_WITH_ZONE.test(value.eventStart) ? new Date(value.eventStart) : null;
  const end = value.eventEnd && ISO_DATE_TIME_WITH_ZONE.test(value.eventEnd)
    ? new Date(value.eventEnd)
    : null;
  return Boolean(
    value.name.trim() &&
      value.venue.trim() &&
      value.sourceName.trim() &&
      isTrustedHttpsUrl(value.sourceUrl) &&
      start &&
      !Number.isNaN(start.getTime()) &&
      (!value.eventEnd || (end && !Number.isNaN(end.getTime()) && end >= start)),
  );
}

function parseSnapshot(value: unknown, cityId: CityId): CityActivitySnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const snapshot = value as Record<string, unknown>;
  const counts = snapshot.counts as Record<string, unknown> | undefined;
  const countKeys = ['fetched', 'invalid', 'expired', 'duplicate', 'current', 'fallback', 'final'];
  if (
    snapshot.schemaVersion !== 2 ||
    snapshot.cityId !== cityId ||
    (snapshot.generatedAt !== null &&
      (typeof snapshot.generatedAt !== 'string' || !Number.isFinite(Date.parse(snapshot.generatedAt)))) ||
    !SNAPSHOT_AVAILABILITIES.has(snapshot.availability as SnapshotAvailability) ||
    !Array.isArray(snapshot.sources) ||
    !snapshot.sources.every((source) => {
      if (!source || typeof source !== 'object') return false;
      const item = source as Record<string, unknown>;
      return typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        (item.sourceType === 'government' || item.sourceType === 'official-venue') &&
        SOURCE_AVAILABILITIES.has(item.availability as SnapshotSource['availability']) &&
        isNonNegativeInteger(item.fetched) &&
        isNonNegativeInteger(item.final);
    }) ||
    !counts ||
    !countKeys.every((key) => isNonNegativeInteger(counts[key])) ||
    !Array.isArray(snapshot.warnings) ||
    !snapshot.warnings.every((warning) => typeof warning === 'string') ||
    !Array.isArray(snapshot.activities) ||
    !snapshot.activities.every((activity) => isPublishableLiveActivity(activity, cityId)) ||
    counts.final !== snapshot.activities.length
  ) {
    return null;
  }
  return snapshot as unknown as CityActivitySnapshot;
}

function getSnapshotPath(manifest: unknown, cityId: CityId): string | null {
  if (!manifest || typeof manifest !== 'object') return null;
  const value = manifest as Record<string, unknown>;
  if (value.schemaVersion !== 2 || !Array.isArray(value.cities)) return null;
  const entry = value.cities.find((candidate) =>
    candidate !== null &&
    typeof candidate === 'object' &&
    (candidate as Record<string, unknown>).cityId === cityId);
  if (!entry) return null;
  const path = (entry as Record<string, unknown>).snapshot;
  return path === `cities/${cityId}.json` ? path : null;
}

async function loadJson(fetcher: typeof fetch, url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetcher(url, { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json() as Promise<unknown>;
}

function readCachedSnapshot(storage: Storage | null, cityId: CityId, now: Date) {
  try {
    const raw = storage?.getItem(getSnapshotCacheKey(cityId));
    if (!raw) return null;
    const cached = JSON.parse(raw) as Partial<CachedSnapshot>;
    const cachedAt = typeof cached.cachedAt === 'string' ? Date.parse(cached.cachedAt) : Number.NaN;
    const snapshot = parseSnapshot(cached.snapshot, cityId);
    const age = now.getTime() - cachedAt;
    return snapshot && Number.isFinite(cachedAt) && age >= 0 && age <= CACHE_MAX_AGE_MS
      ? snapshot
      : null;
  } catch {
    return null;
  }
}

function cacheSnapshot(storage: Storage | null, snapshot: CityActivitySnapshot, now: Date) {
  try {
    storage?.setItem(getSnapshotCacheKey(snapshot.cityId), JSON.stringify({
      cachedAt: now.toISOString(),
      snapshot,
    } satisfies CachedSnapshot));
  } catch {
    // A valid network snapshot remains usable when storage is unavailable.
  }
}

function buildState(
  cityId: CityId,
  evergreen: readonly EvergreenActivity[],
  snapshot: CityActivitySnapshot | null,
  now: Date,
  fromCache = false,
): ActivityPoolState {
  const live = (snapshot?.activities ?? [])
    .filter((activity) => !isExpired(activity, now))
    .map((activity) => ({ ...activity, status: getLiveStatus(activity, now) }));
  const ids = new Set(evergreen.map((activity) => activity.id));
  const uniqueLive = live.filter((activity) => !ids.has(activity.id) && Boolean(ids.add(activity.id)));
  const availability = uniqueLive.length === 0
    ? 'evergreen-only'
    : fromCache || snapshot?.availability !== 'fresh'
      ? 'degraded'
      : 'normal';
  return {
    cityId,
    activities: [...evergreen, ...uniqueLive],
    liveCount: uniqueLive.length,
    evergreenCount: evergreen.length,
    availability,
    syncStatus: snapshot,
    loading: false,
    error: null,
  };
}

function initialState(cityId: CityId | null): ActivityPoolState {
  return {
    cityId,
    activities: [],
    liveCount: 0,
    evergreenCount: 0,
    availability: 'evergreen-only',
    syncStatus: null,
    loading: cityId !== null,
    error: null,
  };
}

export function useActivityPool(
  cityId: CityId | null,
  options: ActivityPoolOptions = {},
): ActivityPoolState & { retry: () => void } {
  const baseUrl = options.baseUrl ?? import.meta.env.BASE_URL;
  const fetcher = options.fetcher ?? globalThis.fetch;
  const storage = getStorage(options.storage);
  const now = useMemo(() => options.now ?? new Date(), [options.now]);
  const [attempt, setAttempt] = useState(0);
  // A new token on every request also distinguishes A → B → A and retries.
  const request = useMemo(() => ({ cityId, baseUrl, fetcher, storage, now, attempt }), [cityId, baseUrl, fetcher, storage, now, attempt]);
  const [state, setState] = useState(() => ({ request, value: initialState(cityId) }));
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (!cityId) return;
    const controller = new AbortController();
    let active = true;
    const loadSnapshot = async () => {
      try {
        const manifest = await loadJson(fetcher, getDataUrl('manifest.json', baseUrl), controller.signal);
        const snapshotPath = getSnapshotPath(manifest, cityId);
        if (!snapshotPath) throw new TypeError(`Manifest has no valid entry for ${cityId}`);
        const value = await loadJson(fetcher, getDataUrl(snapshotPath, baseUrl), controller.signal);
        const snapshot = parseSnapshot(value, cityId);
        if (!snapshot) throw new TypeError(`Invalid ${cityId} snapshot`);
        if (!active || controller.signal.aborted) return { snapshot: null, fromCache: false };
        cacheSnapshot(storage, snapshot, now);
        return { snapshot, fromCache: false };
      } catch (error) {
        if (!active || controller.signal.aborted) return { snapshot: null, fromCache: false };
        console.warn(`Activity snapshot unavailable for ${cityId}; using local fallback.`, error);
        const snapshot = readCachedSnapshot(storage, cityId, now);
        return { snapshot, fromCache: Boolean(snapshot) };
      }
    };
    // Live data refreshes independently: a slow source must not block the wheel.
    const liveRequest = loadSnapshot();
    void (async () => {
      try {
        const evergreen = await loadCityEvergreen(cityId, { baseUrl, fetcher, storage, signal: controller.signal });
        if (!active) return;
        setState({ request, value: buildState(cityId, evergreen.activities, null, now) });
        const live = await liveRequest;
        if (active && !controller.signal.aborted) {
          setState({ request, value: buildState(cityId, evergreen.activities, live.snapshot, now, live.fromCache) });
        }
      } catch {
        if (active) {
          controller.abort();
          setState({ request, value: { ...initialState(cityId), loading: false, error: '常驻选项暂时加载失败，请重试。' } });
        }
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [request, baseUrl, cityId, fetcher, now, storage]);

  return { ...(state.request === request ? state.value : initialState(cityId)), retry };
}
