import type { Activity } from '../data/activities';

interface WheelProps {
  candidates: Activity[];
  rotation: number;
  duration: number;
  selectedIndex?: number;
  isSpinning: boolean;
  onSpin: () => void;
  onReroll: () => void;
}

const colors = [
  '#ffd978',
  '#ffc8d4',
  '#bfd8b8',
  '#bfddf5',
  '#f4c8a8',
  '#d6c7e8',
  '#f8e7a9',
  '#b9ddd0',
  '#ffd0ad',
  '#c8d6f0',
];

function pointOnCircle(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function sectorPath(index: number, total: number) {
  const angle = 360 / total;
  const start = pointOnCircle(160, 160, 147, index * angle);
  const end = pointOnCircle(160, 160, 147, (index + 1) * angle);
  return `M 160 160 L ${start.x} ${start.y} A 147 147 0 ${angle > 180 ? 1 : 0} 1 ${end.x} ${end.y} Z`;
}

export function Wheel({ candidates, rotation, duration, selectedIndex = -1, isSpinning, onSpin, onReroll }: WheelProps) {
  return (
    <section className="wheel-stage" aria-label="转盘区域" aria-describedby="wheel-candidates-title">
      <span className="wheel-scribble wheel-scribble-left" aria-hidden="true">✦</span>
      <span className="wheel-scribble wheel-scribble-right" aria-hidden="true">〰</span>
      <div className="wheel-pointer" aria-hidden="true"><span>🐾</span></div>
      <div className="wheel-frame">
        {candidates.length > 0 ? (
          <svg
            className="wheel-svg"
            viewBox="0 0 320 320"
            role="img"
            aria-label="广州周末随机转盘"
            data-candidate-ids={candidates.map((item) => item.id).join(',')}
            data-selected-index={selectedIndex}
            style={{ transform: `rotate(${rotation}deg)`, transitionDuration: `${duration}ms` }}
          >
            <circle cx="160" cy="160" r="154" fill="#fffdf8" stroke="#33302d" strokeWidth="5" />
            {candidates.map((candidate, index) => {
              const angle = 360 / candidates.length;
              const center = index * angle + angle / 2;
              const emojiPosition = pointOnCircle(160, 160, 119, center);
              const textPosition = pointOnCircle(160, 160, 94, center);
              return (
                <g key={candidate.id}>
                  <path d={sectorPath(index, candidates.length)} fill={colors[index % colors.length]} stroke="#33302d" strokeWidth="2.2" />
                  <g data-testid="wheel-label" data-upright="true">
                    <text x={emojiPosition.x} y={emojiPosition.y + 5} textAnchor="middle" fontSize="15">{candidate.emoji}</text>
                    <text x={textPosition.x} y={textPosition.y + 3} textAnchor="middle" fontSize="9.2" fontWeight="800">{candidate.shortName.slice(0, 4)}</text>
                  </g>
                </g>
              );
            })}
            <circle cx="160" cy="160" r="45" fill="#fff9f1" stroke="#33302d" strokeWidth="4" />
          </svg>
        ) : (
          <div className="wheel-placeholder" aria-hidden="true" />
        )}
        <button
          className="spin-button"
          type="button"
          aria-label={isSpinning ? '命运选择中……' : '开转！'}
          disabled={isSpinning || candidates.length === 0}
          onClick={onSpin}
        >
          <span>{isSpinning ? '转呀' : '开转!'}</span>
          <small>{isSpinning ? '命运选择中…' : 'PUSH'}</small>
        </button>
      </div>
      <button
        className="reroll-button"
        type="button"
        aria-label="换一批"
        disabled={isSpinning || candidates.length === 0}
        onClick={onReroll}
      >
        <span aria-hidden="true">🔀</span> 换一批
      </button>
      <div className="sr-only">
        <h3 id="wheel-candidates-title">本轮转盘候选，共 {candidates.length} 个</h3>
        <ol aria-label="本轮候选地点">
          {candidates.map((candidate, index) => (
            <li
              key={candidate.id}
              aria-current={!isSpinning && selectedIndex === index ? 'true' : undefined}
            >
              {candidate.name}，{candidate.district}，{candidate.budgetLabel}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
