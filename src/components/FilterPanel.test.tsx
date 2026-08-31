import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { FilterPanel } from './FilterPanel';

function renderPanel() {
  const handlers = {
    onCategoryToggle: vi.fn(),
    onBudgetChange: vi.fn(),
    onEnvironmentChange: vi.fn(),
    onDistrictToggle: vi.fn(),
    onTimeChange: vi.fn(),
    onStateToggle: vi.fn(),
    onReset: vi.fn(),
  };

  render(
    <FilterPanel
      categories={new Set()}
      budget={null}
      environment={null}
      districts={new Set()}
      time={null}
      states={new Set()}
      availableDistricts={['越秀区', '海珠区', '天河区']}
      {...handlers}
    />,
  );

  return handlers;
}

test('keeps all eight categories and budget choices above the fold', () => {
  renderPanel();

  expect(screen.getAllByTestId('category-filter')).toHaveLength(8);
  expect(screen.getByRole('button', { name: '运动一下' })).toBeVisible();
  expect(screen.getByRole('button', { name: '夜游广州' })).toBeVisible();
  expect(screen.getByRole('button', { name: '¥100以内' })).toBeVisible();
  expect(screen.getByText('再挑一点')).toBeVisible();
  expect(screen.queryByRole('button', { name: '天河区' })).not.toBeVisible();
});

test('reveals district, time, state and environment controls under more filters', async () => {
  const user = userEvent.setup();
  const handlers = renderPanel();

  await user.click(screen.getByText('再挑一点'));
  await user.click(screen.getByRole('button', { name: '天河区' }));
  await user.click(screen.getByRole('button', { name: '半天刚好' }));
  await user.click(screen.getByRole('button', { name: '一个人放空' }));
  await user.click(screen.getByRole('button', { name: '想待室内' }));

  expect(handlers.onDistrictToggle).toHaveBeenCalledWith('天河区');
  expect(handlers.onTimeChange).toHaveBeenCalledWith('half-day');
  expect(handlers.onStateToggle).toHaveBeenCalledWith('solo');
  expect(handlers.onEnvironmentChange).toHaveBeenCalledWith('indoor');
});

test('reports category and budget choices', async () => {
  const user = userEvent.setup();
  const handlers = renderPanel();

  await user.click(screen.getByRole('button', { name: '看展' }));
  await user.click(screen.getByRole('button', { name: '¥100以内' }));

  expect(handlers.onCategoryToggle).toHaveBeenCalledWith('art');
  expect(handlers.onBudgetChange).toHaveBeenCalledWith(100);
});
