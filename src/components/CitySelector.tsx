import { CITY_CONFIGS, type CityId } from '../data/cities';
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap';

interface CitySelectorProps {
  currentCityId: CityId | null;
  initial: boolean;
  onSelect: (cityId: CityId) => void;
  onClose: () => void;
}

export function CitySelector({
  currentCityId,
  initial,
  onSelect,
  onClose,
}: CitySelectorProps) {
  const dialogRef = useDialogFocusTrap<HTMLElement>(
    onClose,
    initial ? undefined : '.city-trigger',
    !initial,
  );

  return (
    <div
      className="sheet-backdrop city-selector-backdrop"
      data-modal-backdrop
      onMouseDown={(event) => {
        if (!initial && event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="city-selector"
        role="dialog"
        aria-modal="true"
        aria-labelledby="city-selector-title"
        aria-describedby="city-selector-description"
        tabIndex={-1}
      >
        {!initial && (
          <button
            className="sheet-close"
            type="button"
            aria-label="关闭城市选择"
            onClick={onClose}
          >
            ×
          </button>
        )}
        <span className="city-selector-eyebrow">CHOOSE YOUR CITY</span>
        <h2 id="city-selector-title">{initial ? '先选一座城市' : '切换城市'}</h2>
        <p id="city-selector-description">
          {initial ? '选择后，鱼丸只推荐这座城市的去处。' : '切换后会清空当前筛选和抽取结果。'}
        </p>
        <div className="city-grid" aria-label="可选城市">
          {CITY_CONFIGS.filter((city) => city.enabled).map((city) => (
            <button
              className="city-card"
              key={city.id}
              type="button"
              aria-label={city.name}
              aria-pressed={city.id === currentCityId}
              onClick={() => onSelect(city.id)}
            >
              <strong>{city.name}</strong>
              <span>{city.englishName.toUpperCase()}</span>
              <small>常驻灵感与官方活动可用</small>
            </button>
          ))}
        </div>
        {initial && <small className="city-required-note">需要选择城市后才能开始</small>}
      </section>
    </div>
  );
}
