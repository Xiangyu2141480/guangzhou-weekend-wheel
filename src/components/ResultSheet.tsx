import type { Activity, LiveActivity } from '../data/types';
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap';
import { YuwanMascot } from './YuwanMascot';

interface ResultSheetProps {
  activity: Activity;
  isFavorite: boolean;
  onFavorite: () => void;
  onRetry: () => void;
  onClose: () => void;
}

const environmentLabels = { indoor: '室内', outdoor: '户外', mixed: '室内外皆可' };
const endingSoonWindow = 72 * 60 * 60 * 1000;

function isEndingSoon(activity: LiveActivity): boolean {
  if (!activity.eventEnd) return false;
  const remaining = new Date(activity.eventEnd).getTime() - Date.now();
  return remaining > 0 && remaining <= endingSoonWindow;
}

function formatEventDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  }).format(date);
}

function getEventSchedule(activity: LiveActivity): string {
  const start = formatEventDate(activity.eventStart);
  if (!activity.eventEnd) return start;
  return `${start} — ${formatEventDate(activity.eventEnd)}`;
}

export function ResultSheet({ activity, isFavorite, onFavorite, onRetry, onClose }: ResultSheetProps) {
  const mapUrl = `https://uri.amap.com/search?keyword=${encodeURIComponent(activity.mapKeyword)}`;
  const endingSoon = activity.live && isEndingSoon(activity);
  const dialogRef = useDialogFocusTrap<HTMLElement>(onClose);

  return (
    <div className="sheet-backdrop" data-modal-backdrop onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        ref={dialogRef}
        className="result-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-sheet-title"
        aria-describedby="result-sheet-description result-sheet-source"
        data-activity-id={activity.id}
        tabIndex={-1}
      >
        <button className="sheet-close" type="button" aria-label="关闭结果" onClick={onClose}>×</button>

        <div className="ticket-topline" aria-hidden="true"><span>GUANGZHOU</span><b>WEEKEND PASS</b><span>NO. {activity.id.slice(0, 6).toUpperCase()}</span></div>
        <div className="ticket-stickers" aria-label="活动标签">
          {activity.live && <span className="sticker sticker-live">本周限定</span>}
          {endingSoon && <span className="sticker sticker-ending">快结束了</span>}
          {activity.priceStatus === 'free' && <span className="sticker sticker-free">免费</span>}
        </div>
        <div className="result-dog"><YuwanMascot state="ticket" alt="举着周末票根的鱼丸" size="lg" /></div>
        <p className="result-kicker" id="result-sheet-title"><span aria-hidden="true">🐾 </span>命运决定了！</p>
        <h2>{activity.name}！</h2>
        <p className="result-venue" id="result-sheet-description">{activity.emoji} {activity.venue}</p>

        {activity.live && <p className="event-schedule"><span aria-hidden="true">📅</span> {getEventSchedule(activity)}</p>}

        <div className="result-meta">
          <span>📍 {activity.district}</span>
          <span>💰 <b>{activity.budgetLabel}</b></span>
          <span>⏰ {activity.duration}</span>
          <span>🌤 {environmentLabels[activity.indoorOutdoor]}</span>
        </div>
        <div className="transit-note"><span aria-hidden="true">🚇</span><p>{activity.transport}</p></div>
        <blockquote><b>鱼丸说：</b>“{activity.reason}”</blockquote>
        {activity.tip && <p className="tip"><b>出发提醒：</b>{activity.tip}</p>}

        <div className="result-primary-actions">
          <a className="primary-button" aria-label="去地图看看" href={mapUrl} target="_blank" rel="noopener noreferrer">🐾 就去这里</a>
          {activity.live && (
            <a className="official-link" aria-label="查看官方详情" href={activity.sourceUrl} target="_blank" rel="noopener noreferrer">
              查看官方详情 <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>

        <div className="result-actions">
          <button type="button" className="soft-button" aria-label="不服，再转一次" onClick={onRetry}>🔄 不服，再转一次</button>
          <button type="button" className="soft-button" aria-label={isFavorite ? '取消收藏这个地点' : '收藏这个地点'} aria-pressed={isFavorite} onClick={onFavorite}>{isFavorite ? '♥ 已收藏' : '♡ 收藏'}</button>
        </div>

        <p className="source-note" id="result-sheet-source">
          {activity.live ? `活动信息来自${activity.sourceName}，` : '常驻灵感库收录，'}
          费用、开放时间及交通可能变化，出发前请再次确认。
        </p>
      </section>
    </div>
  );
}
