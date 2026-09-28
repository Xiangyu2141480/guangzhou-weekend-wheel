const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0 Safari/537.36';
const CONTACT_URL = 'https://github.com/Xiangyu2141480/guangzhou-weekend-wheel';
const TIMEOUT_MS = 12_000;
const MAX_ATTEMPTS = 2;

export async function requestText(url: string, init: RequestInit = {}): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const headers = new Headers(init.headers);
    headers.set('user-agent', USER_AGENT);
    headers.set('from', CONTACT_URL);
    headers.set('accept-encoding', 'identity');
    headers.delete('cookie');

    try {
      const response = await fetch(url, {
        ...init,
        headers,
        credentials: 'omit',
        redirect: 'follow',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      return await response.text();
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Request failed for ${url}`);
}

export function postForm(url: string, data: Record<string, string>): Promise<string> {
  return requestText(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: new URLSearchParams(data),
  });
}
