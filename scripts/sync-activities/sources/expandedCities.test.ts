import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { CITY_IDS, getCityConfig } from '../../../src/data/cities';
import { getEvergreenActivities } from '../../../src/data/evergreen';
import { evergreenReferencesByCity } from '../../../src/data/evergreen/references';
import { SOURCE_ADAPTERS } from './index';
import { requestText } from './http';
import { parseHangzhouSilkExhibition } from './hangzhouSilkExhibitions';
import { parseNanjingMuseumActivities } from './nanjingMuseumActivities';
import { parseChengduMuseumExhibition } from './chengduMuseumExhibitions';
import { parseChongqingThreeGorgesExhibition } from './chongqingThreeGorgesExhibitions';

vi.mock('./http', async (importOriginal) => ({
  ...await importOriginal<typeof import('./http')>(),
  requestText: vi.fn(),
}));

interface Fixture {
  cityId: 'hangzhou' | 'nanjing' | 'chengdu' | 'chongqing';
  id: string;
  listUrl: string;
  url: string;
  html: string;
  listHtml: string;
  eventStart: string;
  eventEnd?: string;
  district: string;
}

const ids = [
  'hangzhou-silk-exhibitions',
  'nanjing-museum-activities',
  'chengdu-museum-exhibitions',
  'chongqing-three-gorges-exhibitions',
];
const fixtures = ids.map((id) => JSON.parse(readFileSync(
  `scripts/sync-activities/__fixtures__/${id}.json`, 'utf8',
)) as Fixture);
const fetchedAt = '2026-10-22T00:00:00.000Z';

function mockPages(fixture: Fixture, html = fixture.html): void {
  vi.mocked(requestText).mockImplementation(async (url) => {
    if (url === fixture.url) return html;
    if (url === fixture.listUrl) return fixture.listHtml;
    throw new Error(`Unexpected source URL: ${url}`);
  });
}

describe.each(fixtures)('$cityId reviewed official source', (fixture) => {
  it('enables the city only with content, official references and a working real-shape fixture', async () => {
    const adapter = SOURCE_ADAPTERS.find((source) => source.id === fixture.id);
    expect(adapter).toBeDefined();
    if (!adapter) return;
    expect(CITY_IDS).toContain(fixture.cityId);
    expect(getEvergreenActivities(fixture.cityId).length).toBeGreaterThanOrEqual(32);
    expect(evergreenReferencesByCity[fixture.cityId].length).toBeGreaterThanOrEqual(2);
    expect(getCityConfig(fixture.cityId).enabled).toBe(true);
    expect(adapter.allowEmptyResult).toBe(false);
    mockPages(fixture);

    const records = await adapter.fetch(fetchedAt);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      cityId: fixture.cityId,
      eventStart: fixture.eventStart,
      eventEnd: fixture.eventEnd,
      district: fixture.district,
      sourceUrl: fixture.url,
      priceStatus: 'unknown',
      budget: null,
    });
    // The Nanjing page supplies a start time only. Do not manufacture an end time.
    if (!fixture.eventEnd) expect(records[0].eventEnd).toBeUndefined();
  });

  it.each(['missing activity date', 'publication date only', 'unrecognized structure'])(
    'does not invent dates for %s', async (scenario) => {
      const adapter = SOURCE_ADAPTERS.find((source) => source.id === fixture.id);
      expect(adapter).toBeDefined();
      if (!adapter) return;
      let html = fixture.html.replace(/\d{4}[年-]\d{1,2}[月-]\d{1,2}日?(?:\s+\d{2}:\d{2})?/gu, '');
      if (scenario === 'publication date only') {
        html += '<div class="publish-date">发布时间：2026-10-22</div>';
      }
      if (scenario === 'unrecognized structure') html = '<h1>栏目改版</h1>';
      mockPages(fixture, html);
      expect(await adapter.fetch(fetchedAt)).toEqual([]);
    },
  );
});

it('rejects a Nanjing off-site venue rather than assigning the museum district', async () => {
  const fixture = fixtures.find((item) => item.cityId === 'nanjing')!;
  const adapter = SOURCE_ADAPTERS.find((source) => source.id === fixture.id)!;
  mockPages(fixture, fixture.html.replace('南京博物院小剧场', '南京市江宁区外地活动场馆'));
  expect(await adapter.fetch(fetchedAt)).toEqual([]);
});

const parsers = {
  hangzhou: parseHangzhouSilkExhibition,
  nanjing: parseNanjingMuseumActivities,
  chengdu: parseChengduMuseumExhibition,
  chongqing: parseChongqingThreeGorgesExhibition,
};

describe.each(fixtures)('$cityId source boundaries', (fixture) => {
  it('rejects a deceptive source host even when the activity HTML is valid', () => {
    const url = new URL(fixture.url);
    url.hostname += '.attacker.example';
    expect(parsers[fixture.cityId](fixture.html, fetchedAt, url.href)).toEqual([]);
  });

  it('rejects impossible activity dates', () => {
    const html = fixture.html.replace(/(\d{4})年\d{1,2}月\d{1,2}日|\d{4}-\d{2}-\d{2}/gu,
      fixture.cityId === 'nanjing' ? '2026-02-30' : '2026年2月30日');
    expect(parsers[fixture.cityId](html, fetchedAt, fixture.url)).toEqual([]);
  });
});
