export const TRUSTED_ACTIVITY_SOURCE_HOSTS = [
  'beijing.gov.cn',
  'gzlib.org.cn',
  'mice-gz.org',
  'szmuseum.com',
  'whlyj.sh.gov.cn',
  'wglj.gz.gov.cn',
  'wtl.sz.gov.cn',
] as const;

export function isTrustedHttpsUrl(
  value: string,
  allowedHosts: readonly string[] = TRUSTED_ACTIVITY_SOURCE_HOSTS,
): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && allowedHosts.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}
