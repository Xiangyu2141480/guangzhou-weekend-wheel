import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadCityEvergreen, type EvergreenLoadOptions } from '../data/evergreenLoader';
import type { Activity } from '../data/types';
import { completeLegacyFavoritesMigration, createFavoriteRecord, hasPendingLegacyFavoritesMigration, loadFavorites, loadLegacyFavoriteDeletions, resolveLegacyFavorites, saveFavorites, saveLegacyFavoriteDeletions } from '../utils/storage';

export function useFavorites(options: EvergreenLoadOptions = {}) {
  const [records, setRecords] = useState(loadFavorites);
  const [migrationPending] = useState(() => hasPendingLegacyFavoritesMigration()
    || records.some((record) => record.cityId === 'guangzhou' && record.snapshot === null));
  const deletedIds = useRef(new Set(loadLegacyFavoriteDeletions()));
  const { baseUrl, storage } = options;
  const fetcher = options.fetcher ?? globalThis.fetch;
  useEffect(() => {
    if (!migrationPending) return;
    let active = true;
    const controller = new AbortController();
    void loadCityEvergreen('guangzhou', { baseUrl, fetcher, storage, signal: controller.signal }).then(({ activities }) => {
      if (!active) return;
      setRecords((current) => {
        const next = resolveLegacyFavorites(current, activities, deletedIds.current);
        if (saveFavorites(next)) completeLegacyFavoritesMigration();
        return next;
      });
    }).catch(() => {
      // Keep unresolved records and the marker, so a future mount can retry.
    });
    return () => { active = false; controller.abort(); };
  }, [baseUrl, fetcher, migrationPending, storage]);
  const favoriteIds = useMemo(
    () => records.map((record) => record.activityId),
    [records],
  );

  const toggleFavorite = useCallback((activity: Activity) => {
    setRecords((current) => {
      const wasFavorite = current.some((record) => record.activityId === activity.id);
      if (wasFavorite) deletedIds.current.add(activity.id);
      else deletedIds.current.delete(activity.id);
      saveLegacyFavoriteDeletions(deletedIds.current);
      const next = wasFavorite
        ? current.filter((record) => record.activityId !== activity.id)
        : [...current, createFavoriteRecord(activity)];
      saveFavorites(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((activityId: string) => {
    deletedIds.current.add(activityId);
    saveLegacyFavoriteDeletions(deletedIds.current);
    setRecords((current) => {
      const next = current.filter((record) => record.activityId !== activityId);
      saveFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => favoriteIds.includes(id),
    [favoriteIds],
  );

  return { records, favoriteIds, toggleFavorite, removeFavorite, isFavorite };
}
