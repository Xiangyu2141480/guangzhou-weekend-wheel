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

  it.each(CITY_IDS)('%s reaches the evergreen launch threshold', (cityId) => {
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

    expect(cityActivities.length).toBeGreaterThanOrEqual(30);
    for (const category of categories) {
      expect(categoryCounts.get(category)).toBeGreaterThanOrEqual(2);
    }
  });

  it.each(CITY_IDS)('%s uses reviewed government or official venue references', (cityId) => {
    const references = evergreenReferencesByCity[cityId as CityId];

    expect(references.length).toBeGreaterThanOrEqual(2);
    for (const reference of references) {
      const url = new URL(reference.url);
      const reviewedVenueHosts = new Set(['www.szmuseum.com']);
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
      expect(getEvergreenActivities(cityId).length).toBeGreaterThanOrEqual(30);
    }
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
