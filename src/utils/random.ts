import type {
  Activity,
  ActivityCategory,
  EnvironmentPreference,
} from '../data/activities';

export function filterActivities(
  items: Activity[],
  categoryIds: ReadonlySet<ActivityCategory>,
  maxBudget: number | null,
  environment: EnvironmentPreference | null,
): Activity[] {
  return items.filter((activity) => {
    const matchesCategory =
      categoryIds.size === 0 || categoryIds.has(activity.category);
    const matchesBudget = maxBudget === null || activity.budget <= maxBudget;
    const matchesEnvironment =
      environment === null ||
      activity.indoorOutdoor === 'mixed' ||
      activity.indoorOutdoor === environment;

    return matchesCategory && matchesBudget && matchesEnvironment;
  });
}

export function getWheelCandidates(
  items: Activity[],
  lastSelectedId: string | null,
  random: () => number = Math.random,
): Activity[] {
  const withoutPrevious =
    items.length > 1
      ? items.filter((activity) => activity.id !== lastSelectedId)
      : [...items];
  const shuffled = [...withoutPrevious];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled.slice(0, 8);
}

export function pickIndex(length: number): number {
  if (!Number.isInteger(length) || length <= 0) {
    throw new RangeError('length must be a positive integer');
  }

  return Math.floor(Math.random() * length);
}

export function getTargetRotation(
  selectedIndex: number,
  total: number,
  currentRotation: number,
): number {
  if (selectedIndex < 0 || selectedIndex >= total || total <= 0) {
    throw new RangeError('selected sector must exist');
  }

  const sectorAngle = 360 / total;
  const selectedCenter = selectedIndex * sectorAngle + sectorAngle / 2;
  const normalizedCurrent = ((currentRotation % 360) + 360) % 360;
  const alignment =
    (270 - selectedCenter - normalizedCurrent + 360) % 360;

  return currentRotation + 1080 + alignment;
}
