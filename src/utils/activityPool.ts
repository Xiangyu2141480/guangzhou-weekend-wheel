import type {
  Activity,
  ActivityCategory,
  ActivityTimeTag,
  EnvironmentPreference,
  RandomMode,
} from '../data/types';

export type ActivityState =
  | 'date'
  | 'solo'
  | 'friends'
  | 'rest'
  | 'active'
  | 'photo'
  | 'food'
  | 'knowledge'
  | 'night'
  | 'free';

export interface ActivityFilters {
  categories: Set<ActivityCategory>;
  maxBudget: number | null;
  environment: EnvironmentPreference | null;
  districts: Set<string>;
  time: ActivityTimeTag | null;
  states: Set<ActivityState>;
}

export interface SampleOptions {
  mode: RandomMode;
  count: number;
  recentCandidateIds: string[];
  recentSelectedIds: string[];
  random?: () => number;
}

const stateTags: Record<Exclude<ActivityState, 'food' | 'knowledge' | 'night' | 'free'>, string[]> = {
  date: ['约会', '浪漫', '情侣'],
  solo: ['一个人', '独处', '安静', '阅读'],
  friends: ['朋友', '聚会', '组队'],
  rest: ['发呆', '安静', '散步', '阅读', '湖景', '咖啡', '放松'],
  active: ['运动', '登山', '骑行', '跑步', '徒步', '健身'],
  photo: ['拍照', '建筑', '花海', '日落', '摄影'],
};

function matchesState(activity: Activity, state: ActivityState): boolean {
  if (state === 'food') return activity.category === 'food';
  if (state === 'knowledge') {
    return activity.category === 'art' || activity.tags.some((tag) => ['知识', '博物馆', '历史', '科学'].includes(tag));
  }
  if (state === 'night') {
    return activity.category === 'night' || activity.timeTags.includes('evening');
  }
  if (state === 'free') return activity.priceStatus === 'free';
  if (state === 'active' && activity.category === 'sport') return true;
  return activity.tags.some((tag) => stateTags[state].includes(tag));
}

export function filterActivityPool(
  items: Activity[],
  filters: ActivityFilters,
): Activity[] {
  return items.filter((activity) => {
    if (filters.categories.size > 0 && !filters.categories.has(activity.category)) return false;
    if (
      filters.maxBudget !== null &&
      (activity.priceStatus === 'unknown' || activity.budget === null || activity.budget > filters.maxBudget)
    ) return false;
    if (
      filters.environment !== null &&
      activity.indoorOutdoor !== 'mixed' &&
      activity.indoorOutdoor !== filters.environment
    ) return false;
    if (filters.districts.size > 0 && !filters.districts.has(activity.district)) return false;
    if (filters.time !== null && !activity.timeTags.includes(filters.time)) return false;
    if (filters.states.size > 0 && ![...filters.states].some((state) => matchesState(activity, state))) return false;
    return true;
  });
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function uniqueById(items: Activity[]): Activity[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function chooseEligiblePool(items: Activity[], options: SampleOptions): Activity[] {
  const recentCandidates = new Set(options.recentCandidateIds);
  const recentSelections = new Set(options.recentSelectedIds.slice(-3));
  const preferred = items.filter(
    (item) => !recentCandidates.has(item.id) && !recentSelections.has(item.id),
  );
  if (preferred.length >= options.count) return preferred;

  const withoutSelections = items.filter((item) => !recentSelections.has(item.id));
  if (withoutSelections.length >= options.count) return withoutSelections;

  return items;
}

export function sampleCandidates(items: Activity[], options: SampleOptions): Activity[] {
  const random = options.random ?? Math.random;
  const count = Math.max(0, Math.floor(options.count));
  const unique = uniqueById(items);
  const eligible = chooseEligiblePool(unique, { ...options, count });

  if (options.mode === 'fate') return shuffle(eligible, random).slice(0, count);

  const live = eligible.filter((item) => item.live);
  const evergreen = eligible.filter((item) => !item.live);
  const liveTarget = Math.min(4, count, live.length);
  const pickedLive = shuffle(live, random).slice(0, liveTarget);
  const pickedEvergreen = shuffle(evergreen, random).slice(0, count - pickedLive.length);
  const pickedIds = new Set([...pickedLive, ...pickedEvergreen].map((item) => item.id));
  const remainder = shuffle(
    eligible.filter((item) => !pickedIds.has(item.id)),
    random,
  ).slice(0, count - pickedLive.length - pickedEvergreen.length);

  return shuffle([...pickedLive, ...pickedEvergreen, ...remainder], random);
}
