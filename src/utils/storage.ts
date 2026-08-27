const FAVORITES_KEY = 'gzww:favorites';

function getStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadFavorites(): string[] {
  try {
    const raw = getStorage()?.getItem(FAVORITES_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((item): item is string => typeof item === 'string'))]
      : [];
  } catch {
    return [];
  }
}

export function saveFavorites(ids: string[]): void {
  try {
    getStorage()?.setItem(FAVORITES_KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    // Storage can be unavailable in privacy mode; in-memory state still works.
  }
}

export function removeFavorite(id: string): void {
  saveFavorites(loadFavorites().filter((favoriteId) => favoriteId !== id));
}
