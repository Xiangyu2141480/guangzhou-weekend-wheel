import { describe, expect, it } from 'vitest';
import { normalizeActivity } from './normalize';
import {
  createManifest,
  deriveAvailability,
  isFallbackFresh,
  validateCitySnapshot,
  validateManifest,
  type CityActivitySnapshot,
} from './snapshot';
import type { SourceAdapter } from './types';

const generatedAt = '2026-09-01T00:00:00.000Z';
const adapter: SourceAdapter = {
  id: 'test-source',
  cityId: 'guangzhou',
  name: '测试官方源',
  sourceType: 'official-venue',
  allowedHosts: ['gzlib.org.cn'],
  allowEmptyResult: false,
  fetch: async () => [],
};

function snapshot(): CityActivitySnapshot {
  const activity = normalizeActivity({
    name: '测试活动',
    district: '天河区',
    venue: '广州图书馆',
    eventStart: '2026-09-02T10:00:00+08:00',
    sourceId: adapter.id,
    sourceType: adapter.sourceType,
    sourceName: adapter.name,
    sourceUrl: 'https://www.gzlib.org.cn/event/1',
  }, 'guangzhou', generatedAt, new Date(generatedAt), adapter.allowedHosts);
  return {
    schemaVersion: 2,
    cityId: 'guangzhou',
    generatedAt,
    availability: 'fresh',
    sources: [{
      id: adapter.id,
      name: adapter.name,
      sourceType: adapter.sourceType,
      availability: 'fresh',
      fetched: 1,
      final: 1,
    }],
    counts: {
      fetched: 1,
      invalid: 0,
      expired: 0,
      duplicate: 0,
      current: 1,
      fallback: 0,
      final: 1,
    },
    warnings: [],
    activities: [activity],
  };
}

describe('atomic city snapshots', () => {
  it.each([
    [1, 0, 1, 0, 'fresh'],
    [1, 1, 1, 1, 'partial'],
    [0, 1, 0, 1, 'stale'],
    [0, 1, 0, 0, 'evergreen-only'],
  ] as const)(
    'derives source health %s/%s and counts %s/%s as %s',
    (successful, failed, current, fallback, expected) => {
      expect(deriveAvailability(successful, failed, current, fallback)).toBe(expected);
    },
  );

  it('limits fallback verification age to seven days inclusively', () => {
    const now = new Date(generatedAt);
    expect(isFallbackFresh('2026-08-25T00:00:00.000Z', now)).toBe(true);
    expect(isFallbackFresh('2026-08-24T23:59:59.999Z', now)).toBe(false);
    expect(isFallbackFresh('not-a-date', now)).toBe(false);
  });

  it('validates snapshot metadata and rejects stale fallback records', () => {
    const value = snapshot();
    expect(() => validateCitySnapshot(value, 'guangzhou', [adapter])).not.toThrow();
    const stale = structuredClone(value);
    stale.availability = 'stale';
    stale.sources[0].availability = 'fallback';
    stale.sources[0].fetched = 0;
    stale.counts.fetched = 0;
    stale.counts.current = 0;
    stale.counts.fallback = 1;
    stale.activities[0].lastVerifiedAt = '2026-08-24T23:59:59.999Z';
    expect(() => validateCitySnapshot(stale, 'guangzhou', [adapter]))
      .toThrow(/availability/u);
  });

  it('requires manifest entries to match all five snapshots', () => {
    const guangzhou = snapshot();
    const snapshots = ['beijing', 'shanghai', 'guangzhou', 'shenzhen', 'suzhou']
      .map((cityId) => cityId === 'guangzhou'
        ? guangzhou
        : ({
          ...guangzhou,
          cityId,
          activities: [],
          sources: [],
          availability: 'evergreen-only',
          counts: {
            fetched: 0, invalid: 0, expired: 0, duplicate: 0,
            current: 0, fallback: 0, final: 0,
          },
        })) as CityActivitySnapshot[];
    const manifest = createManifest(snapshots);
    expect(() => validateManifest(manifest, snapshots)).not.toThrow();
    manifest.cities[2].liveCount = 2;
    expect(() => validateManifest(manifest, snapshots)).toThrow(/guangzhou/u);
  });
});
