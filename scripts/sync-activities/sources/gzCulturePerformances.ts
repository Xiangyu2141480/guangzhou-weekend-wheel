import { load } from 'cheerio';
import { normalizeActivity, normalizeText } from '../normalize';
import type { NormalizedLiveActivity, RawActivityRecord } from '../types';
import { validateRawActivity } from '../validate';
import { requestText } from './http';

export const CULTURE_PERMIT_URL = 'https://wglj.gz.gov.cn/gkmlpt/content/10/10968/post_10968082.html';

function districtFromVenue(venue: string): string {
  const district = ['天河', '越秀', '海珠', '荔湾', '番禺', '黄埔', '白云', '花都', '南沙', '增城', '从化']
    .find((name) => venue.includes(name));
  return district ? `${district}区` : '广州市';
}

function parseChineseRange(value: string): { eventStart: string; eventEnd: string } | null {
  const match = normalizeText(value).match(
    /(\d{4})年(\d{2})月(\d{2})日至(\d{4})年(\d{2})月(\d{2})日/u,
  );
  if (!match) return null;
  return {
    eventStart: `${match[1]}-${match[2]}-${match[3]}T00:00:00+08:00`,
    eventEnd: `${match[4]}-${match[5]}-${match[6]}T23:59:59+08:00`,
  };
}

export function parseGzCulturePerformances(
  html: string,
  fetchedAt: string,
  sourceUrl = CULTURE_PERMIT_URL,
): NormalizedLiveActivity[] {
  const $ = load(html);
  const activities: NormalizedLiveActivity[] = [];

  $('.article-content table tr').each((_index, element) => {
    const cells = $(element).find('td').map((_cellIndex, cell) => normalizeText($(cell).text())).get();
    if (cells.length < 8 || cells[0] === '序号') return;
    const dates = parseChineseRange(cells[7]);
    if (!dates) return;

    const venue = cells[6];
    const record: RawActivityRecord = {
      name: cells[5],
      category: 'show',
      district: districtFromVenue(venue),
      venue,
      ...dates,
      sourceType: 'official',
      sourceName: '广州市文化广电旅游局',
      sourceUrl,
      priceText: undefined,
      duration: '按官方演出安排',
      timeTags: ['evening'],
      indoorOutdoor: 'mixed',
      tags: ['演出', '现场'],
      emoji: '🎭',
      reason: '广州市文化广电旅游局公开许可的近期营业性演出。',
      mapKeyword: venue,
      transport: '请以演出场馆官方交通指引为准',
      bookingRequired: true,
    };
    if (validateRawActivity(record).length > 0) return;
    activities.push(normalizeActivity(record, fetchedAt, new Date(fetchedAt)));
  });

  return activities;
}

export async function fetchGzCulturePerformances(
  fetchedAt = new Date().toISOString(),
): Promise<NormalizedLiveActivity[]> {
  const html = await requestText(CULTURE_PERMIT_URL);
  return parseGzCulturePerformances(html, fetchedAt);
}
