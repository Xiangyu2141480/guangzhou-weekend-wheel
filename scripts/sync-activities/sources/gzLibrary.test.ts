import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseGzLibrary } from './gzLibrary';

const fixture = readFileSync(
  'scripts/sync-activities/__fixtures__/gz-library.html',
  'utf8',
);
const fetchedAt = '2026-08-31T00:00:00.000Z';

describe('Guangzhou Library adapter', () => {
  it('parses dated public events and rejects malformed dates', () => {
    const records = parseGzLibrary(fixture, fetchedAt);

    expect(records.map((item) => item.name)).toEqual([
      '【羊城学堂】九月讲座之三',
      '【科普广图】少儿财商素养课堂',
    ]);
    expect(records.every((item) => item.sourceName === '广州图书馆')).toBe(true);
    expect(records.map((item) => item.priceStatus)).toEqual(['free', 'unknown']);
    expect(records[0].venue).toBe('广州图书馆');
  });
});
