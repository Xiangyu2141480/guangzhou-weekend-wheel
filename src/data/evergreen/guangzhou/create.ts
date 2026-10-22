import type {
  ActivityCategory,
  ActivityTimeTag,
  EvergreenActivity,
  IndoorOutdoor,
} from '../../types';

function stableId(legacyId: string): string {
  const collisionSlugs: Readonly<Record<string, string>> = {
    'v2-guangdong-arts-theatre': 'guangdong-arts-theatre-stage-show',
    'v2-xinghai-concert-hall': 'xinghai-concert-hall-weekend-concert',
  };
  const slug = collisionSlugs[legacyId] ?? legacyId.replace(/^v2-/u, '');
  return `place:guangzhou:${slug}`;
}

export function evergreen(
  id: string,
  name: string,
  shortName: string,
  category: ActivityCategory,
  district: string,
  mapKeyword: string,
  transport: string,
  budget: number,
  duration: string,
  indoorOutdoor: IndoorOutdoor,
  tags: string,
  emoji: string,
  reason: string,
  tip?: string,
): EvergreenActivity {
  const timeTags: ActivityTimeTag[] = [];
  if (/1(?:\.5)?[–-]2|1 小时|2 小时/.test(duration)) timeTags.push('short');
  if (/2[–-][34]|3[–-]4|2–4|3 小时|半天/.test(duration)) timeTags.push('half-day');
  if (/4[–-][68]|5 小时|6 小时|一整天/.test(duration)) timeTags.push('full-day');
  if (/夜|晚上|日落/.test(`${name}${tags}`)) timeTags.push('evening');

  return {
    schemaVersion: 2,
    id: stableId(id),
    legacyIds: [id],
    cityId: 'guangzhou',
    name,
    shortName,
    category,
    district,
    venue: mapKeyword,
    budget,
    budgetLabel: budget === 0 ? '免费' : `约 ¥${budget} 以内`,
    priceStatus: budget === 0 ? 'free' : 'known',
    duration,
    timeTags: timeTags.length > 0 ? [...new Set(timeTags)] : ['half-day'],
    indoorOutdoor,
    tags: tags.split(',').map((tag) => tag.trim()),
    emoji,
    reason,
    tip,
    mapKeyword,
    transport,
    live: false,
  };
}

// Keep the legacy core's price labels and time-tag rules. They intentionally
// differ from the later Guangzhou additions and the other cities' place seeds.
export function coreEvergreen(
  legacyId: string,
  name: string,
  shortName: string,
  category: ActivityCategory,
  district: string,
  budget: number,
  budgetLabel: string,
  duration: string,
  indoorOutdoor: IndoorOutdoor,
  tags: string[],
  emoji: string,
  reason: string,
  tip: string | undefined,
  mapKeyword: string,
  transport: string,
): EvergreenActivity {
  const timeTags: ActivityTimeTag[] = [];
  if (/1(?:\.5)?[–-]2|1–2|2 小时/.test(duration)) timeTags.push('short');
  if (/2[–-][34]|3[–-]4|2–4|3 小时/.test(duration)) timeTags.push('half-day');
  if (/4[–-][68]|5 小时|一整天/.test(duration)) timeTags.push('full-day');
  if (tags.some((tag) => /夜|日落|晚/.test(tag))) timeTags.push('evening');

  return {
    schemaVersion: 2,
    id: `place:guangzhou:${legacyId}`,
    legacyIds: [legacyId],
    cityId: 'guangzhou',
    name,
    shortName,
    category,
    district,
    budget,
    budgetLabel,
    duration,
    indoorOutdoor,
    tags,
    emoji,
    reason,
    tip,
    mapKeyword,
    transport,
    venue: mapKeyword,
    priceStatus: budget === 0 ? 'free' : 'known',
    timeTags: timeTags.length > 0 ? [...new Set(timeTags)] : ['half-day'],
    live: false,
  };
}
