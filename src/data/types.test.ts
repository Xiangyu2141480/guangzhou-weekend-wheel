import { describe, expect, it } from 'vitest';
import { isActivity } from './types';

describe('isActivity', () => {
  it('rejects an unknown-price live record without source dates', () => {
    expect(isActivity({ id: 'bad', live: true, priceStatus: 'unknown' })).toBe(false);
  });
});
