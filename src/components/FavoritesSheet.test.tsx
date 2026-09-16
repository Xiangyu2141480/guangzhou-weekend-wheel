import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { activities } from '../data/activities';
import { FavoritesSheet } from './FavoritesSheet';

test('uses the supplied rest pose for an empty list and heart pose for saved items', () => {
  const { rerender } = render(<FavoritesSheet activities={[]} onRemove={vi.fn()} onClose={vi.fn()} />);
  expect(screen.getByRole('img', { name: '趴着等待收藏的鱼丸' })).toHaveAttribute('data-mascot-state', 'rest');

  rerender(<FavoritesSheet activities={[activities[0]]} onRemove={vi.fn()} onClose={vi.fn()} />);
  expect(screen.getByRole('img', { name: '抱着爱心看收藏的鱼丸' })).toHaveAttribute('data-mascot-state', 'favorite');
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
            activities={[activities[0]]}
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
  await user.tab({ shift: true });
  expect(screen.getByRole('button', { name: `删除收藏：${activities[0].name}` })).toHaveFocus();
  await user.tab();
  expect(closeButton).toHaveFocus();

  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
});
