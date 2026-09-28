import { load } from 'cheerio';
import type { NormalizedLiveActivity, SourceAdapter } from '../types';
import {
  createOfficialRecord,
  extractField,
  fetchDetailPages,
  findDistrict,
  parseDateRange,
} from './officialSource';

const LIST_URL = 'https://whlyj.sh.gov.cn/yshd/index.html';
const CITY_ID = 'shanghai';
const SOURCE_ID = 'shanghai-culture-events';
const SOURCE_NAME = '上海市文化和旅游局';
const ALLOWED_HOSTS = ['whlyj.sh.gov.cn'] as const;
const DISTRICTS = {
  徐汇区: '徐汇区',
  黄浦区: '黄浦区',
  浦东新区: '浦东新区',
  上海市群众艺术馆: '徐汇区',
  中华艺术宫: '浦东新区',
  上海博物馆: '黄浦区',
  上海图书馆东馆: '浦东新区',
} as const;

export function parseShanghaiCultureEvent(
  html: string,
  fetchedAt: string,
  sourceUrl: string,
): NormalizedLiveActivity[] {
  const $ = load(html);
  const text = $('body').text();
  const venue = extractField(text, ['展览地点', '展览地址', '活动地点']);
  const dates = parseDateRange(extractField(text, ['展览时间', '活动时间']));
  if (!dates) return [];

  return createOfficialRecord({
    cityId: CITY_ID,
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceType: 'government',
    allowedHosts: ALLOWED_HOSTS,
    name: $('h1').first().text(),
    venue,
    district: findDistrict(CITY_ID, venue, DISTRICTS),
    sourceUrl,
    dates,
    priceText: /免费|免票/u.test(text) ? '免费' : undefined,
  }, fetchedAt);
}

export function fetchShanghaiCultureEvents(
  fetchedAt = new Date().toISOString(),
): Promise<NormalizedLiveActivity[]> {
  return fetchDetailPages(
    LIST_URL,
    /^\/yshd\/\d{8}\/[a-f0-9]+\.html$/u,
    ALLOWED_HOSTS,
    parseShanghaiCultureEvent,
    fetchedAt,
  );
}

export const shanghaiCultureEventsAdapter: SourceAdapter = {
  id: SOURCE_ID,
  cityId: CITY_ID,
  name: SOURCE_NAME,
  sourceType: 'government',
  allowedHosts: ALLOWED_HOSTS,
  allowEmptyResult: false,
  fetch: fetchShanghaiCultureEvents,
};
