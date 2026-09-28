import { load } from 'cheerio';
import type { NormalizedLiveActivity, SourceAdapter } from '../types';
import {
  createOfficialRecord,
  extractField,
  parseSeparateDateFields,
} from './officialSource';
import { postForm } from './http';

const LIST_URL = 'https://www.beijing.gov.cn/so/zcdh/cshd';
const API_URL = `${LIST_URL}/page`;
const CITY_ID = 'beijing';
const SOURCE_ID = 'beijing-city-events';
const SOURCE_NAME = '首都之窗城市活动';
const ALLOWED_HOSTS = ['beijing.gov.cn'] as const;

interface BeijingEventRow {
  title?: string;
  qy?: string;
  yjzt?: string;
  kssj?: string;
  jssj?: string;
  hdlx?: string;
  url?: string;
}

export function parseBeijingCityEvent(
  html: string,
  fetchedAt: string,
  sourceUrl: string,
): NormalizedLiveActivity[] {
  const $ = load(html);
  const text = $('body').text();
  const name = $('h1').first().text();
  const district = extractField(text, ['区域']);
  const venue = extractField(text, ['地点']);
  const dates = parseSeparateDateFields(
    extractField(text, ['开始时间']),
    extractField(text, ['结束时间']),
  );
  if (!dates) return [];

  return createOfficialRecord({
    cityId: CITY_ID,
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceType: 'government',
    allowedHosts: ALLOWED_HOSTS,
    name,
    venue,
    district,
    sourceUrl,
    dates,
    category: /体育赛事/u.test(text) ? 'sport' : /文化演出/u.test(text) ? 'show' : 'art',
    priceText: extractField(text, ['博物馆展览票价', '票价']) || undefined,
  }, fetchedAt);
}

export async function fetchBeijingCityEvents(
  fetchedAt = new Date().toISOString(),
): Promise<NormalizedLiveActivity[]> {
  const response = JSON.parse(await postForm(API_URL, {
    page: '1',
    pageSize: '100',
    startDate: '',
    endDate: '',
    region: '',
    type: '',
    place: '',
    text: '',
  })) as { dataList?: BeijingEventRow[] };
  return (response.dataList ?? []).flatMap((row) => {
    const dates = parseSeparateDateFields(row.kssj ?? '', row.jssj ?? '');
    if (!dates) return [];
    let sourceUrl: string;
    try {
      const url = new URL(row.url ?? '', LIST_URL);
      if (url.hostname === 'www.beijing.gov.cn') url.protocol = 'https:';
      sourceUrl = url.href;
    } catch {
      return [];
    }
    return createOfficialRecord({
      cityId: CITY_ID,
      sourceId: SOURCE_ID,
      sourceName: SOURCE_NAME,
      sourceType: 'government',
      allowedHosts: ALLOWED_HOSTS,
      name: row.title ?? '',
      venue: row.yjzt ?? '',
      district: row.qy ?? '',
      sourceUrl,
      dates,
      category: row.hdlx === '体育赛事' ? 'sport' : row.hdlx === '文化演出' ? 'show' : 'art',
    }, fetchedAt);
  });
}

export const beijingCityEventsAdapter: SourceAdapter = {
  id: SOURCE_ID,
  cityId: CITY_ID,
  name: SOURCE_NAME,
  sourceType: 'government',
  allowedHosts: ALLOWED_HOSTS,
  allowEmptyResult: false,
  fetch: fetchBeijingCityEvents,
};
