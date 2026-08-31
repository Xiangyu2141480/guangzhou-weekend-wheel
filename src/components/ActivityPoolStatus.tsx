import { YuwanMascot } from './YuwanMascot';

interface ActivityPoolStatusProps {
  evergreenCount: number;
  liveCount: number;
  eligibleCount: number;
  candidateCount: number;
  loading: boolean;
  generatedAt: string | null;
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
}: ActivityPoolStatusProps) {
  return (
    <aside className={`pool-status ${loading ? 'is-loading' : ''}`} aria-live="polite">
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
        <small>{formatFreshness(generatedAt)}</small>
      </div>
    </aside>
  );
}
