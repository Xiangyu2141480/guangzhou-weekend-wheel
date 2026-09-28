import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { CitySelector } from './CitySelector';

test('does not let a first-time visitor dismiss city selection with Escape', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(
    <CitySelector
      currentCityId={null}
      initial
      onSelect={vi.fn()}
      onClose={onClose}
    />,
  );

  expect(screen.queryByRole('button', { name: '关闭城市选择' })).not.toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog', { name: '先选一座城市' })).toBeInTheDocument();
});

test('closes a header-opened selector with Escape and restores focus', async () => {
  const user = userEvent.setup();

  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button className="city-trigger" type="button" onClick={() => setOpen(true)}>
          当前城市：广州
        </button>
        {open && (
          <CitySelector
            currentCityId="guangzhou"
            initial={false}
            onSelect={vi.fn()}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    );
  }

  render(<Harness />);
  const trigger = screen.getByRole('button', { name: '当前城市：广州' });
  await user.click(trigger);
  expect(screen.getByRole('button', { name: '关闭城市选择' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test('reports the current city and returns the selected city id', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(
    <CitySelector
      currentCityId="guangzhou"
      initial={false}
      onSelect={onSelect}
      onClose={vi.fn()}
    />,
  );

  expect(screen.getByRole('button', { name: '广州' })).toHaveAttribute('aria-pressed', 'true');
  await user.click(screen.getByRole('button', { name: '深圳' }));
  expect(onSelect).toHaveBeenCalledWith('shenzhen');
});
