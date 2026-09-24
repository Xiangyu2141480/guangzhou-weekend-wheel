import type {
  ActivityCategory,
  ActivityTimeTag,
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

export interface PipelineCountResult {
  activities: NormalizedLiveActivity[];
}
