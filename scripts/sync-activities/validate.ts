import type { RawActivityRecord } from './types';

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function validateRawActivity(record: RawActivityRecord): string[] {
  const errors: string[] = [];
  if (!hasText(record.name)) errors.push('name');
  if (!hasText(record.venue)) errors.push('venue');
  if (!hasText(record.sourceName)) errors.push('sourceName');
  if (!hasText(record.sourceUrl) || !isHttpUrl(record.sourceUrl)) errors.push('sourceUrl');

  const start = new Date(record.eventStart);
  if (!hasText(record.eventStart) || Number.isNaN(start.getTime())) errors.push('eventStart');
  if (record.eventEnd) {
    const end = new Date(record.eventEnd);
    if (Number.isNaN(end.getTime()) || (!Number.isNaN(start.getTime()) && end < start)) {
      errors.push('eventEnd');
    }
  }
  return errors;
}
