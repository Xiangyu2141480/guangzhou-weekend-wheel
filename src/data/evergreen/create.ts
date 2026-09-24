import type { CityId } from '../cities';
import type {
  ActivityCategory,
  ActivityTimeTag,
  EvergreenActivity,
  IndoorOutdoor,
} from '../types';

export interface EvergreenPlace {
  slug: string;
  name: string;
  shortName: string;
  category: ActivityCategory;
  district: string;
  venue: string;
  budget: number;
  duration: string;
  indoorOutdoor: IndoorOutdoor;
  tags: string[];
  emoji: string;
  reason: string;
  tip: string;
  mapKeyword: string;
  transport: string;
}

export function evergreenPlace(
  slug: string,
  name: string,
  shortName: string,
  category: ActivityCategory,
  district: string,
  venue: string,
  budget: number,
  duration: string,
  indoorOutdoor: IndoorOutdoor,
  tags: string,
  emoji: string,
  reason: string,
  tip: string,
  mapKeyword: string,
  transport: string,
): EvergreenPlace {
  return {
    slug,
    name,
    shortName,
    category,
    district,
    venue,
    budget,
    duration,
    indoorOutdoor,
    tags: tags.split(','),
    emoji,
    reason,
    tip,
    mapKeyword,
    transport,
  };
}

function getTimeTags(place: EvergreenPlace): ActivityTimeTag[] {
  const tags: ActivityTimeTag[] = [];
  if (/1[–-]2|1 小时|2 小时/u.test(place.duration)) tags.push('short');
  if (/2[–-][34]|3[–-]4|2–4|3 小时|半天/u.test(place.duration)) tags.push('half-day');
  if (/4[–-][68]|5 小时|6 小时|一整天/u.test(place.duration)) tags.push('full-day');
  if (/夜|晚上|日落/u.test(`${place.name}${place.tags.join('')}`)) tags.push('evening');
  return tags.length > 0 ? [...new Set(tags)] : ['half-day'];
}

export function createEvergreenActivities(
  cityId: CityId,
  places: readonly EvergreenPlace[],
): readonly EvergreenActivity[] {
  return places.map((place) => ({
    schemaVersion: 2,
    id: `place:${cityId}:${place.slug}`,
    cityId,
    name: place.name,
    shortName: place.shortName,
    category: place.category,
    district: place.district,
    venue: place.venue,
    budget: place.budget,
    budgetLabel: place.budget === 0 ? '免费' : `约 ¥${place.budget} 以内`,
    priceStatus: place.budget === 0 ? 'free' : 'known',
    duration: place.duration,
    timeTags: getTimeTags(place),
    indoorOutdoor: place.indoorOutdoor,
    tags: place.tags,
    emoji: place.emoji,
    reason: place.reason,
    tip: place.tip,
    mapKeyword: place.mapKeyword,
    transport: place.transport,
    live: false,
  }));
}
