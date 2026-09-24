import type { CityId } from '../cities';
import type { EvergreenActivity } from '../types';
import { validateActivities } from '../types';
import { beijingEvergreenActivities } from './beijing';
import { guangzhouEvergreenActivities } from './guangzhou';
import { shanghaiEvergreenActivities } from './shanghai';
import { shenzhenEvergreenActivities } from './shenzhen';
import { suzhouEvergreenActivities } from './suzhou';

const activitiesByCity: Readonly<Partial<Record<CityId, readonly EvergreenActivity[]>>> = {
  beijing: beijingEvergreenActivities,
  shanghai: shanghaiEvergreenActivities,
  guangzhou: guangzhouEvergreenActivities,
  shenzhen: shenzhenEvergreenActivities,
  suzhou: suzhouEvergreenActivities,
};

export function getEvergreenActivities(cityId: CityId): readonly EvergreenActivity[] {
  return activitiesByCity[cityId] ?? [];
}

export function getAllEvergreenActivities(): readonly EvergreenActivity[] {
  return Object.values(activitiesByCity).flat();
}

export const evergreenActivities = getEvergreenActivities('guangzhou');

validateActivities(getAllEvergreenActivities());
