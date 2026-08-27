import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { FilterPanel } from './FilterPanel';

test('reports category, budget and environment choices', async () => {
  const user = userEvent.setup();
  const onCategoryToggle = vi.fn();
  const onBudgetChange = vi.fn();
  const onEnvironmentChange = vi.fn();
  render(
    <FilterPanel
      categories={new Set()}
      budget={null}
      environment={null}
      onCategoryToggle={onCategoryToggle}
      onBudgetChange={onBudgetChange}
      onEnvironmentChange={onEnvironmentChange}
      onReset={vi.fn()}
    />,
  );

  await user.click(screen.getByRole('button', { name: '看展' }));
  await user.click(screen.getByRole('button', { name: '¥100以内' }));
  await user.click(screen.getByRole('button', { name: '想待室内' }));

  expect(onCategoryToggle).toHaveBeenCalledWith('art');
  expect(onBudgetChange).toHaveBeenCalledWith(100);
  expect(onEnvironmentChange).toHaveBeenCalledWith('indoor');
});
