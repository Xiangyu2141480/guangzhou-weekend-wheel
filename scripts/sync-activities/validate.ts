import type { RawActivityRecord } from './types';
import {
  isTrustedHttpsUrl,
  TRUSTED_ACTIVITY_SOURCE_HOSTS,
} from '../../src/config/trustedUrls';
import { isDistrictInCity } from '../../src/data/cities';

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

const ISO_DATE_TIME_WITH_ZONE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-](\d{2}):(\d{2}))$/u;

function isZonedDateTime(value: unknown): value is string {
  if (!hasText(value)) return false;
  const match = value.match(ISO_DATE_TIME_WITH_ZONE);
  if (!match) return false;
  const [, year, month, day, hour, minute, second = '0', zone, zoneHour = '0', zoneMinute = '0'] = match;
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (
    monthNumber < 1 ||
    monthNumber > 12 ||
    dayNumber < 1 ||
    dayNumber > new Date(Date.UTC(Number(year), monthNumber, 0)).getUTCDate() ||
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 59 ||
    (zone !== 'Z' && (Number(zoneHour) > 14 ||
      Number(zoneMinute) > 59 ||
      (Number(zoneHour) === 14 && Number(zoneMinute) !== 0)))
  ) return false;
  return !Number.isNaN(new Date(value).getTime());
}

export function validateRawActivity(
  record: RawActivityRecord,
  allowedSourceHosts: readonly string[] = TRUSTED_ACTIVITY_SOURCE_HOSTS,
): string[] {
  const errors: string[] = [];
  if (!hasText(record.name)) errors.push('name');
  if (!hasText(record.venue)) errors.push('venue');
  if (!isDistrictInCity('guangzhou', record.district)) errors.push('district');
  if (!hasText(record.sourceId)) errors.push('sourceId');
  if (record.sourceType !== 'government' && record.sourceType !== 'official-venue') {
    errors.push('sourceType');
  }
  if (!hasText(record.sourceName)) errors.push('sourceName');
  if (!hasText(record.sourceUrl) || !isTrustedHttpsUrl(record.sourceUrl, allowedSourceHosts)) {
    errors.push('sourceUrl');
  }

  const validStart = isZonedDateTime(record.eventStart);
  const start = validStart ? new Date(record.eventStart) : null;
  if (!validStart) errors.push('eventStart');
  if (record.eventEnd) {
    const validEnd = isZonedDateTime(record.eventEnd);
    const end = validEnd ? new Date(record.eventEnd) : null;
    if (!validEnd || (start && end && end < start)) {
      errors.push('eventEnd');
    }
  }
  return errors;
}
