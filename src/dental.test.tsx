import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang } from './arcade';
import { ConnectFourGame } from './ConnectFourGame';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  applyDental(false, { silent: true });
  applyLang('en', { silent: true });
  vi.useRealTimers();
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const column = (n: number) => screen.getByRole('button', { name: new RegExp(`^Column ${n},`) });
const board = () => screen.getByRole('group', { name: /board/i });

/** PvP round with two discs: red in column 4, yellow in column 5. */
function playTwoDiscs() {
  const view = render(<ConnectFourGame />);
  act(() => key('n')); // Medium → Hard
  act(() => key('n')); // Hard → PvP: no AI reply changes the board
  act(() => key(' '));
  act(() => fireEvent.click(column(4)));
  act(() => fireEvent.click(column(5)));
  return view;
}

describe('dental mode', () => {
  it('draws red discs as incisors and yellow discs as gold molars', () => {
    applyDental(true);
    playTwoDiscs();
    expect(board().getAttribute('data-dental')).toBe('true');
    expect(screen.getAllByTestId('c4-disc-tooth')).toHaveLength(1);
    expect(screen.getAllByTestId('c4-disc-molar')).toHaveLength(1);
    // Different silhouettes, not only colours.
    const toothPath = screen.getByTestId('c4-disc-tooth').querySelector('path')?.getAttribute('d');
    const molarPath = screen.getByTestId('c4-disc-molar').querySelector('path')?.getAttribute('d');
    expect(toothPath).toBeTruthy();
    expect(molarPath).toBeTruthy();
    expect(toothPath).not.toBe(molarPath);
  });

  it('toggling dental mode mid-round keeps the board, turn and clock', () => {
    const { container } = playTwoDiscs();
    act(() => vi.advanceTimersByTime(3000));
    const before = {
      c4: column(4).getAttribute('aria-label'),
      c5: column(5).getAttribute('aria-label'),
      status: screen.getByRole('status').textContent,
      time: container.querySelector('.arc-stats')?.textContent?.match(/\d\d:\d\d/)?.[0],
    };
    expect(before.c4).toMatch(/1 of 6: red/);
    expect(before.status).toBe('Red to move');

    act(() => fireEvent.click(screen.getByRole('checkbox', { name: /Dental mode/ })));
    expect(board().getAttribute('data-dental')).toBe('true');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(column(4).getAttribute('aria-label')).toBe(before.c4);
    expect(column(5).getAttribute('aria-label')).toBe(before.c5);
    // Same turn, named by shape (the discs are drawn as teeth now).
    expect(screen.getByRole('status').textContent).toBe('Incisor to move');
    expect(before.time).toBe('00:03');
    expect(container.querySelector('.arc-stats')?.textContent?.match(/\d\d:\d\d/)?.[0]).toBe(before.time);
    expect(localStorage.getItem('arcade.dental')).toBe('1');

    act(() => applyDental(false));
    expect(screen.getByRole('status').textContent).toBe('Red to move');
    expect(board().getAttribute('data-dental')).toBe('false');
    expect(column(4).getAttribute('aria-label')).toBe(before.c4);
  });

  it('with dental mode off the classic round discs are drawn', () => {
    const { container } = playTwoDiscs();
    expect(board().getAttribute('data-dental')).toBe('false');
    expect(screen.queryByTestId('c4-disc-tooth')).toBeNull();
    expect(screen.queryByTestId('c4-disc-molar')).toBeNull();
    expect(container.querySelectorAll('.disc.p1:not(.ghost)')).toHaveLength(1);
    expect(container.querySelectorAll('.disc.p2:not(.ghost)')).toHaveLength(1);
    expect(container.querySelector('.disc svg')).toBeNull();
  });

  it('names the players by shape in dental mode: status, series and result, in every language', () => {
    applyDental(true);
    const { container } = playTwoDiscs();
    expect(screen.getByRole('status').textContent).toBe('Incisor to move');
    const series = container.querySelector('.series')!;
    expect(series.textContent).toContain('Incisor');
    expect(series.textContent).toContain('Molar');
    expect(series.textContent).not.toMatch(/Red|Yellow/);
    // The series labels carry the same tooth / molar silhouettes as the discs.
    expect(series.querySelectorAll('[data-testid="c4-series-tooth"]')).toHaveLength(1);
    expect(series.querySelectorAll('[data-testid="c4-series-molar"]')).toHaveLength(1);
    expect(screen.getByText('I–M–D')).toBeTruthy();

    act(() => applyLang('hu'));
    expect(screen.getByRole('status').textContent).toBe('Metszőfog lép');
    act(() => applyLang('de'));
    expect(screen.getByRole('status').textContent).toBe('Schneidezahn ist am Zug');

    act(() => applyLang('en'));
    // Incisor (column 4) wins with three more in a row: 4,5,4,5,4,5,4.
    for (const c of [4, 5, 4, 5, 4]) act(() => fireEvent.click(column(c)));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole('dialog', { name: 'Incisor wins!' })).toBeTruthy();
  });
});
