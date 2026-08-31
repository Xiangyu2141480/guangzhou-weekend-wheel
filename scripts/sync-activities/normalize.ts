import { createHash } from 'node:crypto';
import { getGuangzhouDateKey, getLiveStatus } from '../../src/utils/date';
import type { ActivityCategory, PriceStatus } from '../../src/data/types';
import type { NormalizedLiveActivity, RawActivityRecord } from './types';
import { validateRawActivity } from './validate';

const categoryEmoji: Record<ActivityCategory, string> = {
  art: '🎨',
  outdoor: '🌿',
  food: '🍜',
  show: '🎭',
  market: '🛍️',
  experience: '✨',
  sport: '🏃',
  night: '🌙',
};

interface PriceDecision {
  priceStatus: PriceStatus;
  budget: number | null;
  budgetLabel: string;
  priceMin?: number;
  priceMax?: number;
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[—–]/gu, '-')
    .replace(/\s+/gu, ' ')
    .trim();
}

function parsePrice(value?: string): PriceDecision {
  const text = normalizeText(value ?? '');
  if (/免费|免票|公益|(^|\D)0\s*元/u.test(text)) {
    return { priceStatus: 'free', budget: 0, budgetLabel: '免费' };
  }

  const numbers = [...text.matchAll(/\d+(?:\.\d+)?/gu)].map((match) => Number(match[0]));
  if (numbers.length > 0) {
    const priceMin = Math.min(...numbers);
    const priceMax = Math.max(...numbers);
    return {
      priceStatus: 'known',
      budget: priceMin,
      budgetLabel: text,
      priceMin,
      priceMax,
    };
  }

  return { priceStatus: 'unknown', budget: null, budgetLabel: '价格待确认' };
}

export function createFingerprint(name: string, venue: string, eventStart: string): string {
  const identity = [normalizeText(name), normalizeText(venue), getGuangzhouDateKey(eventStart)]
    .join('|')
    .toLocaleLowerCase('zh-CN');
  return createHash('sha1').update(identity).digest('hex');
}

export function normalizeActivity(
  record: RawActivityRecord,
  fetchedAt: string,
  now = new Date(),
): NormalizedLiveActivity {
  const errors = validateRawActivity(record);
  if (errors.length > 0) throw new TypeError(`Invalid activity fields: ${errors.join(', ')}`);

  const name = normalizeText(record.name);
  const venue = normalizeText(record.venue);
  const category = record.category ?? 'experience';
  const price = parsePrice(record.priceText);
  const fingerprint = createFingerprint(name, venue, record.eventStart);

  return {
    id: `live-${fingerprint.slice(0, 16)}`,
    fingerprint,
    name,
    shortName: normalizeText(record.shortName ?? name).slice(0, 10),
    category,
    district: normalizeText(record.district ?? '广州市'),
    venue,
    budget: price.budget,
    budgetLabel: price.budgetLabel,
    priceStatus: price.priceStatus,
    priceMin: price.priceMin,
    priceMax: price.priceMax,
    duration: normalizeText(record.duration ?? '以官方活动安排为准'),
    timeTags: record.timeTags ?? ['half-day'],
    indoorOutdoor: record.indoorOutdoor ?? 'indoor',
    tags: [...new Set([...(record.tags ?? []).map(normalizeText), '近期活动'])],
    emoji: record.emoji ?? categoryEmoji[category],
    reason: normalizeText(record.reason ?? `近期可参加：${name}`),
    tip: record.tip ? normalizeText(record.tip) : undefined,
    mapKeyword: normalizeText(record.mapKeyword ?? venue),
    transport: normalizeText(record.transport ?? '请以场馆官方交通指引为准'),
    live: true,
    sourceType: record.sourceType,
    sourceName: normalizeText(record.sourceName),
    sourceUrl: record.sourceUrl,
    sourceUpdatedAt: record.sourceUpdatedAt,
    eventStart: record.eventStart,
    eventEnd: record.eventEnd,
    fetchedAt,
    lastVerifiedAt: fetchedAt,
    status: getLiveStatus(record, now),
    bookingRequired: record.bookingRequired,
  };
}
