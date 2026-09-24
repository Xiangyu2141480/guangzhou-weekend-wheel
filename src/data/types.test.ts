import { describe, expect, it } from 'vitest';
import { activities } from './activities';
import { isActivity, validateActivities } from './types';

describe('isActivity', () => {
  it('rejects an unknown-price live record without source dates', () => {
    expect(isActivity({ id: 'bad', live: true, priceStatus: 'unknown' })).toBe(false);
  });

  it('requires V2 schema and city fields', () => {
    const activity = activities[0];
    expect(activity).toMatchObject({ schemaVersion: 2, cityId: 'guangzhou' });
    expect(isActivity(activity)).toBe(true);
    expect(isActivity({ ...activity, schemaVersion: 1 })).toBe(false);
    expect(isActivity({ ...activity, cityId: 'hangzhou' })).toBe(false);
  });

  it('rejects a district that does not belong to the activity city', () => {
    expect(isActivity({ ...activities[0], cityId: 'shanghai' })).toBe(false);
  });

  it('enforces global uniqueness across current and legacy IDs', () => {
    const first = { ...activities[0], legacyIds: ['old-guangzhou-id'] };
    const conflictingId = { ...activities[1], id: 'old-guangzhou-id' };

    expect(() => validateActivities(activities)).not.toThrow();
    expect(() => validateActivities([first, conflictingId])).toThrow(/conflicts/u);
  });
});
