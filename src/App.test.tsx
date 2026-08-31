import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, vi } from 'vitest';
import App from './App';

function jsonResponse(value: unknown): Response {
  return { ok: true, status: 200, json: async () => value } as Response;
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce(jsonResponse([]))
    .mockResolvedValueOnce(jsonResponse({
      generatedAt: null,
      configuredSources: 3,
      successfulSources: 0,
      failedSources: 0,
      sourceCounts: {},
      finalCount: 0,
      warnings: [],
    })));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('shows the product name and primary spin action', async () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: '今天去哪汪？' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '开转！' })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('data-pool-loading', 'false'));
});

test('starts the real wheel and blocks repeated clicks', async () => {
  const user = userEvent.setup();
  render(<App />);
  await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('data-pool-loading', 'false'));

  await user.click(screen.getByRole('button', { name: '开转！' }));

  expect(screen.getByRole('button', { name: '命运选择中……' })).toBeDisabled();
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
