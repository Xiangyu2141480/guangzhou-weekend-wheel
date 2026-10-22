import { load } from 'cheerio';
import type { NormalizedLiveActivity, SourceAdapter } from '../types';
import { createOfficialRecord, fetchDetailPages, parseDateRange } from './officialSource';

const LIST_URL = 'https://www.chinasilkmuseum.com/zz/list_17.aspx';
const ALLOWED_HOSTS = ['chinasilkmuseum.com'] as const;

export function parseHangzhouSilkExhibition(
  html: string, fetchedAt: string, sourceUrl: string,
): NormalizedLiveActivity[] {
  const $ = load(html);
  const fields = $('.detail_text p').map((_index, element) => $(element).text().trim()).get();
  const venue = fields.find((text) => /^展览地点[：:]/u.test(text))?.replace(/^展览地点[：:]\s*/u, '') ?? '';
  const dateText = fields.find((text) => /^展览时间[：:]/u.test(text)) ?? '';
  const dates = parseDateRange(dateText);
  // Only known on-site halls establish the Hangzhou district; touring venues are skipped.
  if (!dates || !/蚕桑馆|织造馆|时装馆|修复展示馆|锦绣廊|丝路馆/u.test(venue)) return [];
  return createOfficialRecord({
    cityId: 'hangzhou', sourceId: 'hangzhou-silk-exhibitions', sourceName: '中国丝绸博物馆',
    sourceType: 'official-venue', allowedHosts: ALLOWED_HOSTS,
    name: $('.detail_h').first().text(), venue: `中国丝绸博物馆${venue}`,
    district: '西湖区', sourceUrl, dates,
  }, fetchedAt);
}

export const hangzhouSilkExhibitionsAdapter: SourceAdapter = {
  id: 'hangzhou-silk-exhibitions', cityId: 'hangzhou', name: '中国丝绸博物馆',
  sourceType: 'official-venue', allowedHosts: ALLOWED_HOSTS, allowEmptyResult: false,
  fetch: (fetchedAt) => fetchDetailPages(
    LIST_URL, /^\/zz\/info_17\.aspx\?itemid=\d+$/u, ALLOWED_HOSTS,
    parseHangzhouSilkExhibition, fetchedAt,
  ),
};
