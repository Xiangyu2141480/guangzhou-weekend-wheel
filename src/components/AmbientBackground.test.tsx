import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AmbientBackground } from './AmbientBackground';

const preferenceKey = 'where-to-go:ambience:v1';

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('remembers the selected theme and paused animation after remounting', async () => {
  const user = userEvent.setup();
  const { unmount } = render(<AmbientBackground />);
  await user.click(screen.getByRole('button', { name: '暮色' }));
  await user.click(screen.getByRole('button', { name: '暂停动态' }));
  expect(screen.getByRole('button', { name: '暮色' })).toHaveAttribute('aria-pressed', 'true');
  unmount();

  const { container } = render(<AmbientBackground isSpinning />);
  expect(screen.getByRole('button', { name: '暮色' })).toHaveAttribute('aria-pressed', 'true');
  expect(container.querySelector('[data-ambient]')).toHaveAttribute('data-motion', 'paused');
  expect(container.querySelector('[data-ambient]')).toHaveAttribute('aria-hidden', 'true');
  await user.click(screen.getByRole('button', { name: '继续动态' }));
  expect(container.querySelector('[data-ambient]')).toHaveAttribute('data-motion', 'running');
});

test.each(['{broken', 'null', '[]', '{"theme":"unknown","paused":"yes"}'])(
  'uses a usable default when stored preferences are malformed: %s',
  (stored) => {
    localStorage.setItem(preferenceKey, stored);
    const { container } = render(<AmbientBackground />);
    expect(screen.getByRole('button', { name: '晴日' })).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('[data-ambient]')).toHaveAttribute('data-motion', 'running');
  },
);

test('keeps keyboard theme and pause controls working when storage reads or writes fail', async () => {
  const user = userEvent.setup();
  vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('full'); });
  const { container } = render(<AmbientBackground />);
  screen.getByRole('button', { name: '夜游' }).focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('button', { name: '夜游' })).toHaveAttribute('aria-pressed', 'true');
  await user.tab();
  await user.keyboard(' ');
  expect(container.querySelector('[data-ambient]')).toHaveAttribute('data-motion', 'paused');
});

test('responds to changing system reduced-motion preferences without overwriting the user pause choice', async () => {
  const user = userEvent.setup();
  const query = new EventTarget() as MediaQueryList;
  Object.defineProperty(query, 'matches', { configurable: true, value: false });
  vi.stubGlobal('matchMedia', () => query);
  const { container } = render(<AmbientBackground />);
  const backdrop = container.querySelector('[data-ambient]');
  expect(backdrop).toHaveAttribute('data-motion', 'running');
  act(() => {
    Object.defineProperty(query, 'matches', { value: true });
    query.dispatchEvent(new Event('change'));
  });
  expect(backdrop).toHaveAttribute('data-motion', 'paused');
  expect(screen.getByText('已跟随系统减少动态')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '暂停动态' }));
  act(() => {
    Object.defineProperty(query, 'matches', { value: false });
    query.dispatchEvent(new Event('change'));
  });
  expect(backdrop).toHaveAttribute('data-motion', 'paused');
  await user.click(screen.getByRole('button', { name: '继续动态' }));
  expect(backdrop).toHaveAttribute('data-motion', 'running');
});
