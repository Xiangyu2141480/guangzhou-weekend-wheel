import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEvergreenActivities } from './evergreen';
import { encodeEvergreenPayload } from './evergreenCodec';
import { getEvergreenCacheKey, loadCityEvergreen } from './evergreenLoader';

const response = (value: unknown) => ({ ok: true, json: async () => value }) as Response;
const source = getEvergreenActivities('guangzhou');
const payload = encodeEvergreenPayload('guangzhou', source);
afterEach(() => localStorage.clear());

describe('selected city evergreen loading', () => {
  it('requests only the selected city below the production base and persists its validated payload', async () => {
    const fetcher = vi.fn(async () => response(payload));
    const result = await loadCityEvergreen('guangzhou', { baseUrl: '/trip/', fetcher });
    expect(result).toStrictEqual({ activities: source, fromCache: false });
    expect(fetcher).toHaveBeenCalledWith('/trip/data/evergreen/guangzhou.json', expect.objectContaining({ signal: undefined }));
    expect(localStorage.getItem(getEvergreenCacheKey('guangzhou'))).not.toBeNull();
    expect(localStorage.getItem(getEvergreenCacheKey('shanghai'))).toBeNull();
  });

  it('falls back to valid same-city content and can retry a first failure', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(response(payload)).mockRejectedValue(new Error('offline'));
    await expect(loadCityEvergreen('guangzhou', { fetcher })).rejects.toThrow('offline');
    expect((await loadCityEvergreen('guangzhou', { fetcher })).fromCache).toBe(false);
    expect(await loadCityEvergreen('guangzhou', { fetcher })).toStrictEqual({ activities: source, fromCache: true });
  });

  it('rejects malformed, cross-city and incompatible caches and never caches an invalid response', async () => {
    const fetcher = vi.fn(async () => response(encodeEvergreenPayload('shanghai', getEvergreenActivities('shanghai'))));
    for (const cached of ['{broken', JSON.stringify({ ...payload, v: 999 }), JSON.stringify(encodeEvergreenPayload('shanghai', getEvergreenActivities('shanghai')))]) {
      localStorage.setItem(getEvergreenCacheKey('guangzhou'), cached);
      await expect(loadCityEvergreen('guangzhou', { fetcher })).rejects.toThrow();
      expect(localStorage.getItem(getEvergreenCacheKey('guangzhou'))).toBe(cached);
    }
  });

  it('does not accept a late result or fall back after abort even when fetch ignores its signal', async () => {
    let release!: (value: Response) => void;
    const fetcher = vi.fn(() => new Promise<Response>((resolve) => { release = resolve; }));
    const controller = new AbortController();
    const pending = loadCityEvergreen('guangzhou', { fetcher, signal: controller.signal });
    controller.abort();
    release(response(payload));
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(localStorage.getItem(getEvergreenCacheKey('guangzhou'))).toBeNull();
  });

  it('keeps valid network data usable when persistent storage is denied', async () => {
    const storage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } } as unknown as Storage;
    expect((await loadCityEvergreen('guangzhou', { storage, fetcher: vi.fn(async () => response(payload)) })).activities).toStrictEqual(source);
  });
});
