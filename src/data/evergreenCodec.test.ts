import { describe, expect, it } from 'vitest';
import { CITY_IDS } from './cities';
import { getAllEvergreenActivities, getEvergreenActivities } from './evergreen';
import { decodeEvergreenPayload, encodeEvergreenPayload } from './evergreenCodec';

describe('compact evergreen payload', () => {
  it('round trips every source field, optional property and city order losslessly', () => {
    for (const city of CITY_IDS) {
      const source = getEvergreenActivities(city);
      expect(decodeEvergreenPayload(encodeEvergreenPayload(city, source), city)).toStrictEqual(source);
    }
    expect(getAllEvergreenActivities().length).toBeGreaterThanOrEqual(357);
  });

  it('is smaller than the full JSON without dropping legacy identities or copy', () => {
    const source = getEvergreenActivities('guangzhou');
    const payload = encodeEvergreenPayload('guangzhou', source);
    expect(new TextEncoder().encode(JSON.stringify(payload)).length)
      .toBeLessThan(new TextEncoder().encode(JSON.stringify(source)).length * 0.65);
    expect(decodeEvergreenPayload(payload, 'guangzhou').flatMap((item) => item.legacyIds ?? []))
      .toEqual(source.flatMap((item) => item.legacyIds ?? []));
  });

  it('rejects cross-city content, unsupported versions, altered cells and truncated rows', () => {
    const source = getEvergreenActivities('guangzhou');
    const payload = encodeEvergreenPayload('guangzhou', source);
    expect(() => decodeEvergreenPayload(payload, 'shanghai')).toThrow();
    expect(() => decodeEvergreenPayload({ ...payload, v: 999 }, 'guangzhou')).toThrow();
    const altered = structuredClone(payload);
    altered.r[0][0] = 'place:guangzhou:tampered';
    expect(() => decodeEvergreenPayload(altered, 'guangzhou')).toThrow();
    const truncated = structuredClone(payload);
    truncated.r[0].pop();
    expect(() => decodeEvergreenPayload(truncated, 'guangzhou')).toThrow();
  });

  it('refuses invalid schemas and conflicting primary or legacy identities before packaging', () => {
    const first = getEvergreenActivities('guangzhou')[0];
    for (const broken of [
      { ...first, tip: 42 }, { ...first, budget: Number.NaN },
      { ...first, id: 'place:shanghai:wrong-city' }, { ...first, unexpected: true },
    ]) expect(() => encodeEvergreenPayload('guangzhou', [broken as never])).toThrow();
    expect(() => encodeEvergreenPayload('guangzhou', [first, first])).toThrow();
    expect(() => encodeEvergreenPayload('shanghai', [first])).toThrow();
    expect(() => encodeEvergreenPayload('guangzhou', [first, {
      ...first, id: 'place:guangzhou:other', legacyIds: [first.id],
    }])).toThrow();
  });
});
