import { render, screen } from '@testing-library/react';
import App from './App';

test('shows the product name and primary spin action', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: '今天去哪汪？' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '开转！' })).toBeInTheDocument();
});
