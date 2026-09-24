import { describe, expect, it } from 'vitest';
import {
  CITY_CONFIGS,
  CITY_IDS,
  getCityConfig,
  isCityId,
  isDistrictInCity,
  validateCityConfigs,
  type CityConfig,
} from './cities';

describe('city registry', () => {
  it('registers the five launch cities with unique stable identifiers', () => {
    expect(CITY_IDS).toEqual([
      'beijing',
      'shanghai',
      'guangzhou',
      'shenzhen',
      'suzhou',
    ]);
    expect(new Set(CITY_CONFIGS.map((city) => city.id)).size).toBe(5);
    expect(new Set(CITY_CONFIGS.map((city) => city.name)).size).toBe(5);
    expect(new Set(CITY_CONFIGS.map((city) => city.adcode)).size).toBe(5);
    expect(CITY_CONFIGS.every((city) => city.timezone === 'Asia/Shanghai')).toBe(true);
    expect(CITY_CONFIGS.filter((city) => city.enabled).map((city) => city.id))
      .toEqual(CITY_IDS);
  });

  it('looks up city IDs and validates districts against their city', () => {
    expect(isCityId('shenzhen')).toBe(true);
    expect(isCityId('hangzhou')).toBe(false);
    expect(getCityConfig('guangzhou').adcode).toBe('440100');
    expect(isDistrictInCity('guangzhou', '天河区')).toBe(true);
    expect(isDistrictInCity('shanghai', '天河区')).toBe(false);
  });

  it('rejects duplicate city metadata and duplicate districts', () => {
    const duplicateAdcode: CityConfig[] = [
      { ...CITY_CONFIGS[0] },
      { ...CITY_CONFIGS[1], adcode: CITY_CONFIGS[0].adcode },
    ];
    const duplicateDistrict = [{
      ...CITY_CONFIGS[0],
      districts: ['东城区', '东城区'],
    }] satisfies CityConfig[];

    expect(() => validateCityConfigs(duplicateAdcode)).toThrow(/adcode.*unique/u);
    expect(() => validateCityConfigs(duplicateDistrict)).toThrow(/district.*unique/u);
  });
});
