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
  id: string;
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
  sourceType: 'official' | 'venue';
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

export function isActivity(value: unknown): value is Activity {
  if (!value || typeof value !== 'object') return false;

  const item = value as Record<string, unknown>;
  const hasCoreShape =
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.shortName === 'string' &&
    categories.has(item.category as ActivityCategory) &&
    typeof item.district === 'string' &&
    typeof item.venue === 'string' &&
    (typeof item.budget === 'number' || item.budget === null) &&
    typeof item.budgetLabel === 'string' &&
    priceStatuses.has(item.priceStatus as PriceStatus) &&
    typeof item.duration === 'string' &&
    Array.isArray(item.timeTags) &&
    environments.has(item.indoorOutdoor as IndoorOutdoor) &&
    Array.isArray(item.tags) &&
    typeof item.emoji === 'string' &&
    typeof item.reason === 'string' &&
    typeof item.mapKeyword === 'string' &&
    typeof item.transport === 'string';

  if (!hasCoreShape) return false;
  if (item.live === false) return true;

  return (
    item.live === true &&
    (item.sourceType === 'official' || item.sourceType === 'venue') &&
    typeof item.sourceName === 'string' &&
    typeof item.sourceUrl === 'string' &&
    typeof item.eventStart === 'string' &&
    typeof item.fetchedAt === 'string' &&
    typeof item.lastVerifiedAt === 'string' &&
    (item.status === 'upcoming' || item.status === 'ongoing')
  );
}
