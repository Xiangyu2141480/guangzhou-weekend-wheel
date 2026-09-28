import { load } from 'cheerio';
import type { NormalizedLiveActivity, SourceAdapter } from '../types';
import {
  createOfficialRecord,
  extractField,
  fetchDetailPages,
  findDistrict,
  parseDateRange,
} from './officialSource';

const LIST_URL = 'http://wtl.sz.gov.cn/bsfw/mzwhhd/';
const CITY_ID = 'shenzhen';
const SOURCE_ID = 'shenzhen-culture-events';
const SOURCE_NAME = '深圳市文化广电旅游体育局';
const ALLOWED_HOSTS = ['wtl.sz.gov.cn'] as const;
const DISTRICTS = {
  福田区: '福田区',
  罗湖区: '罗湖区',
  南山区: '南山区',
  宝安区: '宝安区',
  龙岗区: '龙岗区',
  龙华区: '龙华区',
  光明区: '光明区',
  金田路馆: '福田区',
  同心路馆: '福田区',
  深圳改革开放展览馆: '福田区',
} as const;

export function parseShenzhenCultureEvent(
  html: string,
  fetchedAt: string,
  sourceUrl: string,
): NormalizedLiveActivity[] {
  const $ = load(html);
  const text = $('body').text();
  const venue = extractField(text, ['活动地点', '地点']);
  const dates = parseDateRange(extractField(text, ['活动时间'])) ??
    parseDateRange(text.match(
      /\d{4}年\d{1,2}月\d{1,2}日[^。]{0,80}(?:持续|展期)[^。]{0,20}至\d{4}年\d{1,2}月\d{1,2}日/u,
    )?.[0] ?? '');
  if (!dates) return [];

  return createOfficialRecord({
    cityId: CITY_ID,
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceType: 'government',
    allowedHosts: ALLOWED_HOSTS,
    name: $('h1, h3, h4').first().text(),
    venue,
    district: findDistrict(CITY_ID, venue, DISTRICTS),
    sourceUrl,
    dates,
    category: /讲座|音乐会/u.test(text) ? 'show' : 'experience',
    priceText: /公益|免费/u.test(text) ? '免费' : undefined,
  }, fetchedAt);
}

export function fetchShenzhenCultureEvents(
  fetchedAt = new Date().toISOString(),
): Promise<NormalizedLiveActivity[]> {
  return fetchDetailPages(
    LIST_URL,
    /^\/bsfw\/mzwhhd\/[^/]+\/content\/post_\d+\.html$/u,
    ALLOWED_HOSTS,
    parseShenzhenCultureEvent,
    fetchedAt,
  );
}

export const shenzhenCultureEventsAdapter: SourceAdapter = {
  id: SOURCE_ID,
  cityId: CITY_ID,
  name: SOURCE_NAME,
  sourceType: 'government',
  allowedHosts: ALLOWED_HOSTS,
  allowEmptyResult: false,
  fetch: fetchShenzhenCultureEvents,
};
