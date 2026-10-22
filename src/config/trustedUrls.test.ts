import { describe, expect, it } from 'vitest';
import { isTrustedHttpsUrl } from './trustedUrls';

describe('trusted activity source URLs', () => {
  it.each([
    'https://www.beijing.gov.cn/fwcj/calendar/event/1.html',
    'https://www.gzlib.org.cn/event/1',
    'https://action.gzlib.org.cn/event/1',
    'https://www.mice-gz.org/event/1',
    'https://whlyj.sh.gov.cn/yshd/event.html',
    'https://wtl.sz.gov.cn/bsfw/mzwhhd/mzhd/content/post_1.html',
    'https://www.szmuseum.com/Exhibition/TemporaryDetails/1',
    'https://wglj.gz.gov.cn/event/1',
    'https://www.chinasilkmuseum.com/zz/info_17.aspx?itemid=31423',
    'https://activity.njmuseum.com.cn/reservation/activity/out/activityOutList.do',
    'https://www.cdmuseum.com/linzhan/202610/4540.html',
    'https://www.3gmuseum.cn/web/column/col5009287.html',
  ])('allows HTTPS URLs on configured source hosts: %s', (url) => {
    expect(isTrustedHttpsUrl(url)).toBe(true);
  });

  it.each([
    'http://www.gzlib.org.cn/event/1',
    'https://gzlib.org.cn.attacker.example/event/1',
    'https://attacker.example/event/1',
    'javascript:alert(1)',
    'not-a-url',
  ])('rejects insecure, deceptive, or unlisted URLs: %s', (url) => {
    expect(isTrustedHttpsUrl(url)).toBe(false);
  });
});
