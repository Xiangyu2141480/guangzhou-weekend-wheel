import { isCityId, type CityId } from './cities';
import { isActivity, validateActivities, type EvergreenActivity } from './types';

export const EVERGREEN_PAYLOAD_VERSION = 1;
// Fixed in this codec version. Numbers in string fields refer to the string table;
// budget numbers stay literal. false = absent optional key, null = own undefined.
const FIELDS = [
  'id', 'legacyIds', 'name', 'shortName', 'category', 'district', 'venue', 'budget',
  'budgetLabel', 'priceStatus', 'duration', 'timeTags', 'indoorOutdoor', 'tags',
  'emoji', 'reason', 'tip', 'mapKeyword', 'transport',
] as const;
const ARRAY_FIELDS = new Set<string>(['legacyIds', 'timeTags', 'tags']);
const OPTIONAL_FIELDS = new Set<string>(['legacyIds', 'tip']);
const ALLOWED_FIELDS = new Set<string>(['schemaVersion', 'cityId', 'live', ...FIELDS]);

export interface EvergreenPayload {
  v: number;
  c: CityId;
  s: string[];
  r: unknown[][];
  h: string;
}

// Detects truncated/accidentally modified payloads; this is not an authenticity signature.
function checksum(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function validateEvergreen(activities: readonly unknown[], cityId: CityId): asserts activities is readonly EvergreenActivity[] {
  if (!isCityId(cityId) || activities.length === 0) throw new TypeError('Empty or unknown evergreen city');
  validateActivities(activities);
  for (const activity of activities) {
    if (!isActivity(activity) || activity.live || activity.cityId !== cityId ||
      !activity.id.startsWith(`place:${cityId}:`) || activity.id.length <= `place:${cityId}:`.length ||
      (activity.tip !== undefined && typeof activity.tip !== 'string') ||
      (activity.budget !== null && (!Number.isFinite(activity.budget) || activity.budget < 0)) ||
      Object.keys(activity).some((field) => !ALLOWED_FIELDS.has(field))) {
      throw new TypeError(`Invalid evergreen activity for ${cityId}`);
    }
  }
}

export function encodeEvergreenPayload(cityId: CityId, activities: readonly EvergreenActivity[]): EvergreenPayload {
  validateEvergreen(activities, cityId);
  const counts = new Map<string, number>();
  for (const activity of activities) {
    for (const field of FIELDS) {
      const value = activity[field];
      for (const item of Array.isArray(value) ? value : [value]) {
        if (typeof item === 'string') counts.set(item, (counts.get(item) ?? 0) + 1);
      }
    }
  }
  const strings = [...counts].filter(([value, count]) => count > 1 && value.length > 3).map(([value]) => value);
  const references = new Map(strings.map((value, index) => [value, index]));
  const encodeString = (value: string) => references.get(value) ?? value;
  const rows = activities.map((activity) => FIELDS.map((field) => {
    if (!Object.hasOwn(activity, field)) return false;
    const value = activity[field];
    if (value === undefined) return null;
    if (Array.isArray(value)) return value.map(encodeString);
    return typeof value === 'string' ? encodeString(value) : value;
  }));
  return { v: EVERGREEN_PAYLOAD_VERSION, c: cityId, s: strings, r: rows, h: checksum([cityId, strings, rows]) };
}

export function decodeEvergreenPayload(value: unknown, cityId: CityId): EvergreenActivity[] {
  if (!value || typeof value !== 'object') throw new TypeError('Invalid evergreen payload');
  const payload = value as Record<string, unknown>;
  if (payload.v !== EVERGREEN_PAYLOAD_VERSION || payload.c !== cityId || !isCityId(cityId) ||
    Object.keys(payload).sort().join(',') !== 'c,h,r,s,v' ||
    !Array.isArray(payload.s) || !payload.s.every((item) => typeof item === 'string') ||
    new Set(payload.s).size !== payload.s.length || !Array.isArray(payload.r) ||
    typeof payload.h !== 'string' || payload.h !== checksum([payload.c, payload.s, payload.r])) {
    throw new TypeError(`Invalid evergreen payload for ${cityId}`);
  }
  const strings = payload.s as string[];
  const decodeString = (cell: unknown): string => {
    if (typeof cell === 'string') return cell;
    if (typeof cell === 'number' && Number.isInteger(cell) && cell >= 0 && cell < strings.length) return strings[cell];
    throw new TypeError('Invalid evergreen string reference');
  };
  const activities: unknown[] = payload.r.map((row: unknown) => {
    if (!Array.isArray(row) || row.length !== FIELDS.length) throw new TypeError('Invalid evergreen row');
    const activity: Record<string, unknown> = { schemaVersion: 2, cityId, live: false };
    FIELDS.forEach((field, index) => {
      const cell: unknown = row[index];
      if (OPTIONAL_FIELDS.has(field) && cell === false) return;
      if (OPTIONAL_FIELDS.has(field) && cell === null) activity[field] = undefined;
      else if (field === 'budget') activity[field] = cell;
      else if (ARRAY_FIELDS.has(field)) {
        if (!Array.isArray(cell)) throw new TypeError('Invalid evergreen array');
        activity[field] = cell.map(decodeString);
      } else activity[field] = decodeString(cell);
    });
    return activity;
  });
  validateEvergreen(activities, cityId);
  return activities as EvergreenActivity[];
}
