import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('shows the product name and primary spin action', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: '今天去哪汪？' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '开转！' })).toBeInTheDocument();
});

test('starts the real wheel and blocks repeated clicks', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '开转！' }));

  expect(screen.getByRole('button', { name: '命运选择中……' })).toBeDisabled();
});
