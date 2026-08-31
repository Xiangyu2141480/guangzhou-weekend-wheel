import type { NormalizedLiveActivity } from './types';

export interface SnapshotInput {
  previous: NormalizedLiveActivity[];
  current: NormalizedLiveActivity[];
  failedSources: number;
}

export interface SnapshotDecision {
  activities: NormalizedLiveActivity[];
  usedFallback: boolean;
  warning?: string;
}

export function selectSnapshot(input: SnapshotInput): SnapshotDecision {
  const suspiciousDrop =
    input.previous.length > 0 && input.current.length < input.previous.length * 0.3;
  if (input.failedSources >= 2 && suspiciousDrop) {
    return {
      activities: input.previous,
      usedFallback: true,
      warning: 'multiple source failures with >70% drop',
    };
  }
  if (input.current.length === 0 && input.previous.length > 0) {
    return {
      activities: input.previous,
      usedFallback: true,
      warning: 'all current records unavailable',
    };
  }
  return { activities: input.current, usedFallback: false };
}
