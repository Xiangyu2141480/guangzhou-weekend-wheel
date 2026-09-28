import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseBeijingCityEvent } from './beijingCityEvents';
import { parseShanghaiCultureEvent } from './shanghaiCultureEvents';
import { parseShenzhenCultureEvent } from './shenzhenCultureEvents';
import { parseSuzhouMuseumExhibition } from './suzhouMuseumExhibitions';

interface FixtureCase {
  url: string;
  html: string;
}

interface SourceFixture {
  normal: FixtureCase;
  missingDate: FixtureCase;
  invalidUrl: FixtureCase;
  empty: FixtureCase;
}

const fetchedAt = '2026-09-24T00:00:00.000Z';

function fixture(name: string): SourceFixture {
  return JSON.parse(readFileSync(
    `scripts/sync-activities/__fixtures__/${name}.json`,
    'utf8',
  )) as SourceFixture;
}

const cases = [
  {
    fixture: fixture('beijing-city-events'),
    parse: parseBeijingCityEvent,
    expected: {
      cityId: 'beijing',
      eventStart: '2026-09-24T00:00:00+08:00',
      eventEnd: '2026-12-27T23:59:59+08:00',
      district: '通州区',
    },
  },
  {
    fixture: fixture('shanghai-culture-events'),
    parse: parseShanghaiCultureEvent,
    expected: {
      cityId: 'shanghai',
      eventStart: '2025-11-13T00:00:00+08:00',
      eventEnd: '2025-11-18T23:59:59+08:00',
      district: '徐汇区',
    },
  },
  {
    fixture: fixture('shenzhen-culture-events'),
    parse: parseShenzhenCultureEvent,
    expected: {
      cityId: 'shenzhen',
      eventStart: '2026-09-25T14:30:00+08:00',
      eventEnd: '2026-09-25T16:00:00+08:00',
      district: '福田区',
    },
  },
  {
    fixture: fixture('suzhou-museum-exhibitions'),
    parse: parseSuzhouMuseumExhibition,
    expected: {
      cityId: 'suzhou',
      eventStart: '2026-09-25T00:00:00+08:00',
      eventEnd: '2026-10-24T23:59:59+08:00',
      district: '姑苏区',
    },
  },
] as const;

describe.each(cases)('$expected.cityId official source fixture', ({ fixture: data, parse, expected }) => {
  it('parses event dates from explicit activity fields', () => {
    const records = parse(data.normal.html, fetchedAt, data.normal.url);

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject(expected);
    expect(records[0].sourceUrl).toBe(data.normal.url);
  });

  it.each(['missingDate', 'invalidUrl', 'empty'] as const)(
    'drops unstable %s records',
    (caseName) => {
      const input = data[caseName];
      expect(parse(input.html, fetchedAt, input.url)).toEqual([]);
    },
  );
});
