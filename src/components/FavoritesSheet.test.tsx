import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { activities } from '../data/activities';
import { getEvergreenActivities } from '../data/evergreen';
import type { FavoriteRecord } from '../data/types';
import { createFavoriteRecord } from '../utils/storage';
import { FavoritesSheet } from './FavoritesSheet';

test('uses the supplied rest pose for an empty list and heart pose for saved items', () => {
  const { rerender } = render(<FavoritesSheet records={[]} currentCityId="guangzhou" onRemove={vi.fn()} onClose={vi.fn()} />);
  expect(screen.getByRole('dialog', { name: '我的收藏' })).toHaveAttribute(
    'aria-describedby',
    'favorites-sheet-description',
  );
  expect(screen.getByText('收藏列表目前为空。')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: '趴着等待收藏的鱼丸' })).toHaveAttribute('data-mascot-state', 'rest');

  rerender(<FavoritesSheet records={[createFavoriteRecord(activities[0])]} currentCityId="guangzhou" onRemove={vi.fn()} onClose={vi.fn()} />);
  expect(screen.getByText('共 1 个收藏地点。')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: '抱着爱心看收藏的鱼丸' })).toHaveAttribute('data-mascot-state', 'favorite');
});

test('defaults to all cities, labels each city, and filters to the current city', async () => {
  const user = userEvent.setup();
  const guangzhou = activities[0];
  const shanghai = getEvergreenActivities('shanghai')[0];
  render(
    <FavoritesSheet
      records={[createFavoriteRecord(guangzhou), createFavoriteRecord(shanghai)]}
      currentCityId="shanghai"
      onRemove={vi.fn()}
      onClose={vi.fn()}
    />,
  );

  expect(screen.getByRole('button', { name: '全部城市' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText(guangzhou.shortName)).toBeInTheDocument();
  expect(screen.getByText(shanghai.shortName)).toBeInTheDocument();
  expect(screen.getByText('广州')).toBeInTheDocument();
  expect(screen.getByText('上海')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '当前城市 · 上海' }));
  expect(screen.queryByText(guangzhou.shortName)).not.toBeInTheDocument();
  expect(screen.getByText(shanghai.shortName)).toBeInTheDocument();
});

test('shows an unresolved Guangzhou migration record and allows deleting it', async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn();
  const unresolved: FavoriteRecord = {
    activityId: 'old-place',
    cityId: 'guangzhou',
    savedAt: null,
    snapshot: null,
  };
  render(
    <FavoritesSheet
      records={[unresolved]}
      currentCityId="shanghai"
      onRemove={onRemove}
      onClose={vi.fn()}
    />,
  );

  expect(screen.getByText('原广州收藏暂不可用')).toBeInTheDocument();
  expect(screen.getByText('旧收藏 ID：old-place')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '删除收藏：原广州收藏暂不可用' }));
  expect(onRemove).toHaveBeenCalledWith('old-place');
});

test('traps focus, closes on Escape and restores focus to the opener', async () => {
  const user = userEvent.setup();

  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>打开收藏</button>
        {open && (
          <FavoritesSheet
            records={[createFavoriteRecord(activities[0])]}
            currentCityId="guangzhou"
            onRemove={vi.fn()}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    );
  }

  render(<Harness />);
  const opener = screen.getByRole('button', { name: '打开收藏' });
  await user.click(opener);

  const closeButton = screen.getByRole('button', { name: '关闭收藏' });
  expect(closeButton).toHaveFocus();
  expect(opener).toHaveAttribute('inert');
  expect(document.body.style.overflow).toBe('hidden');
  await user.tab({ shift: true });
  expect(screen.getByRole('button', { name: `删除收藏：${activities[0].name}` })).toHaveFocus();
  await user.tab();
  expect(closeButton).toHaveFocus();

  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(opener).not.toHaveAttribute('inert');
  expect(document.body.style.overflow).toBe('');
  expect(opener).toHaveFocus();
});
