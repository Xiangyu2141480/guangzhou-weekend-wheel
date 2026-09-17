import { useMemo, useState } from 'react';
import { Confetti } from './components/Confetti';
import { ActivityPoolStatus } from './components/ActivityPoolStatus';
import { YuwanMascot } from './components/YuwanMascot';
import { FavoritesSheet } from './components/FavoritesSheet';
import { FilterPanel } from './components/FilterPanel';
import { Header } from './components/Header';
import { ModeSwitch } from './components/ModeSwitch';
import { ResultSheet } from './components/ResultSheet';
import { Wheel } from './components/Wheel';
import {
  activities,
  type ActivityCategory,
  type EnvironmentPreference,
} from './data/activities';
import type { ActivityTimeTag } from './data/types';
import { useActivityPool } from './hooks/useActivityPool';
import { useFavorites } from './hooks/useFavorites';
import { useWheel } from './hooks/useWheel';
import type { YuwanState } from './constants/mascot';
import { filterActivityPool, type ActivityState } from './utils/activityPool';

function getEasterEgg(spinCount: number, history: ActivityCategory[]) {
  if (spinCount === 10) return '再转下去天都黑啦！！🐶';
  if (spinCount === 5) return '你是不是其实哪里都不想去？';
  if (history.length === 3 && history.every((category) => category === 'food')) {
    return '看来命运觉得你饿了。';
  }
  return null;
}

export default function App() {
  const [selectedCategories, setSelectedCategories] = useState<Set<ActivityCategory>>(new Set());
  const [budget, setBudget] = useState<number | null>(null);
  const [environment, setEnvironment] = useState<EnvironmentPreference | null>(null);
  const [districts, setDistricts] = useState<Set<string>>(new Set());
  const [time, setTime] = useState<ActivityTimeTag | null>(null);
  const [states, setStates] = useState<Set<ActivityState>>(new Set());
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const activityPool = useActivityPool(activities);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const availableDistricts = useMemo(
    () => [...new Set(activityPool.activities.map((activity) => activity.district))]
      .sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [activityPool.activities],
  );
  const filteredActivities = useMemo(
    () => filterActivityPool(activityPool.activities, {
      categories: selectedCategories,
      maxBudget: budget,
      environment,
      districts,
      time,
      states,
    }),
    [activityPool.activities, selectedCategories, budget, environment, districts, time, states],
  );
  const wheel = useWheel(filteredActivities, { reducedMotion });
  const favorites = useFavorites();
  const favoriteActivities = activityPool.activities.filter((activity) => favorites.favoriteIds.includes(activity.id));
  const easterEgg = getEasterEgg(wheel.spinCount, wheel.categoryHistory);
  const yuwanState: YuwanState = wheel.isSpinning
    ? 'spin'
    : wheel.selectedActivity
      ? 'happy'
      : selectedCategories.size > 0 || budget !== null || environment !== null ||
          districts.size > 0 || time !== null || states.size > 0
        ? 'think'
        : 'run';

  const toggleCategory = (category: ActivityCategory) => {
    setSelectedCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const toggleDistrict = (district: string) => {
    setDistricts((current) => {
      const next = new Set(current);
      if (next.has(district)) next.delete(district);
      else next.add(district);
      return next;
    });
  };

  const toggleState = (state: ActivityState) => {
    setStates((current) => {
      const next = new Set(current);
      if (next.has(state)) next.delete(state);
      else next.add(state);
      return next;
    });
  };

  const resetFilters = () => {
    setSelectedCategories(new Set());
    setBudget(null);
    setEnvironment(null);
    setDistricts(new Set());
    setTime(null);
    setStates(new Set());
  };

  const retry = () => {
    wheel.clearResult();
    wheel.spin();
  };

  return (
    <main
      className="app-shell"
      data-pool-loading={activityPool.loading}
      data-pool-availability={activityPool.availability}
      data-evergreen-count={activityPool.evergreenCount}
      data-live-count={activityPool.liveCount}
    >
      <div className="doodle doodle-one" aria-hidden="true">✿</div>
      <div className="doodle doodle-two" aria-hidden="true">★</div>
      <Header favoriteCount={favorites.favoriteIds.length} onOpenFavorites={() => setFavoritesOpen(true)} />

      <FilterPanel
        categories={selectedCategories}
        budget={budget}
        environment={environment}
        districts={districts}
        time={time}
        states={states}
        availableDistricts={availableDistricts}
        onCategoryToggle={toggleCategory}
        onBudgetChange={setBudget}
        onEnvironmentChange={setEnvironment}
        onDistrictToggle={toggleDistrict}
        onTimeChange={setTime}
        onStateToggle={toggleState}
        onReset={resetFilters}
        disabled={wheel.isSpinning}
      />

      <ActivityPoolStatus
        evergreenCount={activityPool.evergreenCount}
        liveCount={activityPool.liveCount}
        eligibleCount={filteredActivities.length}
        candidateCount={wheel.candidates.length}
        loading={activityPool.loading}
        generatedAt={activityPool.syncStatus?.generatedAt ?? null}
        availability={activityPool.availability}
      />

      <section className="wheel-note">
        <div className="wheel-title"><span className="step-dot">2</span><div><h2>交给鱼丸吧！</h2><p>{filteredActivities.length > 0 ? `从 ${filteredActivities.length} 个好去处里锁定本轮 ${wheel.candidates.length} 个` : '这个要求有点难倒鱼丸了……'}</p></div></div>
        <ModeSwitch mode={wheel.mode} onChange={wheel.setMode} disabled={wheel.isSpinning} />
        {filteredActivities.length > 0 ? (
          <>
            <Wheel candidates={wheel.candidates} rotation={wheel.rotation} duration={wheel.duration} selectedIndex={wheel.selectedIndex} isSpinning={wheel.isSpinning} onSpin={wheel.spin} onReroll={wheel.reroll} />
            <div className={`wheel-dog ${wheel.isSpinning ? 'is-spinning' : ''}`}><YuwanMascot state={yuwanState} alt={wheel.isSpinning ? '正在晕乎乎转圈的鱼丸' : '陪你决定周末去处的鱼丸'} /></div>
            <p className="spin-hint">{wheel.isSpinning ? '鱼丸正在努力读取命运…' : '按下去，就不许纠结啦'}</p>
          </>
        ) : (
          <div className="empty-state"><YuwanMascot state="empty" alt="被筛选条件难住的鱼丸" /><h3>这个要求有点难倒鱼丸了……</h3><p>放宽一点点，快乐就会多一点点。</p><button className="primary-button" type="button" aria-label="放宽一点条件" onClick={resetFilters}>放宽一点条件</button></div>
        )}
      </section>

      {easterEgg && <aside className="easter-egg" aria-live="polite">{easterEgg}</aside>}
      <footer><span>Made with 🐾 in Guangzhou</span><small>地点、费用及营业信息可能变化，出发前请再次确认。</small></footer>

      {wheel.selectedActivity && !wheel.isSpinning && (
        <>
          <Confetti />
          <ResultSheet
            activity={wheel.selectedActivity}
            isFavorite={favorites.isFavorite(wheel.selectedActivity.id)}
            onFavorite={() => favorites.toggleFavorite(wheel.selectedActivity!.id)}
            onRetry={retry}
            onClose={wheel.clearResult}
          />
        </>
      )}
      {favoritesOpen && <FavoritesSheet activities={favoriteActivities} onRemove={favorites.toggleFavorite} onClose={() => setFavoritesOpen(false)} />}
    </main>
  );
}
