import type {
  ActivityCategory,
  ActivityTimeTag,
  CityId,
  IndoorOutdoor,
  LiveActivity,
} from '../../src/data/types';

export interface RawActivityRecord {
  name: string;
  shortName?: string;
  category?: ActivityCategory;
  district: string;
  venue: string;
  eventStart: string;
  eventEnd?: string;
  sourceId: string;
  sourceType: 'government' | 'official-venue';
  sourceName: string;
  sourceUrl: string;
  sourceUpdatedAt?: string;
  priceText?: string;
  duration?: string;
  timeTags?: ActivityTimeTag[];
  indoorOutdoor?: IndoorOutdoor;
  tags?: string[];
  emoji?: string;
  reason?: string;
  tip?: string;
  mapKeyword?: string;
  transport?: string;
  bookingRequired?: boolean;
}

export interface NormalizedLiveActivity extends LiveActivity {
  fingerprint: string;
}

export interface SourceAdapter {
  id: string;
  cityId: CityId;
  name: string;
  sourceType: 'government' | 'official-venue';
  allowedHosts: readonly string[];
  allowEmptyResult: boolean;
  fetch: (fetchedAt: string) => Promise<RawActivityRecord[]>;
}

export interface PipelineCountResult {
  activities: NormalizedLiveActivity[];
}
