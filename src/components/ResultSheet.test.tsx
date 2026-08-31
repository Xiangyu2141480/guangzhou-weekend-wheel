import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { activities, type Activity } from '../data/activities';
import { ResultSheet } from './ResultSheet';

const liveActivity: Activity = {
  ...activities[0],
  id: 'live-weekend-exhibition',
  name: '周末限定设计展',
  shortName: '设计展',
  venue: '广州图书馆',
  budget: 0,
  budgetLabel: '免费',
  priceStatus: 'free',
  live: true,
  sourceType: 'official',
  sourceName: '广州图书馆',
  sourceUrl: 'https://www.gzlib.org.cn/example',
  eventStart: '2026-08-30T10:00:00+08:00',
  eventEnd: '2026-09-02T18:00:00+08:00',
  fetchedAt: '2026-08-31T08:00:00+08:00',
  lastVerifiedAt: '2026-08-31T08:00:00+08:00',
  status: 'ongoing',
};

afterEach(() => vi.useRealTimers());

test('shows travel, retry and favorite actions without share, copy or download', async () => {
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
  expect(screen.getByRole('link', { name: '去地图看看' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /分享|复制|下载/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '收藏这个地点' }));
  await user.click(screen.getByRole('button', { name: '不服，再转一次' }));
  expect(onFavorite).toHaveBeenCalledOnce();
  expect(onRetry).toHaveBeenCalledOnce();
});

test('marks supported live facts and links to the official source', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-08-31T10:00:00+08:00'));
  render(
    <ResultSheet
      activity={liveActivity}
      isFavorite
      onFavorite={vi.fn()}
      onRetry={vi.fn()}
      onClose={vi.fn()}
    />,
  );

  expect(screen.getByText('本周限定')).toBeInTheDocument();
  expect(screen.getByText('快结束了')).toBeInTheDocument();
  expect(within(screen.getByLabelText('活动标签')).getByText('免费')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '查看官方详情' })).toHaveAttribute('href', liveActivity.sourceUrl);
  expect(screen.getByText(/活动信息来自广州图书馆/)).toBeInTheDocument();
});
