import { describe, expect, it } from 'vitest';
import { evergreenActivities } from './index';

describe('evergreen activity pool', () => {
  it('contains at least 180 unique, complete Guangzhou choices', () => {
    expect(evergreenActivities.length).toBeGreaterThanOrEqual(180);
    expect(new Set(evergreenActivities.map((item) => item.id)).size).toBe(
      evergreenActivities.length,
    );
    expect(
      evergreenActivities.every(
        (item) =>
          item.transport.length > 0 &&
          item.mapKeyword.length > 0 &&
          item.timeTags.length > 0,
      ),
    ).toBe(true);
  });

  it('covers all eleven Guangzhou districts', () => {
    const districts = new Set(
      evergreenActivities.map((activity) => activity.district),
    );

    expect(districts).toEqual(
      new Set([
        '越秀区',
        '荔湾区',
        '海珠区',
        '天河区',
        '白云区',
        '黄埔区',
        '番禺区',
        '南沙区',
        '花都区',
        '增城区',
        '从化区',
      ]),
    );
  });
});
