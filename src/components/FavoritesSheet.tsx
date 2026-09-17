import type { Activity } from '../data/activities';
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap';
import { YuwanMascot } from './YuwanMascot';

interface FavoritesSheetProps {
  activities: Activity[];
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function FavoritesSheet({ activities, onRemove, onClose }: FavoritesSheetProps) {
  const hasFavorites = activities.length > 0;
  const dialogRef = useDialogFocusTrap<HTMLElement>(onClose);
  return (
    <div className="sheet-backdrop" data-modal-backdrop onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        ref={dialogRef}
        className="favorites-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorites-sheet-title"
        aria-describedby="favorites-sheet-description"
        tabIndex={-1}
      >
        <button className="sheet-close" type="button" aria-label="关闭收藏" onClick={onClose}>×</button>
        <div className="favorites-title"><YuwanMascot state={hasFavorites ? 'favorite' : 'rest'} alt={hasFavorites ? '抱着爱心看收藏的鱼丸' : '趴着等待收藏的鱼丸'} size="md" /><div><p>MY LITTLE LIST</p><h2 id="favorites-sheet-title">我的收藏</h2></div></div>
        <p className="sr-only" id="favorites-sheet-description">
          {hasFavorites ? `共 ${activities.length} 个收藏地点。` : '收藏列表目前为空。'}
        </p>
        {activities.length === 0 ? <div className="favorites-empty"><p>这里还空空的汪。</p><span>转到喜欢的地方，就把它留下来吧！</span></div> : (
          <ul className="favorites-list">
            {activities.map((activity) => <li key={activity.id}><span className="favorite-emoji">{activity.emoji}</span><div><b>{activity.shortName}</b><small>{activity.district} · {activity.budgetLabel}<br />{activity.transport}</small></div><button type="button" aria-label={`删除收藏：${activity.name}`} onClick={() => onRemove(activity.id)}>×</button></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
