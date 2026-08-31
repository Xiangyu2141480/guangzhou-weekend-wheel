import type { RandomMode } from '../data/types';

interface ModeSwitchProps {
  mode: RandomMode;
  onChange: (mode: RandomMode) => void;
  disabled?: boolean;
}

const modes: ReadonlyArray<{
  id: RandomMode;
  label: string;
  emoji: string;
  description: string;
}> = [
  { id: 'fresh', label: '本周新鲜', emoji: '✨', description: '优先混入正在发生的活动' },
  { id: 'fate', label: '纯命运', emoji: '🎲', description: '从全部符合条件的去处随机抽取' },
];

export function ModeSwitch({ mode, onChange, disabled = false }: ModeSwitchProps) {
  return (
    <div className="mode-switch" role="group" aria-label="随机方式">
      {modes.map((item) => (
        <button
          key={item.id}
          className="mode-button"
          type="button"
          aria-label={item.label}
          aria-pressed={mode === item.id}
          aria-describedby={`mode-${item.id}-description`}
          disabled={disabled}
          onClick={() => onChange(item.id)}
        >
          <span aria-hidden="true">{item.emoji}</span>
          <b>{item.label}</b>
          <small id={`mode-${item.id}-description`}>{item.description}</small>
        </button>
      ))}
    </div>
  );
}
