# Playful Weekends Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for integration; independent content, loading and isolated UI components may be delegated under dispatching-parallel-agents.

**Goal:** 增加城市和活动，并以轻量互动、动态背景提升周末转盘的可玩性。
**Architecture:** 城市源数据构建为紧凑JSON，按城加载和缓存；UI通过现有筛选/结果流扩展，保留既有数据与来源协议。
**Tech Stack:** React 19 / TypeScript / Vite 8 / Vitest / Playwright / CSS。
**Spec:** docs/superpowers/specs/2026-10-22-playful-weekends-design.md

## Global Constraints

- 不提高既有370000 JS、22000 CSS、1900000图片预算，原有检查脚本不变。
- 既有357项活动、189条legacy映射和官方适配器语义不变。
- 新地区优先杭州、南京、成都、重庆；不使用聚合票务或编造实时数据。
- 不添加动画库、视频背景、个人数据或凭据。
- 所有异步状态、缓存、收藏与结果均按城市/活动隔离；减少动画设置生效。

## Review Focus

- 快速A→B→A切城时旧请求不能覆盖当前内容。
- 首次加载失败需可重试，已有同城缓存离线可用，非法或跨城缓存被拒绝。
- 收藏迁移加载期间的删除/新增操作不能被旧响应覆盖。
- 新情境产生空池时仍可重置；转盘期间不能变更候选。
- 背景暂停和系统减少动画都停止持续动画，不阻止键盘/触摸或降低文字对比度。

### Task 1: Compact selected-city content loader

Files: new codec/loader/build script and tests; useActivityPool/useFavorites/storage and tests; package build/dev hooks. Keep source evergreen index as server/build data entry.
Interfaces: useActivityPool retains existing return fields and adds error/retry if needed; useFavorites retains records/toggleFavorite/removeFavorite/isFavorite. App integration owned by root.
- [x] Test round-trip identity, malformed/cross-city inputs, cache, retry, stale responses and concurrent favorite migration (RED).
- [x] Generate compact city JSON and load only selected city; avoid source pools in runtime dependency graph.
- [x] Add JS+largest-city payload check against unchanged370000 threshold.
- [x] Run focused tests and production build (GREEN); report bytes and changed interfaces.

### Task 2: City/option expansion

Files: city registry, evergreen city modules/references/index tests; new official source adapters/fixtures, source registry/trusted hosts and snapshots/protocol tests.
Interfaces: existing getEvergreenActivities/getAllEvergreenActivities and CityConfig; preserve all old records and IDs.
- [x] Extend launch/data gate tests (RED).
- [x] Research official sources; add four cities with at least32 choices covering all8 categories, plus8 options per old city emphasizing new districts.
- [x] Add reviewed official adapters and minimal real-shape fixtures; publish honest evergreen-only bootstrap snapshots where appropriate.
- [x] Run test:data and sync:check (GREEN), report per-city counts, coverage and sources.

### Task 3: Isolated playful components

Files: new AmbientBackground, WeekendChallenge, QuickPlay components and tests; dedicated playful.css.
Interfaces: AmbientBackground({isSpinning?:boolean}); WeekendChallenge({activity:Activity}); QuickPlay({disabled:boolean,onSelect:(id:PlayPresetId)=>void}); exported presets use current filter types.
- [x] Write behavior tests for preferences/reduced-motion, challenge change/reset/completion and preset callbacks (RED).
- [x] Implement lightweight accessible components, keep existing Yuwan assets and aesthetic.
- [x] Run component tests (GREEN), report integration usage and CSS size.

### Task 4: Integration, full verification and delivery

Files: App.tsx/App.test.tsx, styles integration, e2e/helpers/spec, README/release docs.
- [x] Integrate quick presets, loading/retry, background and challenge; test end-to-end behavior (RED→GREEN).
- [x] Verify all old357 records remain unchanged, new-city gates and data isolation.
- [x] Run npm ci, sync:check, test:data, test:run, lint, build, budgets, production audit, E2E and diff checks.
- [x] Obtain independent branch review; correct material findings with regression evidence.
- [ ] After presenting concrete commits and results, obtain separate confirmation for Push and PR creation, then wait for CI and confirm the specific merge under the latest user AGENTS.md; verify Pages deployment and online behavior afterward.
