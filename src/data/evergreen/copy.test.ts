import { describe, expect, it } from 'vitest';
import { metro } from './copy';

describe('evergreen metro directions', () => {
  it('expands the common walking connection without changing its wording', () => {
    expect(metro('1/2/8', '人民广场')).toBe('地铁 1/2/8 号线人民广场站，步行前往');
  });

  it('preserves custom connections and branch names', () => {
    expect(metro('3', '北延段同和', '，换乘公交'))
      .toBe('地铁 3 号线北延段同和站，换乘公交');
  });

  it('preserves directions that end at the station', () => {
    expect(metro('1/8', '陈家祠', '')).toBe('地铁 1/8 号线陈家祠站');
  });
});
