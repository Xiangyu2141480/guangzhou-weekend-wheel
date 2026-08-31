import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseGzCulturePerformances } from './gzCulturePerformances';

const fixture = readFileSync(
  'scripts/sync-activities/__fixtures__/gz-culture-performances.html',
  'utf8',
);
const fetchedAt = '2026-08-31T00:00:00.000Z';

describe('Guangzhou culture performance adapter', () => {
  it('parses public permit tables and always keeps ticket price unknown', () => {
    const records = parseGzCulturePerformances(fixture, fetchedAt);

    expect(records.map((item) => item.name)).toEqual([
      '2026广州超级草莓音乐节',
      '2026张韶涵「玩家」巡回演唱会-广州站',
    ]);
    expect(records.map((item) => item.district)).toEqual(['南沙区', '天河区']);
    expect(records.every((item) => item.sourceName === '广州市文化广电旅游局')).toBe(true);
    expect(records.every((item) => item.priceStatus === 'unknown')).toBe(true);
  });
});
