import { useMemo, useState } from 'react';
import { getCityConfig, type CityId } from '../data/cities';
import type { FavoriteRecord } from '../data/types';
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap';
import { YuwanMascot } from './YuwanMascot';

interface FavoritesSheetProps {
  records: FavoriteRecord[];
  currentCityId: CityId;
  onRemove: (id: string) => void;
  onClose: () => void;
}

type FavoritesView = 'all' | 'current';

export function FavoritesSheet({
  records,
  currentCityId,
  onRemove,
  onClose,
}: FavoritesSheetProps) {
  const [view, setView] = useState<FavoritesView>('all');
  const visibleRecords = useMemo(
    () => view === 'all' ? records : records.filter((record) => record.cityId === currentCityId),
    [currentCityId, records, view],
  );
  const hasFavorites = records.length > 0;
  const currentCityName = getCityConfig(currentCityId).name;
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
          {hasFavorites ? `共 ${records.length} 个收藏地点。` : '收藏列表目前为空。'}
        </p>
        <div className="favorites-view-switch" role="group" aria-label="收藏城市范围">
          <button type="button" aria-pressed={view === 'all'} onClick={() => setView('all')}>
            全部城市
          </button>
          <button type="button" aria-pressed={view === 'current'} onClick={() => setView('current')}>
            当前城市 · {currentCityName}
          </button>
        </div>
        {visibleRecords.length === 0 ? <div className="favorites-empty"><p>{view === 'all' ? '这里还空空的汪。' : `${currentCityName}还没有收藏。`}</p><span>转到喜欢的地方，就把它留下来吧！</span></div> : (
          <ul className="favorites-list">
            {visibleRecords.map((record) => {
              const cityName = getCityConfig(record.cityId).name;
              const snapshot = record.snapshot;
              const displayName = snapshot?.name ?? '原广州收藏暂不可用';
              return (
                <li key={record.activityId}>
                  <span className="favorite-emoji">{snapshot?.emoji ?? '📍'}</span>
                  <div>
                    <span className="favorite-city">{cityName}</span>
                    <b>{snapshot?.shortName ?? displayName}</b>
                    <small>
                      {snapshot
                        ? `${snapshot.district} · ${snapshot.budgetLabel} · ${snapshot.venue}`
                        : `旧收藏 ID：${record.activityId}`}
                    </small>
                  </div>
                  <button
                    type="button"
                    aria-label={`删除收藏：${displayName}`}
                    onClick={() => onRemove(record.activityId)}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
