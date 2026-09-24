import { describe, expect, it } from 'vitest';
import { isDistrictInCity } from '../cities';
import type { ActivityCategory } from '../types';
import {
  evergreenActivities,
  getAllEvergreenActivities,
  getEvergreenActivities,
} from './index';

describe('evergreen activity pool', () => {
  it('preserves all 189 Guangzhou choices in the city module', () => {
    expect(getEvergreenActivities('guangzhou')).toBe(evergreenActivities);
    expect(evergreenActivities).toHaveLength(189);
    expect(
      evergreenActivities.every(
        (item) =>
          item.transport.length > 0 &&
          item.mapKeyword.length > 0 &&
          item.timeTags.length > 0 &&
          item.schemaVersion === 2 &&
          item.cityId === 'guangzhou' &&
          isDistrictInCity(item.cityId, item.district),
      ),
    ).toBe(true);
  });

  it('covers every activity category', () => {
    const categories = new Set<ActivityCategory>(
      evergreenActivities.map((activity) => activity.category),
    );

    expect(categories).toEqual(new Set([
      'art',
      'outdoor',
      'food',
      'show',
      'market',
      'experience',
      'sport',
      'night',
    ]));
  });

  it('uses globally unique city-prefixed IDs', () => {
    const allActivities = getAllEvergreenActivities();
    const ids = allActivities.map((activity) => activity.id);

    expect(new Set(ids).size).toBe(allActivities.length);
    expect(ids.every((id) => /^place:[a-z]+:[a-z0-9-]+$/u.test(id))).toBe(true);
    expect(getEvergreenActivities('beijing')).toEqual([]);
  });

  it('maps every Guangzhou legacy ID to exactly one new ID', () => {
    const legacyIds = evergreenActivities.flatMap((activity) => activity.legacyIds ?? []);
    const currentIds = new Set(evergreenActivities.map((activity) => activity.id));

    expect(legacyIds).toHaveLength(189);
    expect(new Set(legacyIds).size).toBe(189);
    expect(evergreenActivities.every((activity) => activity.legacyIds?.length === 1)).toBe(true);
    expect(legacyIds.every((legacyId) => !currentIds.has(legacyId))).toBe(true);
  });

  it('covers all eleven Guangzhou districts', () => {
    const districts = new Set(
      evergreenActivities.map((activity) => activity.district),
    );

    expect(districts).toEqual(
      new Set([
        '越秀区',
        '荔湾区',
        '海珠区',
        '天河区',
        '白云区',
        '黄埔区',
        '番禺区',
        '南沙区',
        '花都区',
        '增城区',
        '从化区',
      ]),
    );
  });
});
