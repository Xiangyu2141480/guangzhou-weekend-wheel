export const TRUSTED_ACTIVITY_SOURCE_HOSTS = [
  'gzlib.org.cn',
  'mice-gz.org',
  'wglj.gz.gov.cn',
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
