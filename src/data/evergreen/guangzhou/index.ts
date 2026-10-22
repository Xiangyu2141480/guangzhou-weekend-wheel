import { guangzhouDistrictExpansionActivities } from './districtExpansion';
import { validateActivities } from '../../types';
import { additionalEvergreenActivities } from './additional';
import { coreActivities } from './core';
import { guangzhouExpansionActivities } from './expansion';

export const guangzhouEvergreenActivities = [
  ...coreActivities,
  ...additionalEvergreenActivities,
  ...guangzhouExpansionActivities,
  ...guangzhouDistrictExpansionActivities,
];

validateActivities(guangzhouEvergreenActivities);
