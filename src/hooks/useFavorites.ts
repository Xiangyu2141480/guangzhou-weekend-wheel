import { useCallback, useMemo, useState } from 'react';
import type { Activity } from '../data/types';
import { createFavoriteRecord, loadFavorites, saveFavorites } from '../utils/storage';

export function useFavorites() {
  const [records, setRecords] = useState(loadFavorites);
  const favoriteIds = useMemo(
    () => records.map((record) => record.activityId),
    [records],
  );

  const toggleFavorite = useCallback((activity: Activity) => {
    setRecords((current) => {
      const next = current.some((record) => record.activityId === activity.id)
        ? current.filter((record) => record.activityId !== activity.id)
        : [...current, createFavoriteRecord(activity)];
      saveFavorites(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((activityId: string) => {
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
