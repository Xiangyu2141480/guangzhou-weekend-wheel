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

const EXPANDED_OPTION_COPY: Readonly<Record<
  ActivityCategory,
  Readonly<{ reason: string; tip: string }>
>> = {
  art: { reason: '适合留出完整时段，安静看一次展览。', tip: '开放和预约安排以场馆官方公告为准。' },
  outdoor: { reason: '把周末留给自然景观和一段舒展的步行。', tip: '只走开放路线，并根据天气调整行程。' },
  food: { reason: '适合少量多尝，顺路感受街区日常。', tip: '选择证照齐全、明码标价的门店。' },
  show: { reason: '用一场现场演出完成周末节奏切换。', tip: '场次、票价和入场规则以官方信息为准。' },
  market: { reason: '不设购物清单，慢慢逛更容易有新发现。', tip: '各商户独立营业，出发前确认开放时间。' },
  experience: { reason: '通过实物和互动展项认识一门新知识。', tip: '体验项目和预约要求以场馆公告为准。' },
  sport: { reason: '路线可灵活调整，适合完成一次轻运动。', tip: '量力而行，雨天留意湿滑路段。' },
  night: { reason: '灯光亮起后，换个角度感受城市空间。', tip: '留意开放时间和末班公共交通。' },
};

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

export function expandedEvergreenPlace(
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
  transport: string,
): EvergreenPlace {
  const copy = EXPANDED_OPTION_COPY[category];
  return evergreenPlace(
    slug,
    name,
    shortName,
    category,
    district,
    venue,
    budget,
    duration,
    indoorOutdoor,
    tags,
    emoji,
    copy.reason,
    copy.tip,
    venue,
    transport,
  );
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
