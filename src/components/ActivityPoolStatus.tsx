import { YuwanMascot } from './YuwanMascot';
import type { ActivityPoolAvailability } from '../hooks/useActivityPool';

interface ActivityPoolStatusProps {
  evergreenCount: number;
  liveCount: number;
  eligibleCount: number;
  candidateCount: number;
  loading: boolean;
  generatedAt: string | null;
  availability: ActivityPoolAvailability;
}

function formatFreshness(value: string | null): string {
  if (!value) return '等待本周活动更新';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '活动时间已重新核对';

  return `${new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  }).format(date)} 更新`;
}

export function ActivityPoolStatus({
  evergreenCount,
  liveCount,
  eligibleCount,
  candidateCount,
  loading,
  generatedAt,
  availability,
}: ActivityPoolStatusProps) {
  const availabilityLabel = {
    normal: '实时活动正常',
    degraded: '实时活动降级展示',
    'evergreen-only': '当前仅使用常驻灵感',
  }[availability];

  return (
    <aside
      className={`pool-status ${loading ? 'is-loading' : ''}`}
      data-availability={availability}
      aria-live="polite"
    >
      <div className="pool-mascot">
        <YuwanMascot
          state={loading ? 'search' : 'map'}
          alt={loading ? '正在搜索本周活动的鱼丸' : '拿着地图查看活动池的鱼丸'}
          size="md"
        />
      </div>
      <div className="pool-copy">
        {loading ? (
          <p>正在看看广州这周有什么新鲜事…</p>
        ) : (
          <div className="pool-totals">
            <span>{evergreenCount} 个常驻灵感</span>
            <span>{liveCount} 个本周活动</span>
          </div>
        )}
        <b>符合 {eligibleCount} 个 · 本轮 {candidateCount} 个</b>
        {!loading && <span className="pool-availability">{availabilityLabel}</span>}
        <small>{formatFreshness(generatedAt)}</small>
      </div>
    </aside>
  );
}
