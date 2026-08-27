# Guangzhou Weekend Wheel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publicly deploy a mobile-first Guangzhou weekend decision wheel with original dog artwork, filters, favorites and sharing.

**Architecture:** A Vite React application keeps activity content, wheel selection math and browser persistence separate from presentational components. `App` composes stateful hooks and a responsive single-page UI; SVG owns all wheel rendering while a fixed pointer and calculated angle guarantee result consistency.

**Tech Stack:** React 18, TypeScript strict, Vite, CSS, Vitest, Testing Library, GitHub Actions, GitHub Pages.

---

## File structure

- `src/data/activities.ts`: activity type plus roughly 60 verified stable choices and their costs/transit guidance.
- `src/utils/random.ts`: pure filtering, candidate selection and wheel-angle functions.
- `src/utils/storage.ts`: JSON-safe LocalStorage adapter.
- `src/hooks/useWheel.ts`: spin lifecycle, duplicate avoidance and selected result state.
- `src/hooks/useFavorites.ts`: favorite ID state persisted to LocalStorage.
- `src/components/*.tsx`: small, accessible display and interaction units.
- `src/assets/dogs/*.svg`: original non-IP line-dog assets.
- `src/styles.css`: tokenized responsive hand-drawn visual system.
- `src/**/*.test.ts(x)`: unit and component tests.
- `.github/workflows/deploy.yml`: Pages pipeline.

### Task 1: Bootstrap the strict React test environment

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `index.html`, `.gitignore`
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/vite-env.d.ts`, `src/test/setup.ts`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write the failing application test**

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('shows the product name and primary spin action', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: '今天去哪汪？' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '开转！' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- --run src/App.test.tsx`  
Expected: FAIL because the project and `App` do not exist.

- [ ] **Step 3: Install only runtime and test dependencies**

Run: `npm create vite@latest . -- --template react-ts`, then install `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event` as development dependencies. Configure the `test` script as `vitest` and `test:run` as `vitest run`.

- [ ] **Step 4: Implement the smallest App shell**

```tsx
export default function App() {
  return <main><h1>今天去哪汪？</h1><button type="button" aria-label="开转！">开转！</button></main>;
}
```

Configure Vite test setup to import `@testing-library/jest-dom/vitest`, use `jsdom`, and set TypeScript `strict: true`.

- [ ] **Step 5: Verify green and commit**

Run: `npm run test:run`  
Expected: PASS.  
Commit: `git add package.json package-lock.json vite.config.ts tsconfig*.json index.html .gitignore src && git commit -m "chore: bootstrap weekend wheel app"`.

### Task 2: Create activity content and deterministic selection utilities

**Files:**
- Create: `src/data/activities.ts`, `src/utils/random.ts`
- Test: `src/utils/random.test.ts`

- [ ] **Step 1: Write failing selection tests**

```ts
import { activities } from '../data/activities';
import { filterActivities, getWheelCandidates, getTargetRotation } from './random';

test('filters outdoor activities under the requested budget', () => {
  expect(filterActivities(activities, new Set(['outdoor']), 50, 'outdoor').every(a => a.category === 'outdoor' && a.budget <= 50 && a.indoorOutdoor !== 'indoor')).toBe(true);
});
test('returns eight defined candidates when enough options match', () => {
  expect(getWheelCandidates(activities, null).every(Boolean)).toBe(true);
  expect(getWheelCandidates(activities, null)).toHaveLength(8);
});
test('places the selected sector away from boundaries under a top pointer', () => {
  expect(getTargetRotation(2, 8, 0)).toBeGreaterThan(1080);
});
```

- [ ] **Step 2: Run failing utility tests**

Run: `npm test -- --run src/utils/random.test.ts`  
Expected: FAIL because module exports are absent.

- [ ] **Step 3: Define data and pure algorithms**

Create `Activity` with `id`, `name`, `shortName`, `category`, `district`, `budget`, `budgetLabel`, `duration`, `indoorOutdoor`, `tags`, `emoji`, `reason`, `tip`, `mapKeyword`, `transport`, and optional `dynamic` fields. Populate about 60 non-duplicative entries across six categories and Guangzhou districts; include only stable venues/routes, use scene-level records for dynamic shows/markets, and provide reference cost plus public-transit advice for every entry.

Implement `filterActivities(items, categoryIds, maxBudget, environment)`, `getWheelCandidates(items, lastId)` (shuffle and select 8, avoiding `lastId` when alternatives exist), `pickIndex(length)`, and `getTargetRotation(index, total, currentRotation)` (minimum three full turns and sector-centre alignment).

- [ ] **Step 4: Verify green and commit**

Run: `npm run test:run`  
Expected: PASS.  
Commit: `git add src/data/activities.ts src/utils/random.ts src/utils/random.test.ts && git commit -m "feat: add Guangzhou activity selection data"`.

### Task 3: Add persistence hooks and their tests

**Files:**
- Create: `src/utils/storage.ts`, `src/hooks/useFavorites.ts`, `src/hooks/useWheel.ts`
- Test: `src/utils/storage.test.ts`, `src/hooks/useFavorites.test.tsx`, `src/hooks/useWheel.test.tsx`

- [ ] **Step 1: Write failing persistence tests**

```tsx
test('persists and removes favorite activity IDs', () => {
  saveFavorites(['haizhu-wetland']);
  expect(loadFavorites()).toEqual(['haizhu-wetland']);
  removeFavorite('haizhu-wetland');
  expect(loadFavorites()).toEqual([]);
});
```

- [ ] **Step 2: Run tests and verify red**

Run: `npm test -- --run src/utils/storage.test.ts src/hooks/useFavorites.test.tsx src/hooks/useWheel.test.tsx`  
Expected: FAIL because storage and hooks are absent.

- [ ] **Step 3: Implement minimal browser-state boundaries**

`storage.ts` must catch unavailable/corrupt storage, use `gzww:favorites`, return an empty string array for invalid JSON, and expose save/load/remove helpers. `useFavorites` toggles IDs through this adapter. `useWheel` derives candidates, records the true selected index before changing `isSpinning`, blocks calls while spinning, applies rotation after a timer, and exposes selected activity and retry count. Ensure cleanup of timers on unmount.

- [ ] **Step 4: Verify green and commit**

Run: `npm run test:run`  
Expected: PASS.  
Commit: `git add src/utils/storage.ts src/hooks src/**/*.test.* && git commit -m "feat: add wheel and favorites state"`.

### Task 4: Build original dog assets and primary UI

**Files:**
- Create: `src/assets/dogs/{rest,happy,think,spin,point,sign,eat,walk}.svg`
- Create: `src/components/{Header,DogMascot,FilterPanel,Wheel,ResultSheet,FavoritesSheet,ShareButton,Confetti}.tsx`
- Modify: `src/App.tsx`, `src/styles.css`
- Test: `src/components/FilterPanel.test.tsx`, `src/components/Wheel.test.tsx`, `src/components/ResultSheet.test.tsx`, `src/App.test.tsx`

- [ ] **Step 1: Write failing UI tests**

```tsx
test('opens the matching result after a spin and prevents a second spin', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: '开转！' }));
  expect(screen.getByRole('button', { name: '命运选择中……' })).toBeDisabled();
  await waitFor(() => expect(screen.getByText('命运决定了！')).toBeInTheDocument(), { timeout: 5500 });
});
test('shows the empty state and clears restrictive filters', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: '¥50以内' }));
  await userEvent.click(screen.getByRole('button', { name: '想待室内' }));
  expect(screen.getByRole('button', { name: '放宽一点条件' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run UI tests and verify red**

Run: `npm test -- --run src/components src/App.test.tsx`  
Expected: FAIL because the interaction components do not exist.

- [ ] **Step 3: Implement accessible hand-drawn interface**

Create original monochrome SVG dogs with no third-party IP. Render one with an `img` and meaningful alt text. Use chip buttons with `aria-pressed`, an SVG wheel made of path sectors, a fixed hand-drawn pointer, and a center spin button. Bind SVG rotation to `useWheel`; selected labels must come from the same candidate array that selected the result. Build a semantic `role="dialog"` result sheet with transit, cost, reason, tip, dynamic warning, favorite and retry controls. Add a favorite drawer and share native-or-clipboard fallback. Use CSS custom properties, short mobile typography, max width 600px, gentle shadows and media queries for 375/390/430px and reduced motion.

- [ ] **Step 4: Verify green and commit**

Run: `npm run test:run && npm run build`  
Expected: all tests PASS and Vite build succeeds.  
Commit: `git add src && git commit -m "feat: build cute Guangzhou wheel experience"`.

### Task 5: Add metadata, documentation and GitHub Pages automation

**Files:**
- Modify: `index.html`, `vite.config.ts`, `README.md`, `.gitignore`
- Create: `.github/workflows/deploy.yml`
- Create: `docs/screenshot.png`

- [ ] **Step 1: Write failing deployment configuration test**

```ts
test('uses the GitHub Pages repository base path in production', async () => {
  const config = await import('../../vite.config');
  expect(config.default({ command: 'build', mode: 'production' }).base).toBe('/guangzhou-weekend-wheel/');
});
```

- [ ] **Step 2: Run and verify red**

Run: `npm test -- --run src/config/pages.test.ts`  
Expected: FAIL until the Vite production base is configured.

- [ ] **Step 3: Implement deployable project metadata**

Set title, description, OG metadata, theme color and local dog favicon. Vite must use `/` in development and `/guangzhou-weekend-wheel/` for production. The Pages workflow triggers on `main`, checks out code, configures Pages, uses Node LTS with npm cache, runs `npm ci`, `npm run build`, uploads `dist`, and deploys. README must cover product, features, screenshot location, development, deployment, data maintenance, and original-asset notice. Exclude `node_modules`, `dist`, `.env*`, `.superpowers`, and caches.

- [ ] **Step 4: Verify green and commit**

Run: `npm run test:run && npm run build && git status --short`  
Expected: tests/build PASS; only intended uncommitted files before commit.  
Commit: `git add index.html vite.config.ts README.md .gitignore .github docs/screenshot.png src/config/pages.test.ts && git commit -m "chore: configure Pages deployment"`.

### Task 6: Visual QA, publish and verify live site

**Files:**
- Modify if needed: `src/styles.css`, component files, `README.md`

- [ ] **Step 1: Start the production preview**

Run: `npm run build && npm run preview -- --host 127.0.0.1`  
Expected: Vite reports a local preview URL.

- [ ] **Step 2: Inspect actual browser behavior**

Use browser inspection at 375px, 390px, 430px and desktop. Spin multiple times; check pointer/result agreement, chip filtering, empty state/reset, reduced-motion CSS, result sheet, favorites after refresh and share fallback. Fix only observed issues and repeat the exact checks.

- [ ] **Step 3: Create and push a public repository**

Run: `gh auth status`, then `gh repo create guangzhou-weekend-wheel --public --source . --remote origin --push`. If name conflict occurs, create `guangzhou-weekend-wheel-app` and change Vite base plus workflow-facing README URL accordingly. Rename default branch to `main` before push if necessary.

- [ ] **Step 4: Verify Pages deployment and live assets**

Run: `gh run list --workflow deploy.yml --limit 1`, wait for success, then `gh api repos/{owner}/{repo}/pages`. Open the returned Pages URL and browser-check a JS/CSS asset plus the mobile viewport. Record repository and live URLs in README if they differ from expected.

- [ ] **Step 5: Final verification and commit**

Run: `npm run test:run && npm run build && git status --short`  
Expected: tests PASS, build PASS and clean tracked worktree. Commit any visual-QA fixes with `fix: polish mobile wheel experience` before the final push.

## Plan self-review

- Spec coverage: Tasks 1–4 cover strict app, original dogs, SVG spin, responsive filters, result sheet, persistence, sharing, empty state, dynamic notices and motion; Task 2 covers about 60 activities, budget and transit; Tasks 5–6 cover metadata, README, automation and live verification.
- Placeholder scan: no TBD/TODO or undefined implementation task remains.
- Type consistency: `Activity`, filtering parameters, candidate items, selected activity and persistent favorite IDs use the same identifiers across data, utilities, hooks and UI.
