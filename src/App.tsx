import { useMemo, useState } from 'react';
import { Confetti } from './components/Confetti';
import { YuwanMascot } from './components/YuwanMascot';
import { FavoritesSheet } from './components/FavoritesSheet';
import { FilterPanel } from './components/FilterPanel';
import { Header } from './components/Header';
import { ResultSheet } from './components/ResultSheet';
import { Wheel } from './components/Wheel';
import {
  activities,
  type ActivityCategory,
  type EnvironmentPreference,
} from './data/activities';
import { useActivityPool } from './hooks/useActivityPool';
import { useFavorites } from './hooks/useFavorites';
import { useWheel } from './hooks/useWheel';
import type { YuwanState } from './constants/mascot';
import { filterActivities } from './utils/random';

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
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const activityPool = useActivityPool(activities);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const filteredActivities = useMemo(
    () => filterActivities(activityPool.activities, selectedCategories, budget, environment),
    [activityPool.activities, selectedCategories, budget, environment],
  );
  const wheel = useWheel(filteredActivities, { reducedMotion });
  const favorites = useFavorites();
  const favoriteActivities = activityPool.activities.filter((activity) => favorites.favoriteIds.includes(activity.id));
  const easterEgg = getEasterEgg(wheel.spinCount, wheel.categoryHistory);
  const yuwanState: YuwanState = wheel.isSpinning
    ? 'spin'
    : wheel.selectedActivity
      ? 'happy'
      : selectedCategories.size > 0 || budget !== null || environment !== null
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

  const resetFilters = () => {
    setSelectedCategories(new Set());
    setBudget(null);
    setEnvironment(null);
  };

  const retry = () => {
    wheel.clearResult();
    wheel.spin();
  };

  return (
    <main
      className="app-shell"
      data-pool-loading={activityPool.loading}
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
        onCategoryToggle={toggleCategory}
        onBudgetChange={setBudget}
        onEnvironmentChange={setEnvironment}
        onReset={resetFilters}
      />

      <section className="wheel-note">
        <div className="wheel-title"><span className="step-dot">2</span><div><h2>交给命运吧！</h2><p>{filteredActivities.length > 0 ? `小狗从 ${filteredActivities.length} 个好去处里挑了 10 个` : '这个要求有点难倒小狗了……'}</p></div></div>
        {filteredActivities.length > 0 ? (
          <>
            <Wheel candidates={wheel.candidates} rotation={wheel.rotation} duration={wheel.duration} selectedIndex={wheel.selectedIndex} isSpinning={wheel.isSpinning} onSpin={wheel.spin} />
            <div className={`wheel-dog ${wheel.isSpinning ? 'is-spinning' : ''}`}><YuwanMascot state={yuwanState} alt={wheel.isSpinning ? '正在晕乎乎转圈的鱼丸' : '陪你决定周末去处的鱼丸'} /></div>
            <p className="spin-hint">{wheel.isSpinning ? '小狗正在努力读取命运…' : '按下去，就不许纠结啦'}</p>
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
