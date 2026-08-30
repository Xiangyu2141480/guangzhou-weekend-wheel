import { artActivities } from './art';
import { experienceActivities } from './experience';
import { foodActivities } from './food';
import { marketActivities } from './market';
import { nightActivities } from './night';
import { outdoorActivities } from './outdoor';
import { showActivities } from './show';
import { sportActivities } from './sport';

export const additionalEvergreenActivities = [
  ...artActivities,
  ...outdoorActivities,
  ...foodActivities,
  ...showActivities,
  ...marketActivities,
  ...experienceActivities,
  ...sportActivities,
  ...nightActivities,
];
