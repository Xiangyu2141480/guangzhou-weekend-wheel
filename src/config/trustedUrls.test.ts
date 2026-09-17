import { describe, expect, it } from 'vitest';
import { isTrustedHttpsUrl } from './trustedUrls';

describe('trusted activity source URLs', () => {
  it.each([
    'https://www.gzlib.org.cn/event/1',
    'https://action.gzlib.org.cn/event/1',
    'https://www.mice-gz.org/event/1',
    'https://wglj.gz.gov.cn/event/1',
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
