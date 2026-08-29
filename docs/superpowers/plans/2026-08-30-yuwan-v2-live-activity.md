# Yuwan V2 Live Activity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing Guangzhou weekend wheel in place with the user-supplied Yuwan character system, a verified 180+ evergreen pool, scheduled official live-activity synchronization, ten-candidate random modes, richer filters, and a production-verified GitHub Pages release.

**Architecture:** Keep evergreen activities in the Vite bundle for instant, failure-proof startup, then progressively merge a Pages-hosted live JSON snapshot loaded with `import.meta.env.BASE_URL`. A Node/TypeScript sync pipeline runs only in GitHub Actions, isolates official source adapters, normalizes and validates records, reuses the previous production snapshot after suspicious failures, and deploys generated JSON without committing it to `main`.

**Tech Stack:** React 19, TypeScript 5.9 strict, Vite 8, Vitest 4, Testing Library, Playwright, Node 24 global `fetch`, Cheerio, TSX, GitHub Actions, GitHub Pages, SVG and optimized transparent PNG assets.

---

## File map

- `src/data/types.ts`: shared activity, filter, sync-status, and live-source contracts.
- `src/data/activities.ts`: compatibility export for the aggregate evergreen pool and category definitions.
- `src/data/evergreen/*.ts`: focused evergreen datasets grouped by user-facing category.
- `src/data/evergreen/references.ts`: official/reliable source registry and verification dates used by evergreen records.
- `src/utils/activityPool.ts`: merge, validation, fingerprint, expiry, filtering, and candidate sampling pure functions.
- `src/utils/date.ts`: Guangzhou-local date parsing and expiry helpers.
- `src/hooks/useActivityPool.ts`: progressive Pages JSON loading, status loading, and static fallback.
- `src/hooks/useWheel.ts`: ten-candidate locking, reroll, recent candidate/result history, and result lifecycle.
- `src/assets/yuwan/**`: independent user-reference-derived mascot assets; no sprite sheets.
- `src/constants/mascot.ts`, `src/constants/mascotMessages.ts`: mascot asset map and contextual copy.
- `src/components/YuwanMascot.tsx`: the only component that resolves mascot state to an asset.
- `src/components/ActivityPoolStatus.tsx`, `src/components/ModeSwitch.tsx`: pool health and random-mode UI.
- `src/components/FilterPanel.tsx`, `src/components/Wheel.tsx`, `src/components/ResultSheet.tsx`, `src/components/FavoritesSheet.tsx`, `src/components/Header.tsx`: upgraded product UI.
- `scripts/sync-activities/**`: source adapters, fixtures, normalization, validation, dedupe, expiry, fallback, CLI output, and tests.
- `public/data/*.json`: repository-safe initial fallback outputs overwritten in the deployment artifact.
- `.github/workflows/deploy.yml`: push/manual/six-hour sync, test, build, Pages deploy, and health summary.
- `e2e/weekend-wheel.spec.ts`: local and production behavior plus responsive QA.
- `README.md`: Yuwan asset lineage, live pipeline, source list, frequency, commands, and disclaimers.

### Task 1: Establish the V2 activity contracts

**Files:**
- Create: `src/data/types.ts`
- Modify: `src/data/activities.ts`
- Create: `src/data/types.test.ts`

- [ ] **Step 1: Write a failing runtime-shape test**

```ts
import { describe, expect, it } from 'vitest';
import { isActivity } from './types';

describe('isActivity', () => {
  it('rejects an unknown-price live record without source dates', () => {
    expect(isActivity({ id: 'bad', live: true, priceStatus: 'unknown' })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and confirm the new module is absent**

Run: `npm test -- --run src/data/types.test.ts`  
Expected: FAIL because `src/data/types.ts` cannot be resolved.

- [ ] **Step 3: Define the contracts and narrow validator**

```ts
export type ActivityCategory = 'art' | 'outdoor' | 'food' | 'show' | 'market' | 'experience' | 'sport' | 'night';
export type PriceStatus = 'known' | 'free' | 'unknown';
export type IndoorOutdoor = 'indoor' | 'outdoor' | 'mixed';
export type RandomMode = 'fresh' | 'fate';

export interface ActivityCore {
  id: string;
  name: string;
  shortName: string;
  category: ActivityCategory;
  district: string;
  venue: string;
  budget: number | null;
  budgetLabel: string;
  priceStatus: PriceStatus;
  duration: string;
  timeTags: Array<'short' | 'half-day' | 'full-day' | 'evening'>;
  indoorOutdoor: IndoorOutdoor;
  tags: string[];
  emoji: string;
  reason: string;
  tip?: string;
  mapKeyword: string;
  transport: string;
}

export interface EvergreenActivity extends ActivityCore { live: false }
export interface LiveActivity extends ActivityCore {
  live: true;
  sourceType: 'official' | 'venue';
  sourceName: string;
  sourceUrl: string;
  sourceUpdatedAt?: string;
  eventStart: string;
  eventEnd?: string;
  fetchedAt: string;
  lastVerifiedAt: string;
  status: 'upcoming' | 'ongoing';
  priceMin?: number;
  priceMax?: number;
  bookingRequired?: boolean;
}
export type Activity = EvergreenActivity | LiveActivity;

export function isActivity(value: unknown): value is Activity {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.name === 'string' &&
    typeof item.shortName === 'string' && typeof item.category === 'string' &&
    typeof item.district === 'string' && typeof item.venue === 'string' &&
    typeof item.priceStatus === 'string' && typeof item.duration === 'string' &&
    Array.isArray(item.timeTags) && Array.isArray(item.tags) &&
    typeof item.emoji === 'string' && typeof item.reason === 'string' &&
    typeof item.mapKeyword === 'string' && typeof item.transport === 'string' &&
    (item.live === false || (item.live === true && typeof item.sourceUrl === 'string' && typeof item.eventStart === 'string'));
}
```

Move the existing category/environment exports to `types.ts`, re-export them from `activities.ts`, and adapt every existing record without changing its stable ID.

- [ ] **Step 4: Run focused and existing tests**

Run: `npm test -- --run src/data/types.test.ts src/utils/random.test.ts src/App.test.tsx`  
Expected: PASS after all 61 V1 records conform to the new type.

- [ ] **Step 5: Commit the contract migration**

```bash
git add src/data/types.ts src/data/types.test.ts src/data/activities.ts src/utils/random.ts src/App.tsx src/components src/hooks
git commit -m "refactor: define V2 activity contracts"
```

### Task 2: Expand and validate the evergreen pool

**Files:**
- Create: `src/data/evergreen/{art,outdoor,food,show,market,experience,sport,night}.ts`
- Create: `src/data/evergreen/references.ts`
- Create: `src/data/evergreen/index.ts`
- Create: `src/data/evergreen/index.test.ts`
- Modify: `src/data/activities.ts`

- [ ] **Step 1: Write failing pool-quality tests**

```ts
import { describe, expect, it } from 'vitest';
import { evergreenActivities } from './index';

describe('evergreen activity pool', () => {
  it('contains at least 180 unique, complete Guangzhou choices', () => {
    expect(evergreenActivities.length).toBeGreaterThanOrEqual(180);
    expect(new Set(evergreenActivities.map((item) => item.id)).size).toBe(evergreenActivities.length);
    expect(evergreenActivities.every((item) => item.transport && item.mapKeyword && item.timeTags.length > 0)).toBe(true);
  });

  it('covers all eleven Guangzhou districts', () => {
    const districts = new Set(evergreenActivities.map((item) => item.district));
    expect(districts).toEqual(new Set(['越秀区','荔湾区','海珠区','天河区','白云区','黄埔区','番禺区','南沙区','花都区','增城区','从化区']));
  });
});
```

- [ ] **Step 2: Confirm the count test fails against V1**

Run: `npm test -- --run src/data/evergreen/index.test.ts`  
Expected: FAIL because the split pool does not exist and V1 has 61 records.

- [ ] **Step 3: Add the source registry and split the existing records**

```ts
export const evergreenReferences = {
  gzPublicCulture: { name: '广州市公共文化设施公开信息', url: 'https://www.gz.gov.cn/', verifiedAt: '2026-08-30' },
  gzParks: { name: '广州市林业和园林局公开信息', url: 'https://lyylj.gz.gov.cn/', verifiedAt: '2026-08-30' },
  gzCultureTourism: { name: '广州市文化广电旅游局', url: 'https://wglj.gz.gov.cn/', verifiedAt: '2026-08-30' },
} as const;
```

Move every V1 record to the matching category file without changing IDs, then update `src/data/activities.ts` to export `evergreenActivities` as `activities` for compatibility.

- [ ] **Step 4: Add verified records until the pool is 180–220**

Create stable venue, public-space, district-route, park, museum, cultural-facility, food-street, sport, night-walk and generic experience entries across all eleven districts. Each record must include a source-backed location, explicit `priceStatus`, conservative budget, transit guidance and a non-temporary activity description. Do not add specific private restaurants, undated performances, invented markets, or uncertain operating venues.

- [ ] **Step 5: Run quality tests and TypeScript**

Run: `npm test -- --run src/data/evergreen/index.test.ts && npm run build`  
Expected: PASS with 180–220 unique records and all eleven districts.

- [ ] **Step 6: Commit the verified evergreen pool**

```bash
git add src/data/evergreen src/data/activities.ts
git commit -m "feat: expand verified Guangzhou evergreen pool"
```

### Task 3: Implement filtering and ten-candidate random modes

**Files:**
- Create: `src/utils/activityPool.ts`
- Create: `src/utils/activityPool.test.ts`
- Modify: `src/utils/random.ts`
- Modify: `src/hooks/useWheel.ts`
- Modify: `src/hooks/useWheel.test.tsx`

- [ ] **Step 1: Write failing sampling and filtering tests**

```ts
it('samples four live and six evergreen items in fresh mode when available', () => {
  const result = sampleCandidates(pool, { mode: 'fresh', count: 10, recentCandidateIds: [], recentSelectedIds: [], random: seededRandom(7) });
  expect(result).toHaveLength(10);
  expect(result.filter((item) => item.live)).toHaveLength(4);
  expect(new Set(result.map((item) => item.id)).size).toBe(10);
});

it('excludes unknown prices under a strict budget', () => {
  expect(filterActivityPool(pool, { maxBudget: 100 }).every((item) => item.priceStatus !== 'unknown')).toBe(true);
});

it('avoids the last three selected results when alternatives exist', () => {
  expect(sampleCandidates(pool, options).some((item) => options.recentSelectedIds.includes(item.id))).toBe(false);
});
```

- [ ] **Step 2: Confirm focused tests fail**

Run: `npm test -- --run src/utils/activityPool.test.ts src/hooks/useWheel.test.tsx`  
Expected: FAIL because the new functions and reroll state do not exist.

- [ ] **Step 3: Implement explicit filters and sampling**

```ts
export interface ActivityFilters {
  categories: ReadonlySet<ActivityCategory>;
  maxBudget: number | null;
  environment: EnvironmentPreference | null;
  districts: ReadonlySet<string>;
  time: 'short' | 'half-day' | 'full-day' | 'evening' | null;
  states: ReadonlySet<string>;
}

export function sampleCandidates(items: Activity[], options: SampleOptions): Activity[] {
  const available = relaxRecentIds(items, options.recentCandidateIds, options.recentSelectedIds, options.count);
  if (options.mode === 'fate') return shuffle(available, options.random).slice(0, options.count);
  const live = shuffle(available.filter((item) => item.live), options.random).slice(0, 4);
  const evergreen = shuffle(available.filter((item) => !item.live), options.random).slice(0, 6);
  const chosen = [...live, ...evergreen];
  const chosenIds = new Set(chosen.map((item) => item.id));
  return shuffle([...chosen, ...available.filter((item) => !chosenIds.has(item.id))], options.random).slice(0, options.count);
}
```

- [ ] **Step 4: Upgrade `useWheel`**

Expose `reroll`, `mode`, `setMode`, `recentCandidateIds`, and `recentSelectedIds`; lock the exact ten visible candidates during a spin; choose `selectedIndex` uniformly from those candidates; keep two rounds of candidate IDs and three result IDs; make reroll a no-op while spinning.

- [ ] **Step 5: Run focused and regression tests**

Run: `npm test -- --run src/utils/activityPool.test.ts src/hooks/useWheel.test.tsx src/components/Wheel.test.tsx`  
Expected: PASS with ten unique candidates and result/index consistency.

- [ ] **Step 6: Commit the random engine**

```bash
git add src/utils/activityPool.ts src/utils/activityPool.test.ts src/utils/random.ts src/hooks/useWheel.ts src/hooks/useWheel.test.tsx
git commit -m "feat: add ten-choice random modes"
```

### Task 4: Build pure live-data normalization and fallback logic

**Files:**
- Create: `src/utils/date.ts`
- Create: `src/utils/date.test.ts`
- Create: `scripts/sync-activities/{types,normalize,validate,deduplicate,expire,fallback}.ts`
- Create: `scripts/sync-activities/pipeline.test.ts`

- [ ] **Step 1: Write failing date and pipeline tests**

```ts
it.each([
  ['2026-08-31T10:00:00+08:00', undefined, false],
  ['2026-08-29T10:00:00+08:00', '2026-08-30T18:00:00+08:00', false],
  ['2026-08-28T10:00:00+08:00', '2026-08-28T18:00:00+08:00', true],
])('classifies expiry in Guangzhou time', (start, end, expired) => {
  expect(isExpired({ eventStart: start, eventEnd: end }, now)).toBe(expired);
});

it('keeps the previous snapshot after multiple failures and a >70% drop', () => {
  expect(selectSnapshot({ previous: makeLive(50), current: makeLive(8), failedSources: 2 })).toEqual(expect.objectContaining({ usedFallback: true, activities: expect.any(Array) }));
});
```

- [ ] **Step 2: Confirm tests fail**

Run: `npm test -- --run src/utils/date.test.ts scripts/sync-activities/pipeline.test.ts`  
Expected: FAIL because live pipeline modules do not exist.

- [ ] **Step 3: Implement normalization, validation, expiry and fingerprints**

Normalize whitespace/full-width punctuation, require parseable ISO dates and non-empty venue/source URL, compute SHA-1 from normalized title + venue + Guangzhou calendar date, remove duplicates by fingerprint, and derive `upcoming`/`ongoing`. Keep price unknown unless source text explicitly declares free or a numeric range.

- [ ] **Step 4: Implement snapshot selection**

```ts
export function selectSnapshot(input: SnapshotInput): SnapshotDecision {
  const suspiciousDrop = input.previous.length > 0 && input.current.length < input.previous.length * 0.3;
  if (input.failedSources >= 2 && suspiciousDrop) {
    return { activities: input.previous, usedFallback: true, warning: 'multiple source failures with >70% drop' };
  }
  if (input.current.length === 0 && input.previous.length > 0) {
    return { activities: input.previous, usedFallback: true, warning: 'all current records unavailable' };
  }
  return { activities: input.current, usedFallback: false };
}
```

- [ ] **Step 5: Run focused tests**

Run: `npm test -- --run src/utils/date.test.ts scripts/sync-activities/pipeline.test.ts`  
Expected: PASS for future, ongoing, expired, missing-end, duplicate, malformed and fallback cases.

- [ ] **Step 6: Commit the pure pipeline**

```bash
git add src/utils/date.ts src/utils/date.test.ts scripts/sync-activities
git commit -m "feat: add live activity normalization pipeline"
```

### Task 5: Add tested official source adapters

**Files:**
- Create: `scripts/sync-activities/sources/{gzLibrary,gzExhibition,gzCulturePerformances}.ts`
- Create: `scripts/sync-activities/sources/http.ts`
- Create: `scripts/sync-activities/sources/*.test.ts`
- Create: `scripts/sync-activities/__fixtures__/{gz-library,gz-exhibition,gz-culture-performances}.html`
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install parsing/runtime tooling**

Run: `npm install cheerio && npm install -D tsx`  
Expected: `cheerio` in dependencies and `tsx` in devDependencies.

- [ ] **Step 2: Save minimal official HTML fixtures and write failing parser tests**

Each fixture must retain only the smallest public markup needed to represent two valid records and one invalid/expired record. Tests assert exact normalized title, venue, dates, source name/URL, unknown/free price behavior and consumer-friendly exhibition filtering.

```ts
it('parses dated Guangzhou Library events and rejects missing venues', () => {
  const records = parseGzLibrary(fixture, fetchedAt);
  expect(records.map((item) => item.name)).toEqual(['羊城学堂：八月讲座之五', '科普广图：亲子爱牙健康阅读营']);
  expect(records.every((item) => item.sourceName === '广州图书馆')).toBe(true);
});
```

- [ ] **Step 3: Confirm all adapter tests fail**

Run: `npm test -- --run scripts/sync-activities/sources`  
Expected: FAIL because the parser exports do not exist.

- [ ] **Step 4: Implement parser/fetch separation**

Every adapter exports a pure `parse...` function accepting fixture text and a `fetch...` function using shared HTTP settings: product User-Agent, 12-second timeout, one retry, and no cookies. Guangzhou Library parses public event previews; exhibition parsing applies explicit consumer allow/deny patterns; culture-performance parsing uses only title, venue and dates from public permit tables and always sets `priceStatus: 'unknown'`.

- [ ] **Step 5: Run source tests without network**

Run: `npm test -- --run scripts/sync-activities/sources`  
Expected: PASS without external HTTP requests.

- [ ] **Step 6: Commit the source adapters**

```bash
git add package.json package-lock.json scripts/sync-activities/sources scripts/sync-activities/__fixtures__
git commit -m "feat: add official Guangzhou source adapters"
```

### Task 6: Wire the sync CLI and scheduled Pages workflow

**Files:**
- Create: `scripts/sync-activities/index.ts`
- Create: `scripts/sync-activities/index.test.ts`
- Create: `public/data/live-activities.json`
- Create: `public/data/sync-status.json`
- Modify: `package.json`
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write a failing orchestration test**

Inject fake adapters and previous-snapshot loading; assert one source failure does not discard successful sources, output JSON validates, status counts match, and the markdown summary reports fetched/invalid/expired/duplicate/final counts.

- [ ] **Step 2: Confirm orchestration test fails**

Run: `npm test -- --run scripts/sync-activities/index.test.ts`  
Expected: FAIL because `runSync` is absent.

- [ ] **Step 3: Implement injectable orchestration and CLI output**

Add scripts:

```json
{
  "sync:activities": "tsx scripts/sync-activities/index.ts",
  "sync:check": "tsx scripts/sync-activities/index.ts --validate-only"
}
```

`runSync` uses `Promise.allSettled`, downloads the current production JSON as the previous snapshot when available, applies the pure pipeline, writes stable pretty JSON, and appends markdown to `$GITHUB_STEP_SUMMARY` when present. The committed initial JSON files contain valid empty arrays/status so local and first deployment builds never 404.

- [ ] **Step 4: Update the workflow**

Add `schedule: [{ cron: '20 */6 * * *' }]` and `workflow_dispatch`. After `npm ci`, run `npm run sync:activities`, `npm run test:run`, `npm run lint`, and `npm run build`, then upload/deploy `dist`. Use `continue-on-error: false` for invalid generated JSON, while adapter-level failures remain handled inside the sync command.

- [ ] **Step 5: Verify CLI, tests, and build locally**

Run: `npm run sync:check && npm run test:run && npm run build`  
Expected: validation PASS and both `dist/data/*.json` files exist.

- [ ] **Step 6: Commit synchronization automation**

```bash
git add scripts/sync-activities/index.ts scripts/sync-activities/index.test.ts public/data package.json .github/workflows/deploy.yml
git commit -m "feat: schedule live activity synchronization"
```

### Task 7: Load and merge live data progressively in React

**Files:**
- Create: `src/hooks/useActivityPool.ts`
- Create: `src/hooks/useActivityPool.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/config/pages.test.ts`

- [ ] **Step 1: Write failing loading/fallback tests**

```tsx
it('uses BASE_URL and merges valid live records', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([liveActivity]))));
  const { result } = renderHook(() => useActivityPool(evergreen));
  await waitFor(() => expect(result.current.liveCount).toBe(1));
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/guangzhou-weekend-wheel/data/live-activities.json'), expect.any(Object));
});

it('keeps evergreen activities after fetch or parse failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  const { result } = renderHook(() => useActivityPool(evergreen));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.activities).toEqual(evergreen);
});
```

- [ ] **Step 2: Confirm tests fail**

Run: `npm test -- --run src/hooks/useActivityPool.test.tsx src/config/pages.test.ts`  
Expected: FAIL because the hook and data URL helper are absent.

- [ ] **Step 3: Implement abortable background loading**

Load activity and status JSON concurrently with `AbortController`, validate every live record before merge, warn to console on failure without exposing an error modal, and abort on unmount. Return `activities`, `liveCount`, `evergreenCount`, `syncStatus`, and `loading`.

- [ ] **Step 4: Connect `App` to the combined pool**

Replace direct use of the static array with `useActivityPool(activities)`, then run filtering and `useWheel` against the merged pool. Favorites resolve IDs across the combined pool while retaining the same storage key.

- [ ] **Step 5: Run focused and regression tests**

Run: `npm test -- --run src/hooks/useActivityPool.test.tsx src/App.test.tsx src/hooks/useFavorites.test.tsx`  
Expected: PASS for successful load, invalid JSON, 404/offline and old favorites.

- [ ] **Step 6: Commit progressive loading**

```bash
git add src/hooks/useActivityPool.ts src/hooks/useActivityPool.test.tsx src/App.tsx src/config/pages.test.ts
git commit -m "feat: load live activities with static fallback"
```

### Task 8: Derive and install the Yuwan mascot system

**Files:**
- Create: `src/assets/yuwan/{core,states,categories,decorative}/**`
- Create: `src/constants/mascot.ts`
- Create: `src/constants/mascotMessages.ts`
- Create: `src/components/YuwanMascot.tsx`
- Create: `src/components/YuwanMascot.test.tsx`
- Remove: `src/assets/dogs/**`
- Remove: `src/components/DogMascot.tsx`

- [ ] **Step 1: Inventory the five supplied transparent PNG sheets**

Map exact supplied poses to `idle`, `think`, `search`, `run`, `spin`, `happy`, `point`, `rest`, `empty`, and `favorite`. Use the supplied pointing pose for Hero, map/search pose for pool feedback, dizzy pose for spin completion, ticket pose for result, and heart/rest poses for favorites and empty states.

- [ ] **Step 2: Produce independent cleaned assets from those poses**

Crop each pose to its alpha bounds; remove neighboring pose fragments and low-alpha shadow halos; flatten unnecessary gradients while retaining the supplied silhouette, face, proportions, expression and prop; normalize core canvases to a common viewBox/aspect family. Prefer traced SVG for simple core poses and optimized transparent PNG for complex prop poses. Do not draw a replacement silhouette and do not ship the original sheets.

- [ ] **Step 3: Write a failing mascot mapping test**

```tsx
it.each(['idle','think','search','run','spin','happy','point','rest','empty','favorite'] as const)('loads the %s Yuwan asset', (state) => {
  render(<YuwanMascot state={state} />);
  expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringMatching(/yuwan/));
});

it('falls back to idle for an unknown runtime state', () => {
  render(<YuwanMascot state={'missing' as never} />);
  expect(screen.getByRole('img')).toHaveAttribute('data-mascot-state', 'idle');
});
```

- [ ] **Step 4: Implement the central asset/message maps**

`mascot.ts` exports the exact state union and source map; `mascotMessages.ts` exports short messages by `default`, `filtered`, `searching`, `spinning`, `result`, `empty`, budget/date/solo states and spin-count easter eggs. `YuwanMascot` is the only component importing character assets.

- [ ] **Step 5: Run asset tests and inspect at 48, 72 and 120 CSS pixels**

Run: `npm test -- --run src/components/YuwanMascot.test.tsx && npm run build`  
Expected: PASS; no missing asset warnings; supplied character remains recognizable at all three sizes.

- [ ] **Step 6: Commit the reference-derived character system**

```bash
git add src/assets/yuwan src/constants src/components/YuwanMascot.tsx src/components/YuwanMascot.test.tsx
git rm -r src/assets/dogs src/components/DogMascot.tsx
git commit -m "feat: install user-supplied Yuwan character system"
```

### Task 9: Upgrade filters, mode controls, pool status, and wheel UI

**Files:**
- Create: `src/components/ActivityPoolStatus.tsx`
- Create: `src/components/ModeSwitch.tsx`
- Create: `src/components/ActivityPoolStatus.test.tsx`
- Modify: `src/components/FilterPanel.tsx`
- Modify: `src/components/FilterPanel.test.tsx`
- Modify: `src/components/Wheel.tsx`
- Modify: `src/components/Wheel.test.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing interaction tests**

Assert that type and budget are visible by default, extra filters start collapsed, opening them reveals district/time/state/environment controls, mode buttons expose `aria-pressed`, pool counts update after filtering, reroll changes `data-candidate-ids` without opening a result, and the wheel has ten labels.

- [ ] **Step 2: Confirm focused UI tests fail**

Run: `npm test -- --run src/components/FilterPanel.test.tsx src/components/ActivityPoolStatus.test.tsx src/components/Wheel.test.tsx`  
Expected: FAIL because V1 only supports six categories, four budgets, three filter dimensions and eight candidates.

- [ ] **Step 3: Implement the compact filter hierarchy**

Keep category and budget chips above the fold. Put state/companion, district, time and environment in an accessible `<details>` section labeled `再挑一点`. Preserve button text and `aria-pressed`; display a single reset action when any filter is active.

- [ ] **Step 4: Add pool and mode UI**

`ActivityPoolStatus` shows truthful evergreen/live/eligible/candidate counts and last sync freshness, paired with the supplied map/search Yuwan pose. `ModeSwitch` clearly labels `✨ 本周新鲜` and `🎲 纯命运` without implying personalized recommendations.

- [ ] **Step 5: Render ten readable wheel sectors and reroll**

Extend the palette to ten soft colors, render emoji plus bounded `shortName`, keep the fixed pointer, add a paw/jelly press state, and expose a separate `🔀 换一批` button. Use the supplied dizzy/run Yuwan states without covering labels.

- [ ] **Step 6: Run focused UI tests**

Run: `npm test -- --run src/components/FilterPanel.test.tsx src/components/ActivityPoolStatus.test.tsx src/components/Wheel.test.tsx src/App.test.tsx`  
Expected: PASS with ten candidates and accessible collapsed filters.

- [ ] **Step 7: Commit the primary V2 UI**

```bash
git add src/components src/App.tsx
git commit -m "feat: build Yuwan V2 wheel controls"
```

### Task 10: Rebuild the result ticket and remove sharing completely

**Files:**
- Modify: `src/components/ResultSheet.tsx`
- Modify: `src/components/ResultSheet.test.tsx`
- Modify: `src/components/FavoritesSheet.tsx`
- Modify: `src/App.tsx`
- Remove: `src/components/ShareButton.tsx`
- Modify: `src/styles.css`
- Modify: `e2e/weekend-wheel.spec.ts`

- [ ] **Step 1: Write failing removal/result tests**

```tsx
it('shows only travel, retry, favorite, map and official actions', () => {
  render(<ResultSheet activity={liveActivity} {...handlers} />);
  expect(screen.queryByRole('button', { name: /分享|复制|下载/ })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: '查看官方详情' })).toHaveAttribute('href', liveActivity.sourceUrl);
  expect(screen.getByRole('link', { name: '去地图看看' })).toBeInTheDocument();
});
```

Add a source scan test that reads `src/` and rejects `navigator.share`, `navigator.clipboard`, `ShareButton`, and share/copy result labels.

- [ ] **Step 2: Confirm tests fail against V1**

Run: `npm test -- --run src/components/ResultSheet.test.tsx src/App.test.tsx`  
Expected: FAIL because `ShareButton` and clipboard/native share paths still exist.

- [ ] **Step 3: Remove sharing and rebuild the weekend-pass card**

Delete `ShareButton.tsx` and its imports/styles. Use the supplied ticket Yuwan pose; show live/ending-soon/free stickers only when data supports them; show district, price, duration, environment, Yuwan comment, source and disclaimer. Keep primary `🐾 就去这里`, secondary retry/favorite, separate Amap search, and official source links.

- [ ] **Step 4: Update favorites and retry behavior**

Use supplied rest/heart poses for empty and saved states. Retry closes the old result, samples/spins using the locked candidate rules, and does not lose a just-saved favorite.

- [ ] **Step 5: Run component and browser tests**

Run: `npm test -- --run src/components/ResultSheet.test.tsx src/hooks/useFavorites.test.tsx && npm run qa:e2e`  
Expected: PASS; no share/copy control or API call remains.

- [ ] **Step 6: Commit the result experience**

```bash
git add src/components/ResultSheet.tsx src/components/ResultSheet.test.tsx src/components/FavoritesSheet.tsx src/App.tsx src/styles.css e2e/weekend-wheel.spec.ts
git rm src/components/ShareButton.tsx
git commit -m "feat: deliver Yuwan weekend ticket results"
```

### Task 11: Complete visual polish and responsive browser QA

**Files:**
- Modify: `src/styles.css`
- Modify: `index.html`
- Modify: `public/favicon.svg`, `public/og-card.svg`, `public/og-card.png`
- Modify: `e2e/weekend-wheel.spec.ts`
- Create: `docs/v2-mobile.png`
- Create: `docs/v2-desktop.png`

- [ ] **Step 1: Update responsive assertions before CSS**

Make Playwright assert no horizontal overflow at 375×812, 390×844, 430×932 and 1440×900; ten candidate IDs; visible Hero Yuwan; collapsed extra filters; pool count; result ticket; favorite persistence; no share controls; and zero `pageerror`/unexpected console errors.

- [ ] **Step 2: Run E2E and capture the expected visual failures**

Run: `npm run qa:e2e`  
Expected: FAIL until layout selectors, assets and responsive styling match the new UI.

- [ ] **Step 3: Polish the visual system**

Use cream paper, sparse paw/bone/star/cloud/Guangzhou-tower doodles, rounded black outlines, small flat shadows, consistent chip/icon boxes, a dominant wheel, and a screenshot-worthy perforated weekend ticket. Keep the 375px first screen scannable; prevent mascots from covering labels; add hover/press/focus-visible states and reduced-motion rules.

- [ ] **Step 4: Inspect four real viewports and save screenshots**

Start production preview, inspect 375×812, 390×844, 430×932 and 1440×900, fix observed crowding or clipping, then save representative 390×844 and 1440×900 screenshots as `docs/v2-mobile.png` and `docs/v2-desktop.png`.

- [ ] **Step 5: Run full local quality gates**

Run: `npm run test:run && npm run lint && npm run build && npm run qa:e2e`  
Expected: all Vitest and Playwright tests PASS, lint exits 0, build exits 0.

- [ ] **Step 6: Commit visual QA**

```bash
git add src/styles.css index.html public docs/v2-mobile.png docs/v2-desktop.png e2e/weekend-wheel.spec.ts
git commit -m "fix: polish Yuwan mobile and desktop experience"
```

### Task 12: Document, publish, and verify production

**Files:**
- Modify: `README.md`
- Modify if production QA finds a defect: relevant source/test files only

- [ ] **Step 1: Update documentation**

Document V2 product features, Yuwan user-reference asset lineage, original/third-party boundary, evergreen maintenance, the three actually working official source adapters, `Official sources → Actions → normalize → validate → dedupe → deploy`, six-hour approximate update frequency, local scripts, source fixtures, fallback behavior, screenshots, and the disclaimer that live data is quasi-real-time and must be confirmed at the official source.

- [ ] **Step 2: Re-run verification before push**

Run: `npm run test:run && npm run lint && npm run build && npm run qa:e2e && git diff --check && git status --short`  
Expected: all checks PASS; only the intended README change is uncommitted.

- [ ] **Step 3: Commit documentation and push the feature branch**

```bash
git add README.md
git commit -m "docs: document Yuwan V2 live pipeline"
git push -u origin codex/v2-yuwan-live-activity
```

- [ ] **Step 4: Integrate to `main` and wait for Actions**

Because the user explicitly requested completion and deployment, merge the verified feature branch into `main`, push `main`, then monitor the latest `deploy.yml` run to a terminal success/failure state. Do not create another repository or change the Pages URL.

- [ ] **Step 5: Verify production resources and behavior**

Confirm status 200 for the production HTML, referenced JS, referenced CSS, `data/live-activities.json`, and `data/sync-status.json`. Run Playwright with `QA_BASE_URL=https://xiangyu2141480.github.io/guangzhou-weekend-wheel/` and verify filtering, two modes, reroll, wheel result/index match, favorite persistence, map/official links, live counts and no share controls or console errors.

- [ ] **Step 6: Report only measured results**

Report real Evergreen/Live/Combined counts, actual successful adapters and sync timestamp, Vitest/Playwright counts, TypeScript/ESLint/build results, repository/branch/commit, live URL, Actions run URL, screenshot paths, complete share removal, and only genuine remaining risks.

## Plan self-review

- **Spec coverage:** Tasks 1–3 cover the shared model, 180+ verified Evergreen records, all filters, ten-candidate sampling, two modes and duplicate reduction. Tasks 4–7 cover dates, validation, official adapters, snapshots, six-hour deployment, Pages base paths and static fallback. Tasks 8–11 cover the supplied-reference Yuwan system, role/icon boundaries, micro-interactions, result ticket, complete share removal, favorites, accessibility, screenshots and responsive QA. Task 12 covers documentation, GitHub integration, Actions monitoring and production verification.
- **Placeholder scan:** The plan contains no unresolved markers, cross-task shorthand, unspecified error-handling step or undefined public function used by a later task. Data expansion is constrained by exact record fields, approved content classes, count/district tests and prohibited record types.
- **Type consistency:** `Activity`, `ActivityFilters`, `RandomMode`, `LiveActivity`, `priceStatus`, `recentCandidateIds`, `recentSelectedIds`, `useActivityPool`, `sampleCandidates`, `YuwanMascot` and public JSON paths use the same names throughout all tasks.
- **Scope:** The plan is large but produces one tightly integrated V2 release around the shared activity model and existing single-page app. It does not introduce an independent backend or unrelated product subsystem.
