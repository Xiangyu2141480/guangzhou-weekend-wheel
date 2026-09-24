import type { Activity, EvergreenActivity, LiveActivity } from './types';

type LegacySourceType = 'official' | 'venue';

export type GuangzhouEvergreenActivityV1 = Omit<
  EvergreenActivity,
  'schemaVersion' | 'cityId' | 'legacyIds'
>;

export type GuangzhouLiveActivityV1 = Omit<
  LiveActivity,
  'schemaVersion' | 'cityId' | 'legacyIds' | 'sourceId' | 'sourceType'
> & {
  sourceType: LegacySourceType | 'government' | 'official-venue';
  sourceId?: string;
};

export type GuangzhouActivityV1 = GuangzhouEvergreenActivityV1 | GuangzhouLiveActivityV1;

const LEGACY_SOURCE_IDS: Readonly<Record<string, string>> = {
  广州图书馆: 'gz-library',
  广州市会展业公共服务平台: 'gz-exhibition',
  广州市文化广电旅游局: 'gz-culture-performances',
};

function legacySourceId(activity: Record<string, unknown>): string {
  const sourceName = typeof activity.sourceName === 'string' ? activity.sourceName : '';
  return LEGACY_SOURCE_IDS[sourceName] ?? `legacy:${sourceName || String(activity.id)}`;
}

/**
 * Adds the V2 contract fields to existing Guangzhou records without changing
 * their IDs. Keeping IDs stable preserves the current UI and v1 favorites;
 * the city-prefixed ID migration is intentionally handled separately.
 */
export function toGuangzhouActivityV2(
  activity: GuangzhouEvergreenActivityV1,
): EvergreenActivity;
export function toGuangzhouActivityV2(
  activity: GuangzhouLiveActivityV1,
): LiveActivity;
export function toGuangzhouActivityV2(activity: GuangzhouActivityV1): Activity;
export function toGuangzhouActivityV2(activity: GuangzhouActivityV1): Activity {
  const record = activity as unknown as Record<string, unknown>;
  const sourceType = record.sourceType === 'venue' ? 'official-venue' : 'government';

  return {
    ...activity,
    schemaVersion: 2,
    cityId: 'guangzhou',
    ...(record.live === true
      ? {
          sourceId: typeof record.sourceId === 'string'
            ? record.sourceId
            : legacySourceId(record),
          sourceType,
        }
      : {}),
  } as Activity;
}

export function upgradeGuangzhouActivity(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion === 2) return value;
  return toGuangzhouActivityV2(value as GuangzhouActivityV1);
}
