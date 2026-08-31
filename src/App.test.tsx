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

afterEach(() => vi.unstubAllGlobals());

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
