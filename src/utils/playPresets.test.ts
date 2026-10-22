import { expect, test } from 'vitest';
import type { Activity } from '../data/types';
import { filterActivityPool } from './activityPool';
import { getPlayPresetFilters, type PlayPresetId } from './playPresets';

const base: Activity = {
  schemaVersion: 2, id: 'base', cityId: 'guangzhou', name: '去看看', shortName: '看看',
  category: 'art', district: '天河区', venue: '展馆', budget: 60, budgetLabel: '60元',
  priceStatus: 'known', duration: '1小时', timeTags: ['short'], indoorOutdoor: 'outdoor',
  tags: ['安静'], emoji: '🎨', reason: '看看新鲜事物', mapKeyword: '展馆', transport: '步行', live: false,
};
const pool: Activity[] = [
  { ...base, id: 'cheap', budget: 20 },
  { ...base, id: 'indoor', indoorOutdoor: 'indoor' },
  { ...base, id: 'friends', tags: ['朋友'] },
  { ...base, id: 'photo', tags: ['拍照'] },
  { ...base, id: 'evening', timeTags: ['evening'] },
  { ...base, id: 'unknown', budget: null, priceStatus: 'unknown' },
];

test.each<[PlayPresetId, string[]]>([
  ['wander', ['cheap', 'indoor', 'friends', 'photo', 'evening', 'unknown']],
  ['budget', ['cheap']], ['rain', ['indoor']], ['friends', ['friends']],
  ['photo', ['photo']], ['night', ['evening']],
])('%s uses existing filter rules with no hidden exclusions', (id, expected) => {
  expect(filterActivityPool(pool, getPlayPresetFilters(id)).map((item) => item.id)).toEqual(expected);
});

test('returns a complete fresh filter value so previous categories and districts cannot leak into a preset', () => {
  const first = getPlayPresetFilters('wander');
  first.categories.add('food');
  first.districts.add('天河区');
  first.states.add('free');
  expect(getPlayPresetFilters('wander')).toEqual({
    categories: new Set(), maxBudget: null, environment: null,
    districts: new Set(), time: null, states: new Set(),
  });
});
