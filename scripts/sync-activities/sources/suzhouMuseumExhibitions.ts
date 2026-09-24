import { load } from 'cheerio';
import type { NormalizedLiveActivity, SourceAdapter } from '../types';
import {
  createOfficialRecord,
  extractField,
  fetchDetailPages,
  findDistrict,
  parseDateRange,
} from './officialSource';

const LIST_URL =
  'https://www.szmuseum.com/Exhibition/Temporary/TemporaryExhibition?page=1&startYear=2024-12-16';
const CITY_ID = 'suzhou';
const SOURCE_ID = 'suzhou-museum-exhibitions';
const SOURCE_NAME = '苏州博物馆';
const ALLOWED_HOSTS = ['szmuseum.com'] as const;
const DISTRICTS = {
  姑苏区: '姑苏区',
  虎丘区: '虎丘区',
  西馆: '虎丘区',
  本馆: '姑苏区',
  忠王府: '姑苏区',
} as const;

export function parseSuzhouMuseumExhibition(
  html: string,
  fetchedAt: string,
  sourceUrl: string,
): NormalizedLiveActivity[] {
  const $ = load(html);
  const text = $('body').text();
  const venue = extractField(text, ['展览地点']);
  const dates = parseDateRange(extractField(text, ['展览时间']));
  if (!dates) return [];

  return createOfficialRecord({
    cityId: CITY_ID,
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceType: 'official-venue',
    allowedHosts: ALLOWED_HOSTS,
    name: $('h1').first().text(),
    venue,
    district: findDistrict(CITY_ID, venue, DISTRICTS),
    sourceUrl,
    dates,
    category: 'art',
  }, fetchedAt);
}

export function fetchSuzhouMuseumExhibitions(
  fetchedAt = new Date().toISOString(),
): Promise<NormalizedLiveActivity[]> {
  return fetchDetailPages(
    LIST_URL,
    /^\/Exhibition\/TemporaryDetails\/[a-f0-9-]+/u,
    ALLOWED_HOSTS,
    parseSuzhouMuseumExhibition,
    fetchedAt,
  );
}

export const suzhouMuseumExhibitionsAdapter: SourceAdapter = {
  id: SOURCE_ID,
  cityId: CITY_ID,
  name: SOURCE_NAME,
  sourceType: 'official-venue',
  allowedHosts: ALLOWED_HOSTS,
  allowEmptyResult: false,
  fetch: fetchSuzhouMuseumExhibitions,
};
