import type {
  ActivityCategory,
  ActivityTimeTag,
  EvergreenActivity,
  IndoorOutdoor,
} from '../types';
import { toGuangzhouActivityV2 } from '../guangzhouCompatibility';

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

  return toGuangzhouActivityV2({
    id,
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
  });
}
