import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { CITY_IDS, getCityConfig, isDistrictInCity, type CityId } from '../cities';
import type { ActivityCategory } from '../types';
import { evergreenReferencesByCity } from './references';
import {
  evergreenActivities,
  getAllEvergreenActivities,
  getEvergreenActivities,
} from './index';

describe('evergreen activity pool', () => {
  const categories: readonly ActivityCategory[] = [
    'art',
    'outdoor',
    'food',
    'show',
    'market',
    'experience',
    'sport',
    'night',
  ];

  const expectedCityCounts: Readonly<Record<CityId, number>> = {
    beijing: 48,
    shanghai: 48,
    guangzhou: 205,
    shenzhen: 48,
    suzhou: 48,
    hangzhou: 32,
    nanjing: 32,
    chengdu: 32,
    chongqing: 32,
  };

  it('preserves legacy Guangzhou choices and includes the expanded pool', () => {
    expect(getEvergreenActivities('guangzhou')).toBe(evergreenActivities);
    expect(evergreenActivities).toHaveLength(expectedCityCounts.guangzhou);
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

  it('covers every activity category in Guangzhou', () => {
    const coveredCategories = new Set<ActivityCategory>(
      evergreenActivities.map((activity) => activity.category),
    );

    expect(coveredCategories).toEqual(new Set(categories));
  });

  it('uses globally unique city-prefixed IDs', () => {
    const allActivities = getAllEvergreenActivities();
    const ids = allActivities.map((activity) => activity.id);

    expect(new Set(ids).size).toBe(allActivities.length);
    expect(ids.every((id) => /^place:[a-z]+:[a-z0-9-]+$/u.test(id))).toBe(true);
    for (const cityId of CITY_IDS) {
      expect(getEvergreenActivities(cityId).every(
        (activity) => activity.id.startsWith(`place:${cityId}:`),
      )).toBe(true);
    }
  });

  it.each(CITY_IDS)('%s exposes the reviewed expanded evergreen pool', (cityId) => {
    const cityActivities = getEvergreenActivities(cityId);
    const categoryCounts = new Map<ActivityCategory, number>(
      categories.map((category) => [category, 0]),
    );

    for (const activity of cityActivities) {
      categoryCounts.set(activity.category, (categoryCounts.get(activity.category) ?? 0) + 1);
      expect(activity.cityId).toBe(cityId);
      expect(isDistrictInCity(cityId, activity.district)).toBe(true);
      expect(activity.transport.trim()).not.toBe('');
      expect(activity.mapKeyword.trim()).not.toBe('');
      expect(activity.budget).not.toBeNull();
      expect(activity.budgetLabel.trim()).not.toBe('');
    }

    expect(cityActivities).toHaveLength(expectedCityCounts[cityId]);
    for (const category of categories) {
      expect(categoryCounts.get(category)).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(CITY_IDS)('%s uses reviewed government or official venue references', (cityId) => {
    const references = evergreenReferencesByCity[cityId as CityId];

    expect(references.length).toBeGreaterThanOrEqual(2);
    for (const reference of references) {
      const url = new URL(reference.url);
      const reviewedVenueHosts = new Set(['www.szmuseum.com', 'www.chinasilkmuseum.com', 'www.njmuseum.com', 'www.cdmuseum.com', 'www.3gmuseum.cn', 'activity.njmuseum.com.cn']);
      expect(url.protocol).toBe('https:');
      expect(
        url.hostname.endsWith('.gov.cn') ||
        reviewedVenueHosts.has(url.hostname),
      ).toBe(true);
      expect(reference.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
    }
  });

  it('only enables cities that meet the complete launch gate', () => {
    const enabledCities = CITY_IDS.filter((cityId) => getCityConfig(cityId).enabled);

    expect(enabledCities).toEqual(CITY_IDS);
    for (const cityId of enabledCities) {
      expect(getEvergreenActivities(cityId).length).toBeGreaterThanOrEqual(32);
    }
  });


  it('preserves all original 357 records field-for-field and in order', () => {
    const original = [
      ['beijing', 40, '16ff8e16604d54209ab33848465720773d7f73f1bc93588cab30ee9c4a9ccad6'],
      ['shanghai', 40, '6aebeb7d3409707c46e816636dfeb9800e603ac1d665cbb2da69d02b35f7047b'],
      ['guangzhou', 197, '055b87a8c43d8bffab0dd29463d9b40fdc8429f5784fbf94fca4c0b0395dc3ff'],
      ['shenzhen', 40, '3db55e79488eecf64eb2eb3fcada2feb2c1e4637980b6cf30e0d4de59cdf8dc2'],
      ['suzhou', 40, '12ed4f551ce47770ee9d50638ca7d2f801eab754eec917697f2be2935c6fc731'],
    ] as const;
    for (const [cityId, count, hash] of original) {
      expect(createHash('sha256').update(JSON.stringify(
        getEvergreenActivities(cityId).slice(0, count),
      )).digest('hex')).toBe(hash);
      expect(getEvergreenActivities(cityId)).toHaveLength(count + 8);
    }
  });

  it('adds options in previously missing or less represented districts', () => {
    const expected = {
      beijing: ['顺义区', '昌平区', '房山区', '怀柔区', '平谷区', '密云区', '延庆区'],
      shanghai: ['长宁区', '宝山区', '金山区', '奉贤区'],
      shenzhen: ['光明区'],
      suzhou: ['太仓市'],
      guangzhou: ['从化区', '增城区', '花都区', '南沙区'],
    } as const;
    for (const cityId of Object.keys(expected) as (keyof typeof expected)[]) {
      const districts = new Set(getEvergreenActivities(cityId).map((item) => item.district));
      for (const district of expected[cityId]) expect(districts.has(district)).toBe(true);
    }
  });

  it('maps every Guangzhou legacy ID to exactly one new ID', () => {
    const legacyIds = evergreenActivities.flatMap((activity) => activity.legacyIds ?? []);
    const currentIds = new Set(evergreenActivities.map((activity) => activity.id));

    expect(legacyIds).toHaveLength(189);
    expect(new Set(legacyIds).size).toBe(189);
    expect(
      evergreenActivities.filter((activity) => activity.legacyIds).every(
        (activity) => activity.legacyIds?.length === 1,
      ),
    ).toBe(true);
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
