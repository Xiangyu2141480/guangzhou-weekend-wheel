import type { CityId } from '../cities';
import type { EvergreenActivity } from '../types';
import { validateActivities } from '../types';
import { guangzhouEvergreenActivities } from './guangzhou';

const activitiesByCity: Readonly<Partial<Record<CityId, readonly EvergreenActivity[]>>> = {
  guangzhou: guangzhouEvergreenActivities,
};

export function getEvergreenActivities(cityId: CityId): readonly EvergreenActivity[] {
  return activitiesByCity[cityId] ?? [];
}

export function getAllEvergreenActivities(): readonly EvergreenActivity[] {
  return Object.values(activitiesByCity).flat();
}

export const evergreenActivities = getEvergreenActivities('guangzhou');

validateActivities(getAllEvergreenActivities());
