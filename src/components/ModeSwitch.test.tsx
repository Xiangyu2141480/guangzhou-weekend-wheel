import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ModeSwitch } from './ModeSwitch';

test('exposes the selected random mode accessibly', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<ModeSwitch mode="fresh" onChange={onChange} />);

  expect(screen.getByRole('button', { name: '本周新鲜' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: '纯命运' })).toHaveAttribute('aria-pressed', 'false');
  await user.click(screen.getByRole('button', { name: '纯命运' }));
  expect(onChange).toHaveBeenCalledWith('fate');
});
