import { load } from 'cheerio';
import { getChinaDateKey } from '../../../src/utils/date';
import { normalizeActivity, normalizeText } from '../normalize';
import type { NormalizedLiveActivity, RawActivityRecord } from '../types';
import { validateRawActivity } from '../validate';
import { postForm } from './http';

const LIST_URL = 'https://www.gzlib.org.cn/activity/actForecast_list.jspx';
const DEFAULT_VENUE = '广州图书馆';

function parseRange(value: string): { eventStart: string; eventEnd: string } | null {
  const match = normalizeText(value).match(
    /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*[-~至]\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/u,
  );
  if (!match) return null;
  return {
    eventStart: `${match[1]}T${match[2]}:00+08:00`,
    eventEnd: `${match[3]}T${match[4]}:00+08:00`,
  };
}

export function parseGzLibrary(html: string, fetchedAt: string): NormalizedLiveActivity[] {
  const $ = load(html);
  const activities: NormalizedLiveActivity[] = [];

  $('#actForecast li, .yg2-list > li').each((_index, element) => {
    const row = $(element);
    const titleLink = row.find('a._pv-title').first();
    const dates = parseRange(row.find('.yg2-intro').first().text());
    const venueAttribute = row.attr('data-venue');
    const venue = venueAttribute === undefined ? DEFAULT_VENUE : venueAttribute;
    if (!dates) return;

    const record: RawActivityRecord = {
      name: normalizeText(titleLink.text()).replace(/^活动预告\s*[|丨]?\s*/u, ''),
      category: 'art',
      district: '天河区',
      venue,
      ...dates,
      sourceId: 'gz-library',
      sourceType: 'official-venue',
      sourceName: '广州图书馆',
      sourceUrl: new URL(titleLink.attr('href') ?? '', LIST_URL).href,
      priceText: row.find('.yg2-price').first().text() || undefined,
      duration: '1-2 小时',
      timeTags: ['short'],
      indoorOutdoor: 'indoor',
      tags: ['阅读', '知识', '讲座'],
      emoji: '📚',
      reason: '广州图书馆近期发布的公共文化活动。',
      mapKeyword: DEFAULT_VENUE,
      transport: '地铁3号线或5号线珠江新城站，步行前往广州图书馆',
      bookingRequired: true,
    };
    if (validateRawActivity(record).length > 0) return;
    activities.push(normalizeActivity(record, fetchedAt, new Date(fetchedAt)));
  });

  return activities;
}

export async function fetchGzLibrary(fetchedAt = new Date().toISOString()): Promise<NormalizedLiveActivity[]> {
  const start = new Date(fetchedAt);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 120);
  const html = await postForm(LIST_URL, {
    state: '',
    queryType: '',
    queryInput: '',
    queryActType: '',
    queryDepartment: '',
    queryActPp: '',
    querySvcArea: '',
    actionSite: '',
    queryActStartTime: getChinaDateKey(start),
    queryActEndTime: getChinaDateKey(end),
    channelId: '476',
    categoryId: '',
    pageNo: '1',
    pageSize: '100',
  });
  return parseGzLibrary(html, fetchedAt);
}
