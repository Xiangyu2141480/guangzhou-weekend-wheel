import type { Activity } from '../data/activities';
import { DogMascot } from './DogMascot';
import { ShareButton } from './ShareButton';

interface ResultSheetProps {
  activity: Activity;
  isFavorite: boolean;
  onFavorite: () => void;
  onRetry: () => void;
  onClose: () => void;
}

const environmentLabels = { indoor: '室内', outdoor: '户外', mixed: '室内外皆可' };

export function ResultSheet({ activity, isFavorite, onFavorite, onRetry, onClose }: ResultSheetProps) {
  return (
    <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="result-sheet" role="dialog" aria-modal="true" aria-label="命运决定了！" data-activity-id={activity.id}>
        <button className="sheet-close" type="button" aria-label="关闭结果" onClick={onClose}>×</button>
        <div className="result-dog"><DogMascot state={activity.category === 'food' ? 'eat' : 'point'} alt="开心指向结果的原创线稿小狗" /></div>
        <p className="result-kicker">🐾 命运决定了！</p>
        <h2>{activity.name}！</h2>
        <div className="result-meta">
          <span>📍 {activity.district}</span>
          <span>💰 <b>{activity.budgetLabel}</b></span>
          <span>⏰ {activity.duration}</span>
          <span>🌤 {environmentLabels[activity.indoorOutdoor]}</span>
        </div>
        <div className="transit-note"><span>🚇</span><p>{activity.transport}</p></div>
        <blockquote>“{activity.reason}”</blockquote>
        {activity.tip && <p className="tip"><b>小狗提醒：</b>{activity.tip}</p>}
        {activity.live && <p className="dynamic-note">具体场次或活动记得出发前确认当天安排哦。</p>}
        <a className="primary-button" href={`https://uri.amap.com/search?keyword=${encodeURIComponent(activity.mapKeyword)}`} target="_blank" rel="noreferrer">🐾 就去这里！</a>
        <div className="result-actions">
          <button type="button" className="soft-button" aria-label="不服，再转一次" onClick={onRetry}>🔄 不服，再转一次</button>
          <button type="button" className="soft-button" aria-label={isFavorite ? '取消收藏这个地点' : '收藏这个地点'} aria-pressed={isFavorite} onClick={onFavorite}>{isFavorite ? '♥ 已收藏' : '♡ 收藏'}</button>
          <ShareButton activity={activity} />
        </div>
      </section>
    </div>
  );
}
