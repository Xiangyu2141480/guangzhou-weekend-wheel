import type { ActivityFilters } from './activityPool';

export type PlayPresetId = 'wander' | 'budget' | 'rain' | 'friends' | 'photo' | 'night';

export interface PlayPreset {
  id: PlayPresetId;
  label: string;
  emoji: string;
  filters: ActivityFilters;
}

function filters(overrides: Partial<ActivityFilters> = {}): ActivityFilters {
  return {
    categories: new Set(), maxBudget: null, environment: null,
    districts: new Set(), time: null, states: new Set(), ...overrides,
  };
}

export const PLAY_PRESETS: readonly PlayPreset[] = [
  { id: 'wander', label: '随便逛逛', emoji: '☁️', filters: filters() },
  { id: 'budget', label: '低预算出门', emoji: '🪙', filters: filters({ maxBudget: 50 }) },
  { id: 'rain', label: '雨天不无聊', emoji: '☔', filters: filters({ environment: 'indoor' }) },
  { id: 'friends', label: '一起热闹', emoji: '🙌', filters: filters({ states: new Set(['friends']) }) },
  { id: 'photo', label: '拍照散步', emoji: '📷', filters: filters({ states: new Set(['photo']) }) },
  { id: 'night', label: '夜晚漫游', emoji: '🌙', filters: filters({ time: 'evening' }) },
];

export function getPlayPresetFilters(id: PlayPresetId): ActivityFilters {
  const preset = PLAY_PRESETS.find((item) => item.id === id)!;
  return {
    ...preset.filters,
    categories: new Set(preset.filters.categories),
    districts: new Set(preset.filters.districts),
    states: new Set(preset.filters.states),
  };
}
