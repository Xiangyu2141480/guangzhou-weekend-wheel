import { getDataUrl } from '../config/pages';
import type { CityId } from './cities';
import { decodeEvergreenPayload, EVERGREEN_PAYLOAD_VERSION } from './evergreenCodec';
import type { EvergreenActivity } from './types';

export interface EvergreenLoadOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
  storage?: Storage | null;
  signal?: AbortSignal;
}

export function getEvergreenCacheKey(cityId: CityId): string {
  return `where-to-go:evergreen:${cityId}:v${EVERGREEN_PAYLOAD_VERSION}`;
}

export function getLocalStorage(storage?: Storage | null): Storage | null {
  if (storage !== undefined) return storage;
  try { return typeof window === 'undefined' ? null : window.localStorage; }
  catch { return null; }
}

export async function loadCityEvergreen(
  cityId: CityId,
  options: EvergreenLoadOptions = {},
): Promise<{ activities: EvergreenActivity[]; fromCache: boolean }> {
  const storage = getLocalStorage(options.storage);
  const checkAbort = () => {
    if (options.signal?.aborted) throw new DOMException('The request was aborted', 'AbortError');
  };
  checkAbort();
  try {
    const response = await (options.fetcher ?? globalThis.fetch)(
      getDataUrl(`evergreen/${cityId}.json`, options.baseUrl),
      { cache: 'no-cache', signal: options.signal },
    );
    if (!response.ok) throw new Error(`Evergreen HTTP ${response.status}`);
    const payload: unknown = await response.json();
    checkAbort();
    const activities = decodeEvergreenPayload(payload, cityId);
    try { storage?.setItem(getEvergreenCacheKey(cityId), JSON.stringify(payload)); }
    catch { /* Content remains usable if storage is full or denied. */ }
    return { activities, fromCache: false };
  } catch (error) {
    checkAbort();
    try {
      const cached = storage?.getItem(getEvergreenCacheKey(cityId));
      if (cached) return { activities: decodeEvergreenPayload(JSON.parse(cached) as unknown, cityId), fromCache: true };
    } catch { /* Reject malformed, old-schema and cross-city caches. */ }
    throw error;
  }
}
