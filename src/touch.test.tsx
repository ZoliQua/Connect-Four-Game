import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang } from './arcade';
import { ConnectFourGame } from './ConnectFourGame';
import { setCoarsePointer } from './test/touchEnv';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('connect4.aiSpeed', 'instant');
  applyDental(false, { silent: true });
  applyLang('en', { silent: true });
  vi.useFakeTimers();
  setCoarsePointer(true);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const column = (n: number) => screen.getByRole('button', { name: new RegExp(`^Column ${n},`) });
const discs = () => document.querySelectorAll('.disc:not(.ghost)').length;
const tap = (el: HTMLElement) => {
  fireEvent.pointerDown(el, { pointerId: 1, pointerType: 'touch', button: 0 });
  fireEvent.pointerUp(el, { pointerId: 1, pointerType: 'touch', button: 0 });
  fireEvent.click(el);
};

describe('Connect Four touch controls', () => {
  it('marks the board as a tap board', () => {
    render(<ConnectFourGame />);
    expect(document.querySelector('.arc-board-tap')).toBeTruthy();
  });

  it('tapping a column drops a disc there', () => {
    render(<ConnectFourGame />);
    act(() => key(' '));
    tap(column(3));
    expect(column(3).getAttribute('aria-label')).toMatch(/1 of 6: yours \(red\)/);
  });

  it('tapping a cell inside a column drops into that column', () => {
    render(<ConnectFourGame />);
    act(() => key(' '));
    const cell = column(5).querySelectorAll('span')[3] as HTMLElement;
    tap(cell);
    expect(column(5).getAttribute('aria-label')).toMatch(/1 of 6/);
  });

  it('a touch hover does not move the cursor (so iOS delivers the first tap), and taps in the AI turn do nothing', () => {
    render(<ConnectFourGame />);
    act(() => key(' '));
    const before = column(1).getAttribute('tabindex');
    fireEvent.mouseEnter(column(1));
    expect(column(1).getAttribute('tabindex')).toBe(before);
    tap(column(2));
    act(() => vi.advanceTimersByTime(300));
    const n = discs();
    expect(n).toBe(2);
  });

  it('shows touch help instead of keys', () => {
    render(<ConnectFourGame />);
    expect(screen.getByText('Tap a column')).toBeTruthy();
  });

  it('the full-screen button toggles the immersive mode', () => {
    render(<ConnectFourGame />);
    fireEvent.click(screen.getByRole('button', { name: /Full screen/ }));
    expect(document.documentElement.dataset.arcadeImmersive).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: /Exit full screen/ }));
    expect(document.documentElement.dataset.arcadeImmersive).toBeUndefined();
  });
});

describe('Connect Four mouse hover (no touch)', () => {
  it('moves the column cursor on mouseEnter', () => {
    setCoarsePointer(false);
    render(<ConnectFourGame />);
    act(() => key(' '));
    fireEvent.mouseEnter(column(1));
    expect(column(1).getAttribute('tabindex')).toBe('0');
    fireEvent.mouseEnter(column(6));
    expect(column(6).getAttribute('tabindex')).toBe('0');
    expect(column(1).getAttribute('tabindex')).toBe('-1');
  });
});
