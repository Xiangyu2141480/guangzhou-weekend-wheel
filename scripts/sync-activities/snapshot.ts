import { isActivity } from '../../src/data/types';
import { CITY_IDS, isCityId, type CityId } from '../../src/data/cities';
import type { NormalizedLiveActivity, SourceAdapter } from './types';
import { validateRawActivity } from './validate';

export const SNAPSHOT_SCHEMA_VERSION = 2 as const;
export const FALLBACK_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000;

export type ActivityAvailability = 'fresh' | 'partial' | 'stale' | 'evergreen-only';
export type SourceAvailability = 'fresh' | 'fallback' | 'unavailable';

export interface SnapshotSource {
  id: string;
  name: string;
  sourceType: SourceAdapter['sourceType'];
  availability: SourceAvailability;
  fetched: number;
  final: number;
}

export interface SnapshotCounts {
  fetched: number;
  invalid: number;
  expired: number;
  duplicate: number;
  current: number;
  fallback: number;
  final: number;
}

export interface CityActivitySnapshot {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  cityId: CityId;
  generatedAt: string | null;
  availability: ActivityAvailability;
  sources: SnapshotSource[];
  counts: SnapshotCounts;
  warnings: string[];
  activities: NormalizedLiveActivity[];
}

export interface ManifestCity {
  cityId: CityId;
  snapshot: string;
  availability: ActivityAvailability;
  generatedAt: string | null;
  liveCount: number;
}

export interface ActivityManifest {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  generatedAt: string | null;
  cities: ManifestCity[];
}

export function isFallbackFresh(lastVerifiedAt: string, now: Date): boolean {
  const verifiedAt = Date.parse(lastVerifiedAt);
  const age = now.getTime() - verifiedAt;
  return Number.isFinite(verifiedAt) && age >= 0 && age <= FALLBACK_MAX_AGE_MS;
}

export function deriveAvailability(
  successfulSources: number,
  failedSources: number,
  currentCount: number,
  fallbackCount: number,
): ActivityAvailability {
  if (currentCount + fallbackCount === 0) return 'evergreen-only';
  if (failedSources === 0 && successfulSources > 0) return 'fresh';
  if (successfulSources > 0) return 'partial';
  return 'stale';
}

export function createManifest(snapshots: readonly CityActivitySnapshot[]): ActivityManifest {
  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    generatedAt: snapshots.every((snapshot) => snapshot.generatedAt === null)
      ? null
      : snapshots.reduce<string | null>((latest, snapshot) => {
        if (!snapshot.generatedAt) return latest;
        return !latest || snapshot.generatedAt > latest ? snapshot.generatedAt : latest;
      }, null),
    cities: snapshots.map((snapshot) => ({
      cityId: snapshot.cityId,
      snapshot: `cities/${snapshot.cityId}.json`,
      availability: snapshot.availability,
      generatedAt: snapshot.generatedAt,
      liveCount: snapshot.counts.final,
    })),
  };
}

function isIsoDateOrNull(value: unknown): value is string | null {
  return value === null ||
    (typeof value === 'string' && Number.isFinite(Date.parse(value)));
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export function validateCitySnapshot(
  value: unknown,
  expectedCityId: CityId,
  adapters: readonly SourceAdapter[],
): asserts value is CityActivitySnapshot {
  if (!value || typeof value !== 'object') throw new TypeError(`${expectedCityId} snapshot is invalid`);
  const snapshot = value as Record<string, unknown>;
  const availability = new Set<ActivityAvailability>([
    'fresh', 'partial', 'stale', 'evergreen-only',
  ]);
  if (
    snapshot.schemaVersion !== SNAPSHOT_SCHEMA_VERSION ||
    snapshot.cityId !== expectedCityId ||
    !isIsoDateOrNull(snapshot.generatedAt) ||
    !availability.has(snapshot.availability as ActivityAvailability) ||
    !Array.isArray(snapshot.sources) ||
    !snapshot.counts ||
    typeof snapshot.counts !== 'object' ||
    !Array.isArray(snapshot.warnings) ||
    !snapshot.warnings.every((warning) => typeof warning === 'string') ||
    !Array.isArray(snapshot.activities)
  ) {
    throw new TypeError(`${expectedCityId} snapshot has an invalid shape`);
  }

  const counts = snapshot.counts as Record<string, unknown>;
  const countKeys = ['fetched', 'invalid', 'expired', 'duplicate', 'current', 'fallback', 'final'];
  if (!countKeys.every((key) => isCount(counts[key]))) {
    throw new TypeError(`${expectedCityId} snapshot has invalid counts`);
  }
  const typedCounts = counts as unknown as SnapshotCounts;

  const adapterById = new Map(adapters.map((adapter) => [adapter.id, adapter]));
  const sourceIds = new Set<string>();
  for (const sourceValue of snapshot.sources) {
    if (!sourceValue || typeof sourceValue !== 'object') {
      throw new TypeError(`${expectedCityId} snapshot has an invalid source`);
    }
    const source = sourceValue as Record<string, unknown>;
    const adapter = typeof source.id === 'string' ? adapterById.get(source.id) : undefined;
    if (
      !adapter ||
      sourceIds.has(adapter.id) ||
      source.name !== adapter.name ||
      source.sourceType !== adapter.sourceType ||
      !new Set<SourceAvailability>(['fresh', 'fallback', 'unavailable'])
        .has(source.availability as SourceAvailability) ||
      !isCount(source.fetched) ||
      !isCount(source.final)
    ) {
      throw new TypeError(`${expectedCityId} snapshot has an invalid source`);
    }
    sourceIds.add(adapter.id);
  }
  if (sourceIds.size !== adapters.length) {
    throw new TypeError(`${expectedCityId} snapshot does not list every configured source`);
  }

  const activities = snapshot.activities as unknown[];
  if (activities.some((item) =>
    !isActivity(item) || !item.live || item.cityId !== expectedCityId ||
    !adapterById.has(item.sourceId) ||
    validateRawActivity(
      item,
      expectedCityId,
      adapterById.get(item.sourceId)?.allowedHosts,
    ).length > 0
  )) {
    throw new TypeError(`${expectedCityId} snapshot contains an invalid activity`);
  }
  const ids = activities.map((item) => (item as NormalizedLiveActivity).id);
  const fingerprints = activities.map((item) => (item as NormalizedLiveActivity).fingerprint);
  if (new Set(ids).size !== ids.length || new Set(fingerprints).size !== fingerprints.length) {
    throw new TypeError(`${expectedCityId} snapshot contains duplicate activities`);
  }
  if (
    typedCounts.final !== activities.length ||
    typedCounts.current + typedCounts.fallback !== typedCounts.final ||
    typedCounts.fetched - typedCounts.invalid - typedCounts.expired -
      typedCounts.duplicate + typedCounts.fallback !== typedCounts.final ||
    (snapshot.sources as SnapshotSource[])
      .reduce((sum, source) => sum + source.final, 0) !== typedCounts.final
  ) {
    throw new TypeError(`${expectedCityId} snapshot counts do not match its activities`);
  }
  const typedSources = snapshot.sources as SnapshotSource[];
  const successfulSources = typedSources.filter((source) => source.availability === 'fresh').length;
  const failedSources = typedSources.length - successfulSources;
  const generatedAt = snapshot.generatedAt as string | null;
  const actualCurrent = generatedAt === null
    ? 0
    : activities.filter((item) =>
      (item as NormalizedLiveActivity).lastVerifiedAt === generatedAt).length;
  const actualFallback = activities.length - actualCurrent;
  if (
    (generatedAt === null && activities.length > 0) ||
    typedCounts.current !== actualCurrent ||
    typedCounts.fallback !== actualFallback ||
    typedSources.some((source) =>
      (source.availability === 'fallback' && source.final === 0) ||
      (source.availability === 'unavailable' && source.final !== 0)) ||
    snapshot.availability !== deriveAvailability(
      successfulSources,
      failedSources,
      typedCounts.current,
      typedCounts.fallback,
    ) ||
    (generatedAt !== null && activities.some((item) => {
      const activity = item as NormalizedLiveActivity;
      return activity.lastVerifiedAt !== generatedAt &&
        !isFallbackFresh(activity.lastVerifiedAt, new Date(generatedAt));
    }))
  ) {
    throw new TypeError(`${expectedCityId} snapshot availability is inconsistent`);
  }
}

export function validateManifest(
  value: unknown,
  snapshots: readonly CityActivitySnapshot[],
): asserts value is ActivityManifest {
  if (!value || typeof value !== 'object') throw new TypeError('manifest is invalid');
  const manifest = value as Record<string, unknown>;
  if (
    manifest.schemaVersion !== SNAPSHOT_SCHEMA_VERSION ||
    !isIsoDateOrNull(manifest.generatedAt) ||
    !Array.isArray(manifest.cities) ||
    manifest.cities.length !== CITY_IDS.length
  ) {
    throw new TypeError('manifest has an invalid shape');
  }
  const expected = createManifest(snapshots);
  if (manifest.generatedAt !== expected.generatedAt) {
    throw new TypeError('manifest generatedAt does not match its snapshots');
  }
  for (const [index, cityId] of CITY_IDS.entries()) {
    const entry = manifest.cities[index] as Record<string, unknown> | undefined;
    const snapshot = snapshots[index];
    if (
      !entry ||
      !isCityId(entry.cityId) ||
      entry.cityId !== cityId ||
      entry.snapshot !== `cities/${cityId}.json` ||
      entry.availability !== snapshot.availability ||
      entry.generatedAt !== snapshot.generatedAt ||
      entry.liveCount !== snapshot.counts.final
    ) {
      throw new TypeError(`manifest entry for ${cityId} does not match its snapshot`);
    }
  }
}
