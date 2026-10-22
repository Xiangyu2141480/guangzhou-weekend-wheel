import { load } from 'cheerio';
import type { NormalizedLiveActivity, SourceAdapter } from '../types';
import { createOfficialRecord, fetchDetailPages, parseDateRange } from './officialSource';

const LIST_URL = 'https://www.3gmuseum.cn/web/column/col5009287.html';
const ALLOWED_HOSTS = ['3gmuseum.cn'] as const;

export function parseChongqingThreeGorgesExhibition(
  html: string, fetchedAt: string, sourceUrl: string,
): NormalizedLiveActivity[] {
  const $ = load(html);
  const fields = $('.ck-content p').map((_index, element) => $(element).text().trim()).get();
  const field = (label: string) => fields.find((text) => text.startsWith(`${label}：`))
    ?.slice(label.length + 1).trim() ?? '';
  const dates = parseDateRange(field('展览时间'));
  const venue = field('展览地点');
  // Explicit activity fields only: publication dates and narrative references do not date an event.
  if (!dates || !venue.startsWith('重庆中国三峡博物馆')) return [];
  return createOfficialRecord({
    cityId: 'chongqing', sourceId: 'chongqing-three-gorges-exhibitions', sourceName: '重庆中国三峡博物馆',
    sourceType: 'official-venue', allowedHosts: ALLOWED_HOSTS,
    name: field('展览名称') || $('h2').first().text(), venue,
    district: '渝中区', sourceUrl, dates,
  }, fetchedAt);
}

export const chongqingThreeGorgesExhibitionsAdapter: SourceAdapter = {
  id: 'chongqing-three-gorges-exhibitions', cityId: 'chongqing', name: '重庆中国三峡博物馆',
  sourceType: 'official-venue', allowedHosts: ALLOWED_HOSTS, allowEmptyResult: false,
  fetch: (fetchedAt) => fetchDetailPages(
    LIST_URL, /^\/web\/article\/\d+\/web\/content_\d+\.html$/u, ALLOWED_HOSTS,
    parseChongqingThreeGorgesExhibition, fetchedAt,
  ),
};
