import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test } from 'vitest';
import type { Activity, ActivityCategory } from '../data/types';
import { WeekendChallenge } from './WeekendChallenge';

const activity: Activity = {
  schemaVersion: 2, id: 'gz-art-test', cityId: 'guangzhou', name: '周末看展',
  shortName: '看展', category: 'art', district: '天河区', venue: '测试展馆',
  budget: 0, budgetLabel: '免费', priceStatus: 'free', duration: '1小时',
  timeTags: ['short'], indoorOutdoor: 'indoor', tags: ['安静'], emoji: '🎨',
  reason: '看看新鲜事物', mapKeyword: '测试展馆', transport: '步行', live: false,
};

afterEach(cleanup);

test('offers a different optional task and resets completion when changing the card', async () => {
  const user = userEvent.setup();
  render(<WeekendChallenge activity={activity} />);
  const firstTask = screen.getByRole('status').textContent;
  await user.click(screen.getByRole('button', { name: '标记完成' }));
  expect(screen.getByRole('button', { name: /已完成/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: /已完成/ })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: '换一张' }));
  expect(screen.getByRole('status').textContent).not.toBe(firstTask);
  expect(screen.getByRole('button', { name: '标记完成' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByText(/随手灵感.*自愿参加/)).toBeInTheDocument();
});

test('starts a fresh task when the activity identity changes, including the same category', async () => {
  const user = userEvent.setup();
  const { rerender, unmount } = render(<WeekendChallenge activity={activity} />);
  const firstTask = screen.getByRole('status').textContent;
  await user.click(screen.getByRole('button', { name: '换一张' }));
  await user.click(screen.getByRole('button', { name: '标记完成' }));
  rerender(<WeekendChallenge activity={{ ...activity, id: 'another-art' }} />);
  expect(screen.getByRole('status')).toHaveTextContent(firstTask!);
  expect(screen.getByRole('button', { name: '标记完成' })).toBeEnabled();
  await user.click(screen.getByRole('button', { name: '标记完成' }));
  unmount();
  render(<WeekendChallenge activity={{ ...activity, id: 'another-art' }} />);
  expect(screen.getByRole('button', { name: '标记完成' })).toBeEnabled();
});

test.each<[ActivityCategory, RegExp]>([
  ['art', /作品/], ['outdoor', /绿意/], ['food', /味道/], ['show', /散场/],
  ['market', /颜色/], ['experience', /新尝试/], ['sport', /节奏/], ['night', /灯光/],
])('offers a relevant task for the %s category', (category, task) => {
  render(<WeekendChallenge activity={{ ...activity, category }} />);
  expect(screen.getByRole('status')).toHaveTextContent(task);
});
