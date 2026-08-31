import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { YuwanMascot } from './YuwanMascot';

const requiredStates = [
  'idle',
  'think',
  'search',
  'run',
  'spin',
  'happy',
  'point',
  'rest',
  'empty',
  'favorite',
] as const;

describe('YuwanMascot', () => {
  it.each(requiredStates)('loads the %s Yuwan asset', (state) => {
    render(<YuwanMascot state={state} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringMatching(/yuwan/));
    expect(screen.getByRole('img')).toHaveAttribute('data-mascot-state', state);
  });

  it('falls back to idle for an unknown runtime state', () => {
    render(<YuwanMascot state={'missing' as never} />);
    expect(screen.getByRole('img')).toHaveAttribute('data-mascot-state', 'idle');
  });

  it.each([
    ['sm', 'yuwan-mascot--sm'],
    ['md', 'yuwan-mascot--md'],
    ['lg', 'yuwan-mascot--lg'],
  ] as const)('supports the %s display size', (size, className) => {
    render(<YuwanMascot state="idle" size={size} />);
    expect(screen.getByRole('img')).toHaveClass(className);
  });
});
