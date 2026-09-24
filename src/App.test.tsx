import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, vi } from 'vitest';
import App from './App';
import { SELECTED_CITY_STORAGE_KEY } from './hooks/useSelectedCity';

function jsonResponse(value: unknown): Response {
  return { ok: true, status: 200, json: async () => value } as Response;
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(SELECTED_CITY_STORAGE_KEY, 'guangzhou');
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/data/manifest.json')) {
      return Promise.resolve(jsonResponse({
        schemaVersion: 2,
        generatedAt: null,
        cities: ['beijing', 'shanghai', 'guangzhou', 'shenzhen', 'suzhou'].map((cityId) => ({
          cityId,
          snapshot: `cities/${cityId}.json`,
          availability: 'evergreen-only',
          generatedAt: null,
          liveCount: 0,
        })),
      }));
    }
    const cityId = url.match(/cities\/([a-z]+)\.json$/)?.[1] ?? 'guangzhou';
    return Promise.resolve(jsonResponse({
      schemaVersion: 2,
      cityId,
      generatedAt: null,
      availability: 'evergreen-only',
      sources: [],
      counts: {
        fetched: 0,
        invalid: 0,
        expired: 0,
        duplicate: 0,
        current: 0,
        fallback: 0,
        final: 0,
      },
      warnings: [],
      activities: [],
    }));
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('shows the product name and primary spin action', async () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: '今天去哪玩？' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '开转！' })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('data-pool-loading', 'false'));
  expect(screen.getByRole('status')).toHaveTextContent('广州实时活动暂不可用，当前使用常驻灵感。');
});

test('requires a valid first city and persists the selection', async () => {
  localStorage.removeItem(SELECTED_CITY_STORAGE_KEY);
  const user = userEvent.setup();
  render(<App />);

  expect(screen.getByRole('heading', { name: '先选一座城市' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '上海' }));

  await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('data-city-id', 'shanghai'));
  expect(localStorage.getItem(SELECTED_CITY_STORAGE_KEY)).toBe('shanghai');
});

test('announces spin start and the selected result with reduced motion', async () => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const user = userEvent.setup();
  render(<App />);
  await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('data-pool-loading', 'false'));

  await user.click(screen.getByRole('button', { name: '开转！' }));
  expect(screen.getByRole('status')).toHaveTextContent('转盘开始转动');

  await waitFor(
    () => expect(screen.getByRole('status')).toHaveTextContent(/^抽取结果：/),
    { timeout: 1000 },
  );
  expect(screen.getByRole('dialog', { name: '命运决定了！' })).toBeInTheDocument();
});

test('freezes every round-changing control for the full spin', async () => {
  const user = userEvent.setup();
  render(<App />);
  await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('data-pool-loading', 'false'));

  await user.click(screen.getByRole('button', { name: '开转！' }));

  expect(screen.getByRole('button', { name: '命运选择中……' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '换一批' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '本周新鲜' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '纯命运' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '运动一下' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '¥100以内' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '当前城市：广州，点击切换城市' })).toBeDisabled();
});

test('updates the truthful eligible count when filters change', async () => {
  const user = userEvent.setup();
  render(<App />);
  await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('data-pool-loading', 'false'));

  const count = screen.getByText(/^符合 \d+ 个 · 本轮 \d+ 个$/);
  const before = count.textContent;
  await user.click(screen.getByRole('button', { name: '运动一下' }));

  await waitFor(() => expect(count.textContent).not.toBe(before));
  expect(screen.getByRole('button', { name: '运动一下' })).toHaveAttribute('aria-pressed', 'true');
});

test('changes the visible candidate batch without opening a result', async () => {
  let seed = 31;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  });
  const user = userEvent.setup();
  render(<App />);
  await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('data-pool-loading', 'false'));

  const wheel = screen.getByLabelText('广州周末随机转盘');
  const before = wheel.getAttribute('data-candidate-ids');
  await user.click(screen.getByRole('button', { name: '换一批' }));

  expect(wheel.getAttribute('data-candidate-ids')).not.toBe(before);
  expect(wheel.getAttribute('data-candidate-ids')?.split(',')).toHaveLength(10);
  expect(screen.queryByRole('dialog', { name: '命运决定了！' })).not.toBeInTheDocument();
});

test('resets filters, candidates, and result when the city changes', async () => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const user = userEvent.setup();
  render(<App />);
  await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('data-pool-loading', 'false'));

  await user.click(screen.getByRole('button', { name: '运动一下' }));
  await user.click(screen.getByRole('button', { name: '开转！' }));
  await waitFor(() => expect(screen.getByRole('dialog', { name: '命运决定了！' })).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: '关闭结果' }));
  await user.click(screen.getByRole('button', { name: '当前城市：广州，点击切换城市' }));
  await user.click(screen.getByRole('button', { name: '上海' }));

  await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('data-city-id', 'shanghai'));
  expect(screen.getByRole('button', { name: '运动一下' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.queryByRole('dialog', { name: '命运决定了！' })).not.toBeInTheDocument();
  expect(screen.getByLabelText('上海周末随机转盘').getAttribute('data-candidate-ids'))
    .toMatch(/^place:shanghai:/);
});
