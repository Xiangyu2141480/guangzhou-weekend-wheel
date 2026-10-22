import type { ActivityCategory } from './types';

export const categories: ReadonlyArray<{
  id: ActivityCategory;
  label: string;
  emoji: string;
}> = [
  { id: 'art', label: '看展', emoji: '🎨' },
  { id: 'outdoor', label: '户外', emoji: '🌿' },
  { id: 'food', label: '吃吃喝喝', emoji: '🍜' },
  { id: 'show', label: '演出', emoji: '🎵' },
  { id: 'market', label: '市集', emoji: '🛍️' },
  { id: 'experience', label: '好玩体验', emoji: '🎲' },
  { id: 'sport', label: '运动一下', emoji: '🏸' },
  { id: 'night', label: '夜游', emoji: '🌙' },
];
