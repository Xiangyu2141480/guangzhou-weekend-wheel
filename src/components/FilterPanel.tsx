import { categories } from '../data/activities';
import type {
  ActivityCategory,
  ActivityTimeTag,
  EnvironmentPreference,
} from '../data/types';
import type { ActivityState } from '../utils/activityPool';

interface FilterPanelProps {
  categories: ReadonlySet<ActivityCategory>;
  budget: number | null;
  environment: EnvironmentPreference | null;
  districts: ReadonlySet<string>;
  time: ActivityTimeTag | null;
  states: ReadonlySet<ActivityState>;
  availableDistricts: string[];
  onCategoryToggle: (category: ActivityCategory) => void;
  onBudgetChange: (budget: number | null) => void;
  onEnvironmentChange: (environment: EnvironmentPreference | null) => void;
  onDistrictToggle: (district: string) => void;
  onTimeChange: (time: ActivityTimeTag | null) => void;
  onStateToggle: (state: ActivityState) => void;
  onReset: () => void;
}

const budgets = [50, 100, 200, 300];

const stateOptions: ReadonlyArray<{ id: ActivityState; label: string; emoji: string }> = [
  { id: 'date', label: '约会一下', emoji: '💕' },
  { id: 'solo', label: '一个人放空', emoji: '☁️' },
  { id: 'friends', label: '和朋友热闹', emoji: '🙌' },
  { id: 'rest', label: '轻松回血', emoji: '🫧' },
  { id: 'active', label: '动起来', emoji: '⚡' },
  { id: 'photo', label: '拍照出片', emoji: '📷' },
  { id: 'food', label: '就想吃', emoji: '🥢' },
  { id: 'knowledge', label: '长点知识', emoji: '💡' },
  { id: 'night', label: '越夜越好玩', emoji: '🌃' },
  { id: 'free', label: '免费优先', emoji: '🪙' },
];

const timeOptions: ReadonlyArray<{ id: ActivityTimeTag; label: string }> = [
  { id: 'short', label: '一两个小时' },
  { id: 'half-day', label: '半天刚好' },
  { id: 'full-day', label: '玩一整天' },
  { id: 'evening', label: '晚上再出门' },
];

export function FilterPanel({
  categories: selectedCategories,
  budget,
  environment,
  districts,
  time,
  states,
  availableDistricts,
  onCategoryToggle,
  onBudgetChange,
  onEnvironmentChange,
  onDistrictToggle,
  onTimeChange,
  onStateToggle,
  onReset,
}: FilterPanelProps) {
  const hasFilters = selectedCategories.size > 0 || budget !== null || environment !== null ||
    districts.size > 0 || time !== null || states.size > 0;

  return (
    <section className="filter-note" aria-label="偏好筛选">
      <div className="tape tape-pink" aria-hidden="true" />
      <div className="filter-heading">
        <div>
          <span className="step-dot">1</span>
          <h2>今天想干嘛？</h2>
        </div>
        {hasFilters && (
          <button className="text-button" type="button" onClick={onReset} aria-label="清空全部筛选">
            全部清空
          </button>
        )}
      </div>

      <div className="chip-row category-chips">
        {categories.map((category) => (
          <button
            className="chip"
            data-testid="category-filter"
            type="button"
            key={category.id}
            aria-label={category.label}
            aria-pressed={selectedCategories.has(category.id)}
            onClick={() => onCategoryToggle(category.id)}
          >
            <span aria-hidden="true">{category.emoji}</span> {category.label}
          </button>
        ))}
      </div>

      <fieldset className="budget-filter">
        <legend>今天想花多少钱？</legend>
        <div className="chip-row compact">
          {budgets.map((amount) => (
            <button
              className="chip"
              type="button"
              key={amount}
              aria-label={`¥${amount}以内`}
              aria-pressed={budget === amount}
              onClick={() => onBudgetChange(budget === amount ? null : amount)}
            >
              ¥{amount}以内
            </button>
          ))}
        </div>
      </fieldset>

      <details className="more-filters">
        <summary>再挑一点</summary>
        <div className="more-filter-grid">
          <fieldset>
            <legend>现在是什么状态？</legend>
            <div className="chip-row compact">
              {stateOptions.map((state) => (
                <button
                  className="chip"
                  type="button"
                  key={state.id}
                  aria-label={state.label}
                  aria-pressed={states.has(state.id)}
                  onClick={() => onStateToggle(state.id)}
                >
                  <span aria-hidden="true">{state.emoji}</span> {state.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>想去哪个区？</legend>
            <div className="chip-row compact district-chips">
              {availableDistricts.map((district) => (
                <button
                  className="chip"
                  type="button"
                  key={district}
                  aria-label={district}
                  aria-pressed={districts.has(district)}
                  onClick={() => onDistrictToggle(district)}
                >
                  {district.replace(/区$/, '')}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>能玩多久？</legend>
            <div className="chip-row compact">
              {timeOptions.map((option) => (
                <button
                  className="chip"
                  type="button"
                  key={option.id}
                  aria-label={option.label}
                  aria-pressed={time === option.id}
                  onClick={() => onTimeChange(time === option.id ? null : option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>室内还是户外？</legend>
            <div className="chip-row compact">
              <button className="chip" type="button" aria-label="想出去走走" aria-pressed={environment === 'outdoor'} onClick={() => onEnvironmentChange(environment === 'outdoor' ? null : 'outdoor')}>☀️ 想出去走走</button>
              <button className="chip" type="button" aria-label="想待室内" aria-pressed={environment === 'indoor'} onClick={() => onEnvironmentChange(environment === 'indoor' ? null : 'indoor')}>🌧️ 想待室内</button>
            </div>
          </fieldset>
        </div>
      </details>
    </section>
  );
}
