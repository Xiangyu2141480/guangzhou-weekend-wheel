import { isCityId, isDistrictInCity, type CityId } from './cities';

export type { CityId } from './cities';

export type ActivityCategory =
  | 'art'
  | 'outdoor'
  | 'food'
  | 'show'
  | 'market'
  | 'experience'
  | 'sport'
  | 'night';

export type EnvironmentPreference = 'indoor' | 'outdoor';
export type IndoorOutdoor = EnvironmentPreference | 'mixed';
export type PriceStatus = 'known' | 'free' | 'unknown';
export type ActivityTimeTag = 'short' | 'half-day' | 'full-day' | 'evening';
export type RandomMode = 'fresh' | 'fate';

export interface ActivityCore {
  schemaVersion: 2;
  id: string;
  legacyIds?: string[];
  cityId: CityId;
  name: string;
  shortName: string;
  category: ActivityCategory;
  district: string;
  venue: string;
  budget: number | null;
  budgetLabel: string;
  priceStatus: PriceStatus;
  duration: string;
  timeTags: ActivityTimeTag[];
  indoorOutdoor: IndoorOutdoor;
  tags: string[];
  emoji: string;
  reason: string;
  tip?: string;
  mapKeyword: string;
  transport: string;
}

export interface EvergreenActivity extends ActivityCore {
  live: false;
}

export interface LiveActivity extends ActivityCore {
  live: true;
  sourceId: string;
  sourceType: 'government' | 'official-venue';
  sourceName: string;
  sourceUrl: string;
  sourceUpdatedAt?: string;
  eventStart: string;
  eventEnd?: string;
  fetchedAt: string;
  lastVerifiedAt: string;
  status: 'upcoming' | 'ongoing';
  priceMin?: number;
  priceMax?: number;
  bookingRequired?: boolean;
}

export type Activity = EvergreenActivity | LiveActivity;

const categories = new Set<ActivityCategory>([
  'art',
  'outdoor',
  'food',
  'show',
  'market',
  'experience',
  'sport',
  'night',
]);

const environments = new Set<IndoorOutdoor>(['indoor', 'outdoor', 'mixed']);
const priceStatuses = new Set<PriceStatus>(['known', 'free', 'unknown']);
const timeTags = new Set<ActivityTimeTag>(['short', 'half-day', 'full-day', 'evening']);

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);
}

export function isActivity(value: unknown): value is Activity {
  if (!value || typeof value !== 'object') return false;

  const item = value as Record<string, unknown>;
  const hasCoreShape =
    item.schemaVersion === 2 &&
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    (item.legacyIds === undefined ||
      (isStringArray(item.legacyIds) && new Set(item.legacyIds).size === item.legacyIds.length)) &&
    isCityId(item.cityId) &&
    typeof item.name === 'string' &&
    typeof item.shortName === 'string' &&
    categories.has(item.category as ActivityCategory) &&
    isDistrictInCity(item.cityId as CityId, item.district) &&
    typeof item.venue === 'string' &&
    (typeof item.budget === 'number' || item.budget === null) &&
    typeof item.budgetLabel === 'string' &&
    priceStatuses.has(item.priceStatus as PriceStatus) &&
    typeof item.duration === 'string' &&
    Array.isArray(item.timeTags) &&
    item.timeTags.length > 0 &&
    item.timeTags.every((tag) => timeTags.has(tag as ActivityTimeTag)) &&
    environments.has(item.indoorOutdoor as IndoorOutdoor) &&
    isStringArray(item.tags) &&
    typeof item.emoji === 'string' &&
    typeof item.reason === 'string' &&
    typeof item.mapKeyword === 'string' &&
    typeof item.transport === 'string';

  if (!hasCoreShape) return false;
  if (item.live === false) return true;

  return (
    item.live === true &&
    typeof item.sourceId === 'string' &&
    item.sourceId.length > 0 &&
    (item.sourceType === 'government' || item.sourceType === 'official-venue') &&
    typeof item.sourceName === 'string' &&
    typeof item.sourceUrl === 'string' &&
    typeof item.eventStart === 'string' &&
    typeof item.fetchedAt === 'string' &&
    typeof item.lastVerifiedAt === 'string' &&
    (item.status === 'upcoming' || item.status === 'ongoing')
  );
}

export function validateActivities(values: readonly unknown[]): asserts values is readonly Activity[] {
  const identityOwners = new Map<string, string>();

  for (const value of values) {
    if (!isActivity(value)) {
      throw new TypeError('Activity collection contains an invalid record');
    }

    for (const identity of [value.id, ...(value.legacyIds ?? [])]) {
      const owner = identityOwners.get(identity);
      if (owner) {
        throw new TypeError(`Activity identity "${identity}" conflicts with "${owner}"`);
      }
      identityOwners.set(identity, value.id);
    }
  }
}
