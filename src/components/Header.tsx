import { YuwanMascot } from './YuwanMascot';
import type { CityConfig } from '../data/cities';

interface HeaderProps {
  city: CityConfig;
  favoriteCount: number;
  citySwitchDisabled: boolean;
  onOpenCitySelector: () => void;
  onOpenFavorites: () => void;
}

export function Header({
  city,
  favoriteCount,
  citySwitchDisabled,
  onOpenCitySelector,
  onOpenFavorites,
}: HeaderProps) {
  return (
    <header className="app-header">
      <button
        className="city-trigger"
        type="button"
        aria-label={`当前城市：${city.name}，点击切换城市`}
        disabled={citySwitchDisabled}
        onClick={onOpenCitySelector}
      >
        <span aria-hidden="true">⌖</span>
        <span>当前城市：<b>{city.name}</b></span>
        <span aria-hidden="true">⌄</span>
      </button>
      <button
        className="favorites-trigger"
        type="button"
        aria-label={`我的收藏，共 ${favoriteCount} 个`}
        onClick={onOpenFavorites}
      >
        <span aria-hidden="true">♡</span>
        <span>我的收藏</span>
        {favoriteCount > 0 && <b>{favoriteCount}</b>}
      </button>
      <div className="header-copy">
        <span className="eyebrow">YUWAN'S WEEKEND GUIDE</span>
        <h1>今天去哪玩？</h1>
        <p className="subtitle">{city.name}周末随机转盘</p>
        <p className="header-note">不知道去哪玩？鱼丸替你抽一个。</p>
      </div>
      <div className="header-dog" aria-hidden="true">
        <YuwanMascot
          state="point"
          alt=""
          size="lg"
          loading="eager"
          fetchPriority="high"
        />
      </div>
    </header>
  );
}
