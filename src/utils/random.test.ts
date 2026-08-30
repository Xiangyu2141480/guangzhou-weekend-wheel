import { describe, expect, test, vi } from 'vitest';
import { activities } from '../data/activities';
import {
  filterActivities,
  getTargetRotation,
  getWheelCandidates,
  pickIndex,
} from './random';

describe('activity filtering', () => {
  test('combines category, budget, and outdoor preferences', () => {
    const filtered = filterActivities(
      activities,
      new Set(['outdoor']),
      50,
      'outdoor',
    );

    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every(
        (activity) =>
          activity.category === 'outdoor' &&
          activity.budget !== null &&
          activity.budget <= 50 &&
          activity.indoorOutdoor !== 'indoor',
      ),
    ).toBe(true);
  });

  test('excludes an unknown price when a strict budget is selected', () => {
    const unknownPrice = {
      ...activities[0],
      id: 'unknown-price',
      budget: null,
      budgetLabel: '价格待确认',
      priceStatus: 'unknown' as const,
    };

    expect(
      filterActivities([unknownPrice, ...activities], new Set(), 100, null),
    ).not.toContain(unknownPrice);
  });

  test('returns every activity when no preference is selected', () => {
    expect(filterActivities(activities, new Set(), null, null)).toEqual(activities);
  });
});

describe('wheel selection', () => {
  test('returns ten defined and unique candidates', () => {
    const candidates = getWheelCandidates(activities, null, () => 0.42);

    expect(candidates).toHaveLength(10);
    expect(candidates.every(Boolean)).toBe(true);
    expect(new Set(candidates.map((activity) => activity.id)).size).toBe(10);
  });

  test('avoids the previous result when alternatives exist', () => {
    const previous = activities[0];
    const candidates = getWheelCandidates(activities.slice(0, 10), previous.id, () => 0);

    expect(candidates.map((activity) => activity.id)).not.toContain(previous.id);
  });

  test('returns only a legal random index', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.999999);

    expect(pickIndex(8)).toBe(0);
    expect(pickIndex(8)).toBe(7);
    vi.restoreAllMocks();
  });

  test('centres the selected sector beneath the top pointer', () => {
    const rotation = getTargetRotation(2, 8, 20);
    const sectorAngle = 360 / 8;
    const selectedCenterAfterRotation =
      (2 * sectorAngle + sectorAngle / 2 + rotation) % 360;

    expect(rotation).toBeGreaterThanOrEqual(20 + 1080);
    expect(selectedCenterAfterRotation).toBeCloseTo(270, 5);
  });
});
