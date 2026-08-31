import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { activities } from '../data/activities';
import { FavoritesSheet } from './FavoritesSheet';

test('uses the supplied rest pose for an empty list and heart pose for saved items', () => {
  const { rerender } = render(<FavoritesSheet activities={[]} onRemove={vi.fn()} onClose={vi.fn()} />);
  expect(screen.getByRole('img', { name: '趴着等待收藏的鱼丸' })).toHaveAttribute('data-mascot-state', 'rest');

  rerender(<FavoritesSheet activities={[activities[0]]} onRemove={vi.fn()} onClose={vi.fn()} />);
  expect(screen.getByRole('img', { name: '抱着爱心看收藏的鱼丸' })).toHaveAttribute('data-mascot-state', 'favorite');
});
