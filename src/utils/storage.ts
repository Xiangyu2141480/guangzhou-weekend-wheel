import { isCityId } from '../data/cities';
import { getEvergreenActivities } from '../data/evergreen';
import type { Activity, FavoriteRecord, FavoriteSnapshot } from '../data/types';

export const FAVORITES_STORAGE_KEY = 'where-to-go:favorites:v2';
export const LEGACY_FAVORITES_STORAGE_KEY = 'gzww:favorites';

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

    const activitiesByIdentity = new Map<string, Activity>();
    for (const activity of getEvergreenActivities('guangzhou')) {
      activitiesByIdentity.set(activity.id, activity);
      activity.legacyIds?.forEach((legacyId) => activitiesByIdentity.set(legacyId, activity));
    }

    const legacyIds = [...new Set(
      parsed.filter((item): item is string => typeof item === 'string' && item.length > 0),
    )];
    return deduplicate(legacyIds.map((legacyId) => {
      const activity = activitiesByIdentity.get(legacyId);
      return activity
        ? createFavoriteRecord(activity, null)
        : {
            activityId: legacyId,
            cityId: 'guangzhou',
            savedAt: null,
            snapshot: null,
          };
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
  saveFavorites(migrated);
  return migrated;
}

export function saveFavorites(records: readonly FavoriteRecord[]): void {
  try {
    getStorage()?.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(deduplicate(records)));
  } catch {
    // Storage can be unavailable in privacy mode; in-memory state still works.
  }
}
