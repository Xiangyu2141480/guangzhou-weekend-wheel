import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ActivityPoolStatus } from './ActivityPoolStatus';

test('shows truthful pool, eligible and wheel counts with sync freshness', () => {
  render(
    <ActivityPoolStatus
      evergreenCount={189}
      liveCount={8}
      eligibleCount={42}
      candidateCount={10}
      loading={false}
      generatedAt="2026-08-31T09:30:00+08:00"
      availability="normal"
    />,
  );

  expect(screen.getByText('189 个常驻灵感')).toBeInTheDocument();
  expect(screen.getByText('8 个本周活动')).toBeInTheDocument();
  expect(screen.getByText('符合 42 个 · 本轮 10 个')).toBeInTheDocument();
  expect(screen.getByText(/更新/)).toBeInTheDocument();
  expect(screen.getByText('实时活动正常')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: '拿着地图查看活动池的鱼丸' })).toHaveAttribute('data-mascot-state', 'map');
});

test('keeps one stable mascot source while live activities are loading', () => {
  render(
    <ActivityPoolStatus
      evergreenCount={189}
      liveCount={0}
      eligibleCount={189}
      candidateCount={10}
      loading
      generatedAt={null}
      availability="evergreen-only"
    />,
  );

  expect(screen.getByText('正在看看广州这周有什么新鲜事…')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: '正在搜索本周活动的鱼丸' })).toHaveAttribute('data-mascot-state', 'map');
});

test('distinguishes degraded and evergreen-only states', () => {
  const { rerender } = render(
    <ActivityPoolStatus
      evergreenCount={189}
      liveCount={2}
      eligibleCount={191}
      candidateCount={10}
      loading={false}
      generatedAt="2026-08-31T09:30:00+08:00"
      availability="degraded"
    />,
  );

  expect(screen.getByText('实时活动降级展示')).toBeInTheDocument();
  rerender(
    <ActivityPoolStatus
      evergreenCount={189}
      liveCount={0}
      eligibleCount={189}
      candidateCount={10}
      loading={false}
      generatedAt={null}
      availability="evergreen-only"
    />,
  );
  expect(screen.getByText('当前仅使用常驻灵感')).toBeInTheDocument();
});
