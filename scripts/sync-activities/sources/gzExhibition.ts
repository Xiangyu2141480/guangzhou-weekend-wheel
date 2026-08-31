import { load } from 'cheerio';
import { getGuangzhouDateKey } from '../../../src/utils/date';
import type { ActivityCategory } from '../../../src/data/types';
import { normalizeActivity, normalizeText } from '../normalize';
import type { NormalizedLiveActivity, RawActivityRecord } from '../types';
import { validateRawActivity } from '../validate';
import { postForm } from './http';

const API_URL = 'https://www.mice-gz.org/cms/search/searchdata.jsp';
const PUBLIC_BASE_URL = 'https://www.mice-gz.org';
const CONSUMER_ALLOW = /动漫|游戏|插画|艺术|文化|图书|宠物|美食|食品|咖啡|茶|旅游|体育|户外|家居|生活|婚庆|摄影|汽车/u;
const PROFESSIONAL_DENY = /工业|供应链|采购|设备|机械|原料|技术|贸易|加盟|制造|专业观众|B2B|五金|包装|化工/u;

interface ExhibitionRow {
  title?: string;
  url?: string;
  releaseuser?: string;
  ptype?: string;
  pbegin?: number | string;
  pend?: number | string;
  content?: string;
}

interface ExhibitionResponse {
  rows?: ExhibitionRow[];
}

function compactDate(value: number | string | undefined, endOfDay = false): string | null {
  const digits = String(value ?? '').replace(/\D/gu, '').padEnd(14, '0');
  if (digits.length < 8) return null;
  const date = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  const timeDigits = digits.slice(8, 14);
  const time = endOfDay && /^0+$/u.test(timeDigits)
    ? '23:59:59'
    : `${timeDigits.slice(0, 2)}:${timeDigits.slice(2, 4)}:${timeDigits.slice(4, 6)}`;
  return `${date}T${time}+08:00`;
}

function districtFromVenue(venue: string): string {
  const district = ['天河', '越秀', '海珠', '荔湾', '番禺', '黄埔', '白云', '花都', '南沙', '增城', '从化']
    .find((name) => venue.includes(name));
  return district ? `${district}区` : '广州市';
}

function categoryFor(text: string): ActivityCategory {
  if (/美食|食品|咖啡|茶/u.test(text)) return 'food';
  if (/艺术|插画|摄影|图书|动漫/u.test(text)) return 'art';
  if (/体育|户外|汽车/u.test(text)) return 'sport';
  return 'market';
}

function explicitPriceText(content?: string): string | undefined {
  const text = load(content ?? '').text();
  if (/免费|免票/u.test(text)) return '免费';
  return text.match(/(?:票价|门票|[¥￥])\s*\d+(?:\.\d+)?(?:\s*[-~至]\s*\d+(?:\.\d+)?)?\s*元?/u)?.[0];
}

export function parseGzExhibition(text: string, fetchedAt: string): NormalizedLiveActivity[] {
  let response: ExhibitionResponse;
  try {
    response = JSON.parse(text) as ExhibitionResponse;
  } catch {
    return [];
  }

  return (response.rows ?? []).flatMap((row) => {
    const consumerText = normalizeText(`${row.title ?? ''} ${row.ptype ?? ''} ${load(row.content ?? '').text()}`);
    if (!CONSUMER_ALLOW.test(consumerText) || PROFESSIONAL_DENY.test(consumerText)) return [];
    const eventStart = compactDate(row.pbegin);
    const eventEnd = compactDate(row.pend, true);
    if (!eventStart || !eventEnd) return [];

    const venue = normalizeText(row.releaseuser ?? '');
    const category = categoryFor(consumerText);
    const record: RawActivityRecord = {
      name: row.title ?? '',
      category,
      district: districtFromVenue(venue),
      venue,
      eventStart,
      eventEnd,
      sourceType: 'official',
      sourceName: '广州市会展业公共服务平台',
      sourceUrl: new URL(row.url ?? '', PUBLIC_BASE_URL).href,
      priceText: explicitPriceText(row.content),
      duration: '按官方展期安排',
      timeTags: ['half-day', 'full-day'],
      indoorOutdoor: 'indoor',
      tags: ['逛展', row.ptype ?? '展览'],
      emoji: category === 'food' ? '🍜' : '🖼️',
      reason: '广州官方会展平台发布、适合公众周末到访的展览。',
      mapKeyword: venue,
      transport: '请以展馆官方交通指引为准',
    };
    if (validateRawActivity(record).length > 0) return [];
    return [normalizeActivity(record, fetchedAt, new Date(fetchedAt))];
  });
}

export async function fetchGzExhibition(fetchedAt = new Date().toISOString()): Promise<NormalizedLiveActivity[]> {
  const start = new Date(fetchedAt);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 120);
  const dateNumber = (date: Date) => getGuangzhouDateKey(date).replace(/-/gu, '');
  const text = await postForm(API_URL, {
    siteid: '106',
    categoryid: '48',
    ptype: '',
    isedit: 'false',
    keyvalue: '',
    page: '1',
    pagesize: '999',
    pbegin: dateNumber(start),
    pend: dateNumber(end),
  });
  return parseGzExhibition(text, fetchedAt);
}
