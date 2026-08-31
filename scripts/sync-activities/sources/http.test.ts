import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestText } from './http';

afterEach(() => vi.unstubAllGlobals());

describe('official source HTTP client', () => {
  it('uses a product user agent, timeout signal, no cookies, and one retry', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => '' })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => 'ok' });
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestText('https://example.gov.cn/events')).resolves.toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(options.headers).get('user-agent')).toContain('YuwanWeekendWheel');
    expect(new Headers(options.headers).has('cookie')).toBe(false);
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
});
