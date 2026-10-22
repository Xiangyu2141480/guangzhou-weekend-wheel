import { describe, expect, it } from 'vitest';
import { coreEvergreen } from './create';

describe('compact legacy Guangzhou activities', () => {
  it('retains legacy identity, copy, custom price labels and migration metadata', () => {
    expect(coreEvergreen(
      'guangdong-museum', '逛广东省博物馆', '广东省博物馆', 'art', '天河区',
      0, '免费预约', '2–3 小时', 'indoor', ['博物馆', '建筑', '拍照'], '🏺',
      '从自然标本到岭南历史，一栋楼就能安稳逛掉半天。',
      '周一闭馆，热门时段建议提前预约。', '广东省博物馆',
      '地铁 3/5 号线珠江新城站，步行约 15 分钟',
    )).toEqual({
      id: 'place:guangzhou:guangdong-museum',
      legacyIds: ['guangdong-museum'],
      cityId: 'guangzhou',
      schemaVersion: 2,
      name: '逛广东省博物馆',
      shortName: '广东省博物馆',
      category: 'art',
      district: '天河区',
      budget: 0,
      budgetLabel: '免费预约',
      priceStatus: 'free',
      duration: '2–3 小时',
      indoorOutdoor: 'indoor',
      tags: ['博物馆', '建筑', '拍照'],
      emoji: '🏺',
      reason: '从自然标本到岭南历史，一栋楼就能安稳逛掉半天。',
      tip: '周一闭馆，热门时段建议提前预约。',
      mapKeyword: '广东省博物馆',
      venue: '广东省博物馆',
      transport: '地铁 3/5 号线珠江新城站，步行约 15 分钟',
      timeTags: ['half-day'],
      live: false,
    });
  });

  it.each([
    { duration: '1.5–2 小时', tags: ['历史'], expected: ['short'] },
    { duration: '3–4 小时', tags: ['夜景'], expected: ['half-day', 'evening'] },
    { duration: '4–6 小时', tags: ['日落'], expected: ['full-day', 'evening'] },
    { duration: '3–5 小时', tags: ['公园'], expected: ['full-day'] },
  ])('preserves legacy time tags for $duration and $tags', ({ duration, tags, expected }) => {
    const activity = coreEvergreen(
      'legacy-place', '夜游名称', '地点', 'outdoor', '越秀区',
      10, '约 ¥10', duration, 'outdoor', tags, '🌿', '理由', undefined, '地图', '交通',
    );
    expect(activity.timeTags).toEqual(expected);
    expect(activity.priceStatus).toBe('known');
    expect(activity).toHaveProperty('tip', undefined);
    expect(activity.live).toBe(false);
  });
});
