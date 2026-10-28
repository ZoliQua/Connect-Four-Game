import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readStats } from '../arcade';
import { ConnectFourDemo, DEMO_MOVE_MS } from './ConnectFourDemo';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const discs = (c: HTMLElement) => c.querySelectorAll('.disc').length;

describe('<ConnectFourDemo />', () => {
  it('plays by itself on the real engine, loops rounds and writes nothing', () => {
    const { container } = render(<ConnectFourDemo />);
    expect(container.querySelector('.arc-demo')).toBeTruthy();
    expect(container.querySelector('.arc-demo')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('button, [tabindex]')).toBeNull();
    expect(discs(container)).toBe(0);
    for (let i = 0; i < 3; i += 1) act(() => vi.advanceTimersByTime(DEMO_MOVE_MS));
    expect(discs(container)).toBe(3); // one disc per tick
    let sawWin = false;
    let sawReset = false;
    for (let i = 0; i < 400; i += 1) {
      act(() => vi.advanceTimersByTime(DEMO_MOVE_MS));
      if (container.querySelector('.win')) sawWin = true;
      if (sawWin && discs(container) < 4) sawReset = true;
    }
    expect(sawWin).toBe(true);
    expect(sawReset).toBe(true); // a new round started after the result
    expect(readStats('connect4').plays).toBe(0);
    expect(localStorage.length).toBe(0);
  });

  it('freezes when inactive', () => {
    const { container } = render(<ConnectFourDemo active={false} />);
    act(() => vi.advanceTimersByTime(5000));
    expect(discs(container)).toBe(0);
  });
});
