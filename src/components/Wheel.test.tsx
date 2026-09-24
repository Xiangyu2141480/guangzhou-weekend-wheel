import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { activities } from '../data/activities';
import { getCityConfig } from '../data/cities';
import { Wheel } from './Wheel';

test('renders ten real candidate labels and disables wheel actions while spinning', () => {
  const candidates = activities.slice(0, 10);
  render(
    <Wheel
      city={getCityConfig('guangzhou')}
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
  expect(screen.getByText(candidates[0].shortName.slice(0, 4))).toBeInTheDocument();
  expect(screen.getByLabelText('广州周末随机转盘')).toHaveAttribute('data-selected-index', '3');
  expect(screen.getAllByTestId('wheel-label').every((label) => label.dataset.upright === 'true')).toBe(true);
  expect(screen.getAllByTestId('wheel-label')).toHaveLength(10);
  const candidateList = screen.getByRole('list', { name: '本轮候选地点' });
  expect(candidateList).toHaveTextContent(candidates[0].name);
  expect(candidateList.querySelectorAll('li')).toHaveLength(10);
  expect(candidateList.querySelector('[aria-current]')).toBeNull();
  expect(screen.getByRole('button', { name: '命运选择中……' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '换一批' })).toBeDisabled();
});

test('marks the selected candidate for screen readers after spinning', () => {
  const candidates = activities.slice(0, 3);
  render(
    <Wheel
      city={getCityConfig('guangzhou')}
      candidates={candidates}
      rotation={1080}
      duration={3800}
      selectedIndex={1}
      isSpinning={false}
      onSpin={vi.fn()}
      onReroll={vi.fn()}
    />,
  );

  expect(screen.getByText(new RegExp(candidates[1].name))).toHaveAttribute('aria-current', 'true');
});

test('rerolls candidates without starting the wheel', async () => {
  const user = userEvent.setup();
  const onSpin = vi.fn();
  const onReroll = vi.fn();
  render(
    <Wheel
      city={getCityConfig('guangzhou')}
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
