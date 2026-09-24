type ActivityDates = {
  eventStart: string;
  eventEnd?: string;
};

export const CHINA_STANDARD_TIME_ZONE = 'Asia/Shanghai';

function validDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getChinaDateKey(value: string | Date): string {
  const date = validDate(value);
  if (!date) throw new RangeError(`Invalid date: ${String(value)}`);

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CHINA_STANDARD_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/** @deprecated Use getChinaDateKey. */
export const getGuangzhouDateKey = getChinaDateKey;

export function isExpired(activity: ActivityDates, now = new Date()): boolean {
  const start = validDate(activity.eventStart);
  const current = validDate(now);
  if (!start || !current) return true;

  const explicitEnd = activity.eventEnd ? validDate(activity.eventEnd) : null;
  if (activity.eventEnd && !explicitEnd) return true;
  const effectiveEnd = explicitEnd ?? new Date(`${getChinaDateKey(start)}T23:59:59.999+08:00`);
  return effectiveEnd.getTime() < current.getTime();
}

export function getLiveStatus(
  activity: ActivityDates,
  now = new Date(),
): 'upcoming' | 'ongoing' {
  const start = validDate(activity.eventStart);
  const current = validDate(now);
  if (!start || !current) throw new RangeError('Cannot derive status from an invalid date');
  return start.getTime() > current.getTime() ? 'upcoming' : 'ongoing';
}
