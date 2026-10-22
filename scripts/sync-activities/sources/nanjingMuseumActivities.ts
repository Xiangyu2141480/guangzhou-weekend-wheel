import { load } from 'cheerio';
import { normalizeActivity } from '../normalize';
import type { NormalizedLiveActivity, RawActivityRecord, SourceAdapter } from '../types';
import { validateRawActivity } from '../validate';
import { requestText } from './http';

const LIST_URL = 'https://activity.njmuseum.com.cn/reservation/activity/out/activityOutList.do';
const ALLOWED_HOSTS = ['activity.njmuseum.com.cn'] as const;

export function parseNanjingMuseumActivities(
  html: string, fetchedAt: string, sourceUrl: string,
): NormalizedLiveActivity[] {
  const $ = load(html);
  return $('.activity > ul').toArray().flatMap((element) => {
    const row = $(element);
    const field = (label: string) => row.find('.acList span').filter((_index, span) =>
      $(span).text().trim() === `${label}：`).first().next('span').text().trim();
    const start = field('时间').match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/u);
    const venue = field('地点');
    if (!start || !/^(南京博物院|特展|历史馆|艺术馆|民国馆|非遗馆|数字馆)/u.test(venue)) return [];
    const record: RawActivityRecord = {
      name: row.find('.acTitle a').text(), category: 'experience', district: '玄武区',
      venue: venue.includes('南京博物院') ? venue : `南京博物院${venue}`,
      eventStart: `${start[1]}T${start[2]}:00+08:00`,
      sourceId: 'nanjing-museum-activities', sourceType: 'official-venue',
      sourceName: '南京博物院公众活动', sourceUrl,
      duration: '按官方活动安排', indoorOutdoor: 'indoor', timeTags: ['half-day'],
      tags: ['官方活动', '文化'], bookingRequired: true,
      tip: '预约名额、年龄要求和具体安排以博物院官方页面为准。',
    };
    if (validateRawActivity(record, 'nanjing', ALLOWED_HOSTS).length > 0) return [];
    return [normalizeActivity(record, 'nanjing', fetchedAt, new Date(fetchedAt), ALLOWED_HOSTS)];
  });
}

export const nanjingMuseumActivitiesAdapter: SourceAdapter = {
  id: 'nanjing-museum-activities', cityId: 'nanjing', name: '南京博物院公众活动',
  sourceType: 'official-venue', allowedHosts: ALLOWED_HOSTS, allowEmptyResult: false,
  fetch: async (fetchedAt) => parseNanjingMuseumActivities(await requestText(LIST_URL), fetchedAt, LIST_URL),
};
