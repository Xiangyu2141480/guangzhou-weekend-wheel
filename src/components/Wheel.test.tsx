import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { activities } from '../data/activities';
import { Wheel } from './Wheel';

test('renders ten real candidate labels and disables wheel actions while spinning', () => {
  const candidates = activities.slice(0, 10);
  render(
    <Wheel
      candidates={candidates}
      rotation={1180}
      duration={3800}
      selectedIndex={3}
      isSpinning
      onSpin={vi.fn()}
      onReroll={vi.fn()}
    />,
  );

  expect(screen.getByLabelText('广州周末随机转盘')).toHaveAttribute(
    'data-candidate-ids',
    candidates.map((item) => item.id).join(','),
  );
  expect(screen.getByText(candidates[0].shortName)).toBeInTheDocument();
  expect(screen.getByLabelText('广州周末随机转盘')).toHaveAttribute('data-selected-index', '3');
  expect(screen.getAllByTestId('wheel-label').every((label) => label.dataset.upright === 'true')).toBe(true);
  expect(screen.getAllByTestId('wheel-label')).toHaveLength(10);
  expect(screen.getByRole('button', { name: '命运选择中……' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '换一批' })).toBeDisabled();
});

test('rerolls candidates without starting the wheel', async () => {
  const user = userEvent.setup();
  const onSpin = vi.fn();
  const onReroll = vi.fn();
  render(
    <Wheel
      candidates={activities.slice(0, 10)}
      rotation={0}
      duration={3800}
      isSpinning={false}
      onSpin={onSpin}
      onReroll={onReroll}
    />,
  );

  await user.click(screen.getByRole('button', { name: '换一批' }));
  expect(onReroll).toHaveBeenCalledOnce();
  expect(onSpin).not.toHaveBeenCalled();
});
