import { load } from 'cheerio';
import type { NormalizedLiveActivity, SourceAdapter } from '../types';
import { createOfficialRecord, fetchDetailPages, parseDateRange } from './officialSource';

const LIST_URL = 'https://www.cdmuseum.com/linzhan/';
const ALLOWED_HOSTS = ['cdmuseum.com'] as const;

export function parseChengduMuseumExhibition(
  html: string, fetchedAt: string, sourceUrl: string,
): NormalizedLiveActivity[] {
  const $ = load(html);
  const fields = new Map($('.show-content .list').map((_index, element) => {
    const row = $(element);
    return [[row.find('.t1').text().trim(), row.find('.t2').text().trim()]];
  }).get() as [string, string][]);
  const dates = parseDateRange(fields.get('展览时间') ?? '');
  const venue = fields.get('展览地点') ?? '';
  if (!dates || !/^(成都博物馆|[一二三四五六0-9]+[楼层号])/u.test(venue)) return [];
  return createOfficialRecord({
    cityId: 'chengdu', sourceId: 'chengdu-museum-exhibitions', sourceName: '成都博物馆',
    sourceType: 'official-venue', allowedHosts: ALLOWED_HOSTS,
    name: fields.get('展览名称') ?? '',
    venue: venue.startsWith('成都博物馆') ? venue : `成都博物馆${venue}`,
    district: '青羊区', sourceUrl, dates,
  }, fetchedAt);
}

export const chengduMuseumExhibitionsAdapter: SourceAdapter = {
  id: 'chengdu-museum-exhibitions', cityId: 'chengdu', name: '成都博物馆',
  sourceType: 'official-venue', allowedHosts: ALLOWED_HOSTS, allowEmptyResult: false,
  fetch: (fetchedAt) => fetchDetailPages(
    LIST_URL, /^\/linzhan\/\d{6}\/\d+\.html$/u, ALLOWED_HOSTS,
    parseChengduMuseumExhibition, fetchedAt,
  ),
};
