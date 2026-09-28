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

  it('reserves the intrinsic aspect ratio and defers non-critical mascots by default', () => {
    render(<YuwanMascot state="idle" />);
    const image = screen.getByRole('img');

    expect(image).toHaveAttribute('width', '512');
    expect(image).toHaveAttribute('height', '512');
    expect(image).toHaveAttribute('decoding', 'async');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('fetchpriority', 'low');
  });

  it('allows above-the-fold mascots to opt into eager, high-priority loading', () => {
    render(<YuwanMascot state="point" loading="eager" fetchPriority="high" />);
    const image = screen.getByRole('img');

    expect(image).toHaveAttribute('loading', 'eager');
    expect(image).toHaveAttribute('fetchpriority', 'high');
  });
});
