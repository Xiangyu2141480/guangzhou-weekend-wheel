import { isCityId } from '../data/cities';
import type { Activity, FavoriteRecord, FavoriteSnapshot } from '../data/types';

export const FAVORITES_STORAGE_KEY = 'where-to-go:favorites:v2';
export const LEGACY_FAVORITES_STORAGE_KEY = 'gzww:favorites';
const MIGRATION_STORAGE_KEY = 'where-to-go:favorites:legacy-pending:v1';

function getStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isFavoriteSnapshot(value: unknown): value is FavoriteSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Record<string, unknown>;
  return (
    typeof snapshot.name === 'string' &&
    typeof snapshot.shortName === 'string' &&
    typeof snapshot.venue === 'string' &&
    typeof snapshot.district === 'string' &&
    typeof snapshot.budgetLabel === 'string' &&
    typeof snapshot.emoji === 'string' &&
    typeof snapshot.mapKeyword === 'string' &&
    typeof snapshot.live === 'boolean'
  );
}

function isFavoriteRecord(value: unknown): value is FavoriteRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.activityId === 'string' &&
    record.activityId.length > 0 &&
    isCityId(record.cityId) &&
    (record.savedAt === null || typeof record.savedAt === 'string') &&
    (record.snapshot === null || isFavoriteSnapshot(record.snapshot))
  );
}

function deduplicate(records: readonly FavoriteRecord[]): FavoriteRecord[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    if (seen.has(record.activityId)) return false;
    seen.add(record.activityId);
    return true;
  });
}

export function createFavoriteRecord(
  activity: Activity,
  savedAt: string | null = new Date().toISOString(),
): FavoriteRecord {
  return {
    activityId: activity.id,
    cityId: activity.cityId,
    savedAt,
    snapshot: {
      name: activity.name,
      shortName: activity.shortName,
      venue: activity.venue,
      district: activity.district,
      budgetLabel: activity.budgetLabel,
      emoji: activity.emoji,
      mapKeyword: activity.mapKeyword,
      live: activity.live,
    },
  };
}

function loadLegacyFavorites(storage: Storage): FavoriteRecord[] {
  try {
    const raw = storage.getItem(LEGACY_FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const legacyIds = [...new Set(
      parsed.filter((item): item is string => typeof item === 'string' && item.length > 0),
    )];
    return legacyIds.map((legacyId) => ({
      activityId: legacyId,
      cityId: 'guangzhou',
      savedAt: null,
      snapshot: null,
    }));
  } catch {
    return [];
  }
}

export function loadFavorites(): FavoriteRecord[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(FAVORITES_STORAGE_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return deduplicate(parsed.filter(isFavoriteRecord));
      }
    }
  } catch {
    // Missing or malformed V2 data falls through to the legacy migration.
  }

  const migrated = loadLegacyFavorites(storage);
  try {
    if (migrated.length > 0) storage.setItem(MIGRATION_STORAGE_KEY, '[]');
  } catch { /* A denied storage still permits in-memory favorites. */ }
  saveFavorites(migrated);
  return migrated;
}

export function saveFavorites(records: readonly FavoriteRecord[]): boolean {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(deduplicate(records)));
    return true;
  } catch {
    // Storage can be unavailable in privacy mode; in-memory state still works.
    return false;
  }
}

export function hasPendingLegacyFavoritesMigration(): boolean {
  try { return getStorage()?.getItem(MIGRATION_STORAGE_KEY) != null; }
  catch { return false; }
}

export function loadLegacyFavoriteDeletions(): string[] {
  try {
    const value: unknown = JSON.parse(getStorage()?.getItem(MIGRATION_STORAGE_KEY) ?? 'null');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}

export function saveLegacyFavoriteDeletions(deletedIds: ReadonlySet<string>): void {
  if (!hasPendingLegacyFavoritesMigration()) return;
  try { getStorage()?.setItem(MIGRATION_STORAGE_KEY, JSON.stringify([...deletedIds])); }
  catch { /* The in-memory deletion set still protects this mount. */ }
}

export function completeLegacyFavoritesMigration(): void {
  try { getStorage()?.removeItem(MIGRATION_STORAGE_KEY); }
  catch { /* Resolving again later is safe and never reimports the legacy key. */ }
}

/** Only enrich records still present now; never merge an old captured list back. */
export function resolveLegacyFavorites(
  records: readonly FavoriteRecord[],
  activities: readonly Activity[],
  deletedIds: ReadonlySet<string> = new Set(),
): FavoriteRecord[] {
  const identities = new Map<string, Activity>();
  for (const activity of activities) {
    if (activity.cityId !== 'guangzhou' || activity.live) continue;
    identities.set(activity.id, activity);
    activity.legacyIds?.forEach((legacyId) => identities.set(legacyId, activity));
  }
  // A new canonical favorite wins over a migrated alias, including its savedAt.
  const canonicalIds = new Set(records.filter((record) => record.snapshot !== null).map((record) => record.activityId));
  return deduplicate(records.flatMap((record): FavoriteRecord[] => {
    if (deletedIds.has(record.activityId)) return [];
    if (record.cityId !== 'guangzhou' || record.snapshot !== null) return [record];
    const activity = identities.get(record.activityId);
    if (!activity) return [record];
    if (deletedIds.has(activity.id) || canonicalIds.has(activity.id)) return [];
    return [createFavoriteRecord(activity, record.savedAt)];
  }));
}
