import { describe, expect, it } from 'vitest';
import { getGuangzhouDateKey, getLiveStatus, isExpired } from './date';

const now = new Date('2026-08-30T12:00:00+08:00');

describe('Guangzhou activity dates', () => {
  it.each([
    ['2026-08-31T10:00:00+08:00', undefined, false],
    ['2026-08-29T10:00:00+08:00', '2026-08-30T18:00:00+08:00', false],
    ['2026-08-28T10:00:00+08:00', '2026-08-28T18:00:00+08:00', true],
  ])('classifies expiry for %s', (eventStart, eventEnd, expired) => {
    expect(isExpired({ eventStart, eventEnd }, now)).toBe(expired);
  });

  it('treats an event without an end time as active through its Guangzhou calendar day', () => {
    expect(isExpired({ eventStart: '2026-08-30T09:00:00+08:00' }, now)).toBe(false);
    expect(isExpired({ eventStart: '2026-08-29T09:00:00+08:00' }, now)).toBe(true);
  });

  it('derives Guangzhou date keys and live status independent of machine timezone', () => {
    expect(getGuangzhouDateKey('2026-08-30T16:30:00Z')).toBe('2026-08-31');
    expect(getLiveStatus({ eventStart: '2026-08-31T10:00:00+08:00' }, now)).toBe('upcoming');
    expect(getLiveStatus({
      eventStart: '2026-08-29T10:00:00+08:00',
      eventEnd: '2026-08-30T18:00:00+08:00',
    }, now)).toBe('ongoing');
  });
});
