import { categories, type ActivityCategory, type EnvironmentPreference } from '../data/activities';

interface FilterPanelProps {
  categories: ReadonlySet<ActivityCategory>;
  budget: number | null;
  environment: EnvironmentPreference | null;
  onCategoryToggle: (category: ActivityCategory) => void;
  onBudgetChange: (budget: number | null) => void;
  onEnvironmentChange: (environment: EnvironmentPreference | null) => void;
  onReset: () => void;
}

const budgets = [50, 100, 200, 300];

export function FilterPanel({
  categories: selectedCategories,
  budget,
  environment,
  onCategoryToggle,
  onBudgetChange,
  onEnvironmentChange,
  onReset,
}: FilterPanelProps) {
  const hasFilters = selectedCategories.size > 0 || budget !== null || environment !== null;

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
            清空
          </button>
        )}
      </div>
      <div className="chip-row">
        {categories.map((category) => (
          <button
            className="chip"
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

      <details className="more-filters">
        <summary>再偷偷告诉小狗一点…</summary>
        <fieldset>
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
        <fieldset>
          <legend>天气心情</legend>
          <div className="chip-row compact">
            <button className="chip" type="button" aria-label="想出去走走" aria-pressed={environment === 'outdoor'} onClick={() => onEnvironmentChange(environment === 'outdoor' ? null : 'outdoor')}>☀️ 想出去走走</button>
            <button className="chip" type="button" aria-label="想待室内" aria-pressed={environment === 'indoor'} onClick={() => onEnvironmentChange(environment === 'indoor' ? null : 'indoor')}>🌧 想待室内</button>
          </div>
        </fieldset>
      </details>
    </section>
  );
}
