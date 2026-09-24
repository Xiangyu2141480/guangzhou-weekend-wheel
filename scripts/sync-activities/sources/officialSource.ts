import { load } from 'cheerio';
import type { CityId } from '../../../src/data/cities';
import { isDistrictInCity } from '../../../src/data/cities';
import { normalizeActivity, normalizeText } from '../normalize';
import type { NormalizedLiveActivity, RawActivityRecord } from '../types';
import { validateRawActivity } from '../validate';
import { requestText } from './http';

const FIELD_NAMES =
  '区域|开始时间|结束时间|地点|活动类型|展览时间|展览地点|展览地址|活动时间|活动地点|活动详情|详细介绍|展览介绍|来源';

export function extractField(text: string, labels: readonly string[]): string {
  const normalized = normalizeText(text);
  for (const label of labels) {
    const match = normalized.match(
      new RegExp(`${label}\\s*[:：]\\s*(.+?)(?=(?:${FIELD_NAMES})\\s*[:：]|$)`, 'u'),
    );
    if (match) return normalizeText(match[1]);
  }
  return '';
}

function zonedDate(
  year: string,
  month: string,
  day: string,
  time: string,
  endOfDay = false,
): string {
  const normalizedTime = time || (endOfDay ? '23:59:59' : '00:00:00');
  const withSeconds = /^\d{1,2}:\d{2}$/u.test(normalizedTime)
    ? `${normalizedTime}:00`
    : normalizedTime;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${withSeconds}+08:00`;
}

export function parseSeparateDateFields(
  startValue: string,
  endValue: string,
): { eventStart: string; eventEnd: string } | null {
  const datePattern = /(\d{4})[-年./](\d{1,2})[-月./](\d{1,2})日?/u;
  const start = startValue.match(datePattern);
  const end = endValue.match(datePattern);
  if (!start || !end) return null;
  return {
    eventStart: zonedDate(start[1], start[2], start[3], ''),
    eventEnd: zonedDate(end[1], end[2], end[3], '', true),
  };
}

export function parseDateRange(
  value: string,
): { eventStart: string; eventEnd: string } | null {
  const normalized = normalizeText(value)
    .replace(/[（(](?:星期|周)[一二三四五六日天][）)]/gu, '')
    .replace(/[：]/gu, ':');
  const first = normalized.match(/(\d{4})[-年./](\d{1,2})[-月./](\d{1,2})日?/u);
  if (!first) return null;
  const afterFirst = normalized.slice((first.index ?? 0) + first[0].length);
  const second = afterFirst.match(
    /(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日?|(\d{4})[-./](\d{1,2})[-./](\d{1,2})/u,
  );

  if (second) {
    const explicitYear = second[1] ?? second[4];
    const month = second[2] ?? second[5];
    const day = second[3] ?? second[6];
    return {
      eventStart: zonedDate(first[1], first[2], first[3], ''),
      eventEnd: zonedDate(explicitYear ?? first[1], month, day, '', true),
    };
  }

  const times = afterFirst.match(/(\d{1,2}:\d{2})\s*[—–~至-]\s*(\d{1,2}:\d{2})/u);
  if (!times) return null;
  return {
    eventStart: zonedDate(first[1], first[2], first[3], times[1]),
    eventEnd: zonedDate(first[1], first[2], first[3], times[2]),
  };
}

export function findDistrict(
  cityId: CityId,
  text: string,
  fallbacks: Readonly<Record<string, string>> = {},
): string {
  const normalized = normalizeText(text);
  for (const district of Object.values(fallbacks)) {
    if (normalized.includes(district) && isDistrictInCity(cityId, district)) return district;
  }
  for (const [needle, district] of Object.entries(fallbacks)) {
    if (normalized.includes(needle) && isDistrictInCity(cityId, district)) return district;
  }
  return '';
}

export interface OfficialRecordOptions {
  cityId: CityId;
  sourceId: string;
  sourceName: string;
  sourceType: 'government' | 'official-venue';
  allowedHosts: readonly string[];
  name: string;
  venue: string;
  district: string;
  sourceUrl: string;
  dates: { eventStart: string; eventEnd: string };
  category?: RawActivityRecord['category'];
  priceText?: string;
}

export function createOfficialRecord(
  options: OfficialRecordOptions,
  fetchedAt: string,
): NormalizedLiveActivity[] {
  const record: RawActivityRecord = {
    name: options.name,
    category: options.category ?? 'art',
    district: options.district,
    venue: options.venue,
    ...options.dates,
    sourceId: options.sourceId,
    sourceType: options.sourceType,
    sourceName: options.sourceName,
    sourceUrl: options.sourceUrl,
    priceText: options.priceText,
    duration: '按官方活动安排',
    timeTags: ['half-day'],
    indoorOutdoor: 'indoor',
    tags: ['官方活动', '文化'],
    emoji: '🎨',
    reason: `${options.sourceName}发布的近期官方活动。`,
    mapKeyword: options.venue,
    transport: '请以活动场馆官方交通指引为准',
  };
  if (validateRawActivity(record, options.cityId, options.allowedHosts).length > 0) return [];
  return [normalizeActivity(
    record,
    options.cityId,
    fetchedAt,
    new Date(fetchedAt),
    options.allowedHosts,
  )];
}

export async function fetchDetailPages(
  listUrl: string,
  hrefPattern: RegExp,
  allowedHosts: readonly string[],
  parseDetail: (html: string, fetchedAt: string, sourceUrl: string) => NormalizedLiveActivity[],
  fetchedAt: string,
): Promise<NormalizedLiveActivity[]> {
  const $ = load(await requestText(listUrl));
  const detailUrls = [...new Set(
    $('a[href]').map((_index, element) => {
      try {
        const url = new URL($(element).attr('href') ?? '', listUrl);
        if (url.protocol === 'http:' && allowedHosts.includes(url.hostname)) url.protocol = 'https:';
        return hrefPattern.test(`${url.pathname}${url.search}`) &&
          allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))
          ? url.href
          : '';
      } catch {
        return '';
      }
    }).get().filter(Boolean),
  )].slice(0, 24);

  const settled = await Promise.allSettled(detailUrls.map(async (url) => {
    const requestUrl = listUrl.startsWith('http:')
      ? url.replace(/^https:/u, 'http:')
      : url;
    return parseDetail(await requestText(requestUrl), fetchedAt, url);
  }));
  return settled.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
}
