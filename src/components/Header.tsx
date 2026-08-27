import { DogMascot } from './DogMascot';

interface HeaderProps {
  favoriteCount: number;
  onOpenFavorites: () => void;
}

export function Header({ favoriteCount, onOpenFavorites }: HeaderProps) {
  return (
    <header className="app-header">
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
        <span className="eyebrow">WEEKEND IN GUANGZHOU</span>
        <h1>今天去哪汪？</h1>
        <p className="subtitle">广州周末随机转盘</p>
        <p className="header-note">不知道去哪玩？交给命运吧。</p>
      </div>
      <div className="header-dog" aria-hidden="true">
        <DogMascot state="rest" alt="" />
      </div>
    </header>
  );
}
