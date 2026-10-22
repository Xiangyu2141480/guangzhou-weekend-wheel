import { PLAY_PRESETS, type PlayPresetId } from '../utils/playPresets';
import '../playful.css';

interface QuickPlayProps {
  disabled: boolean;
  onSelect: (id: PlayPresetId) => void;
}

export function QuickPlay({ disabled, onSelect }: QuickPlayProps) {
  return (
    <section className="quick-play" aria-label="今日玩法">
      <div className="filter-heading">
        <div><span className="step-dot" aria-hidden="true">✦</span><h2>今日玩法</h2></div>
        <small>点一下，换种周末</small>
      </div>
      <div className="chip-row compact">
        {PLAY_PRESETS.map((preset) => (
          <button
            className="chip"
            type="button"
            key={preset.id}
            aria-label={preset.label}
            disabled={disabled}
            onClick={() => onSelect(preset.id)}
          >
            <span aria-hidden="true">{preset.emoji}</span> {preset.label}
          </button>
        ))}
      </div>
    </section>
  );
}
