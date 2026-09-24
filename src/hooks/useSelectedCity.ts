import { useCallback, useState } from 'react';
import { getCityConfig, isCityId, type CityId } from '../data/cities';

export const SELECTED_CITY_STORAGE_KEY = 'where-to-go:selected-city:v1';

function getStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function loadSelectedCity(): CityId | null {
  try {
    const value = getStorage()?.getItem(SELECTED_CITY_STORAGE_KEY);
    return isCityId(value) && getCityConfig(value).enabled ? value : null;
  } catch {
    return null;
  }
}

export function useSelectedCity() {
  const [selectedCity, setSelectedCityState] = useState<CityId | null>(loadSelectedCity);

  const selectCity = useCallback((value: CityId) => {
    if (!isCityId(value) || !getCityConfig(value).enabled) return false;

    setSelectedCityState(value);
    try {
      getStorage()?.setItem(SELECTED_CITY_STORAGE_KEY, value);
    } catch {
      // Keep the valid in-memory selection when storage is unavailable.
    }
    return true;
  }, []);

  return { selectedCity, selectCity };
}
