import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { activities } from '../data/activities';
import { ResultSheet } from './ResultSheet';

test('shows actionable result details and exposes favorite and retry actions', async () => {
  const user = userEvent.setup();
  const onRetry = vi.fn();
  const onFavorite = vi.fn();
  render(
    <ResultSheet
      activity={activities[0]}
      isFavorite={false}
      onFavorite={onFavorite}
      onRetry={onRetry}
      onClose={vi.fn()}
    />,
  );

  expect(screen.getByRole('dialog', { name: '命运决定了！' })).toBeInTheDocument();
  expect(screen.getByText(activities[0].transport)).toBeInTheDocument();
  expect(screen.getByText(activities[0].budgetLabel)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '收藏这个地点' }));
  await user.click(screen.getByRole('button', { name: '不服，再转一次' }));
  expect(onFavorite).toHaveBeenCalledOnce();
  expect(onRetry).toHaveBeenCalledOnce();
});
