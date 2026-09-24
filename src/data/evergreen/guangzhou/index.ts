import { validateActivities } from '../../types';
import { additionalEvergreenActivities } from './additional';
import { coreActivities } from './core';

export const guangzhouEvergreenActivities = [
  ...coreActivities,
  ...additionalEvergreenActivities,
];

validateActivities(guangzhouEvergreenActivities);
