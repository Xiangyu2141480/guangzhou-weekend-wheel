import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { activities } from '../data/activities';
import { Wheel } from './Wheel';

test('renders the real candidate labels and disables the spin action', () => {
  const candidates = activities.slice(0, 8);
  render(
    <Wheel
      candidates={candidates}
      rotation={1180}
      duration={3800}
      selectedIndex={3}
      isSpinning
      onSpin={vi.fn()}
    />,
  );

  expect(screen.getByLabelText('广州周末随机转盘')).toHaveAttribute(
    'data-candidate-ids',
    candidates.map((item) => item.id).join(','),
  );
  expect(screen.getByText(candidates[0].shortName)).toBeInTheDocument();
  expect(screen.getByLabelText('广州周末随机转盘')).toHaveAttribute('data-selected-index', '3');
  expect(screen.getAllByTestId('wheel-label').every((label) => label.dataset.upright === 'true')).toBe(true);
  expect(screen.getByRole('button', { name: '命运选择中……' })).toBeDisabled();
});
