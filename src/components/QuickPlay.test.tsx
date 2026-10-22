import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { QuickPlay } from './QuickPlay';

afterEach(cleanup);

test('selects each of the six named weekend presets', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<QuickPlay disabled={false} onSelect={onSelect} />);
  for (const [label, id] of [
    ['随便逛逛', 'wander'], ['低预算出门', 'budget'], ['雨天不无聊', 'rain'],
    ['一起热闹', 'friends'], ['拍照散步', 'photo'], ['夜晚漫游', 'night'],
  ]) {
    await user.click(screen.getByRole('button', { name: label }));
    expect(onSelect).toHaveBeenLastCalledWith(id);
  }
  expect(onSelect).toHaveBeenCalledTimes(6);
});

test('cannot select a preset while the wheel is spinning', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<QuickPlay disabled onSelect={onSelect} />);
  for (const button of screen.getAllByRole('button')) {
    expect(button).toBeDisabled();
    await user.click(button);
  }
  expect(onSelect).not.toHaveBeenCalled();
});
