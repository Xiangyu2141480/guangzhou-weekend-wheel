import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseGzExhibition } from './gzExhibition';

const fixture = readFileSync(
  'scripts/sync-activities/__fixtures__/gz-exhibition.html',
  'utf8',
);
const fetchedAt = '2026-08-31T00:00:00.000Z';

describe('Guangzhou exhibition adapter', () => {
  it('keeps consumer-friendly exhibitions and excludes B2B or malformed rows', () => {
    const records = parseGzExhibition(fixture, fetchedAt);

    expect(records.map((item) => item.name)).toEqual([
      '2026 GAF广州插画艺术节',
      '广州AP动漫游戏嘉年华',
    ]);
    expect(records.every((item) => item.sourceName === '广州市会展业公共服务平台')).toBe(true);
    expect(records.every((item) => item.priceStatus === 'unknown')).toBe(true);
    expect(records.every((item) => item.eventEnd?.endsWith('23:59:59+08:00'))).toBe(true);
  });
});
