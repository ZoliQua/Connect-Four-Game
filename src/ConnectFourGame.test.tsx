import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { duelRoundScore, loadSession, readStats, saveSession } from './arcade';
import { ConnectFourGame, RESULT_DELAY_MS } from './ConnectFourGame';
import { advanceGame, createInitialState } from './logic/game';
import type { SavedGame } from './logic/persist';
import type { GameAction, GameState } from './logic/types';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const key = (k: string, init: KeyboardEventInit = {}) => fireEvent.keyDown(window, { key: k, ...init });
const discs = (container: HTMLElement) => container.querySelectorAll('.disc:not(.ghost)').length;
const column = (n: number) => screen.getByRole('button', { name: new RegExp(`^Column ${n},`) });
const apply = (s: GameState, ...actions: GameAction[]) => actions.reduce(advanceGame, s);

describe('<ConnectFourGame />', () => {
  it('opens in Medium, starts with Space, pauses with P / Esc and reports status to the host', () => {
    const onStatusChange = vi.fn();
    render(<ConnectFourGame onStatusChange={onStatusChange} />);
    expect(screen.getByRole('dialog', { name: 'Connect Four' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Medium' }).getAttribute('aria-pressed')).toBe('true');
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'idle' }));
    act(() => key(' '));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running', score: 0 }));
    act(() => key('p'));
    expect(screen.getByRole('dialog', { name: 'Paused' })).toBeTruthy();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
    act(() => key('Escape'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('a click drops into that column; clicks during the AI turn are ignored', () => {
    localStorage.setItem('connect4.aiSpeed', 'fast');
    const { container } = render(<ConnectFourGame />);
    act(() => key(' '));
    act(() => fireEvent.click(column(2)));
    expect(column(2).getAttribute('aria-label')).toMatch(/1 of 6: yours \(red\)/);
    // The AI is thinking: the board is locked and the reducer rejects the drop.
    expect(column(5).getAttribute('aria-disabled')).toBe('true');
    act(() => fireEvent.click(column(5)));
    expect(discs(container)).toBe(1);
    act(() => vi.advanceTimersByTime(200));
    expect(discs(container)).toBe(2);
    expect(screen.getByRole('status').textContent).toBe('Your turn');
  });

  it('pause freezes the AI; the keyboard moves the cursor and drops', () => {
    localStorage.setItem('connect4.aiSpeed', 'fast');
    const { container } = render(<ConnectFourGame />);
    act(() => key('Enter')); // start
    act(() => key('ArrowRight'));
    act(() => key('ArrowRight'));
    act(() => key('ArrowDown')); // drop into column 6 (index 5)
    expect(column(6).getAttribute('aria-label')).toMatch(/1 of 6/);
    act(() => key('p'));
    act(() => vi.advanceTimersByTime(3000));
    expect(discs(container)).toBe(1); // AI frozen while paused
    act(() => key('Enter')); // resumes instead of dropping
    act(() => vi.advanceTimersByTime(200));
    expect(discs(container)).toBe(2);
    act(() => key('1')); // jump to column 1
    act(() => key(' '));
    expect(column(1).getAttribute('aria-label')).toMatch(/yours \(red\)/);
  });

  it('autosaves the series and restores it paused with Welcome back', () => {
    const { unmount } = render(<ConnectFourGame />);
    act(() => key('n')); // Medium → Hard
    act(() => key('n')); // Hard → PvP, so no AI reply changes the disc count
    act(() => key(' '));
    act(() => key('Enter'));
    act(() => vi.advanceTimersByTime(1200));
    unmount();
    const env = loadSession<SavedGame>('connect4', 1);
    expect(env?.data).toMatchObject({ mode: 'pvp', moves: [3], status: 'playing', current: 2 });

    const { container } = render(<ConnectFourGame embedded />);
    expect(screen.getByRole('dialog', { name: 'Welcome back' })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(discs(container)).toBe(1);
    expect(screen.getByRole('button', { name: 'PvP' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('a finished ranked round calls onGameOver once, records stats and keeps the series', () => {
    const onGameOver = vi.fn();
    const onRunEnd = vi.fn();
    // Easy: the human (red) owns 0, 1, 2 on the bottom row and is to move; 100 series points so far.
    const data = apply(
      { ...createInitialState({ mode: 'easy' }), points: 100, scores: { p1: 1, p2: 0, draws: 0 } },
      { type: 'drop', col: 0 },
      { type: 'aiMove', col: 6, ply: 1 },
      { type: 'drop', col: 1 },
      { type: 'aiMove', col: 6, ply: 3 },
      { type: 'drop', col: 2 },
      { type: 'aiMove', col: 5, ply: 5 },
    );
    saveSession('connect4', { schema: 1, data, seconds: 12, score: 100 });
    render(<ConnectFourGame onGameOver={onGameOver} onRunEnd={onRunEnd} />);
    expect(screen.getByRole('dialog', { name: 'Welcome back' })).toBeTruthy();
    act(() => key('p'));
    act(() => key('4'));
    act(() => key('Enter'));
    const expected = duelRoundScore({ outcome: 'win', difficulty: 'easy', moves: 7, boardCells: 42 });
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(expected);
    expect(onRunEnd).toHaveBeenCalledWith({ score: expected, seconds: 12, outcome: 'win', ranked: true });
    expect(readStats('connect4')).toMatchObject({ best: expected, plays: 1, wins: 1 });

    act(() => vi.advanceTimersByTime(RESULT_DELAY_MS));
    expect(screen.getByRole('dialog', { name: 'You win!' })).toBeTruthy();
    act(() => vi.advanceTimersByTime(1500));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(loadSession<SavedGame>('connect4', 1)?.data).toMatchObject({ points: 100 + expected, scores: { p1: 2 } });

    // Next round: the loser (the AI) opens it.
    act(() => key('r'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('AI thinking…');
  });

  it('PvP rounds are unranked: no onGameOver, no Best', () => {
    const onGameOver = vi.fn();
    const onRunEnd = vi.fn();
    render(<ConnectFourGame onGameOver={onGameOver} onRunEnd={onRunEnd} />);
    act(() => key('n'));
    act(() => key('n')); // PvP
    act(() => key(' '));
    for (const c of [1, 1, 2, 2, 3, 3, 4]) act(() => fireEvent.click(column(c)));
    expect(onRunEnd).toHaveBeenCalledWith(expect.objectContaining({ ranked: false, score: 0, outcome: 'win' }));
    expect(onGameOver).not.toHaveBeenCalled();
    expect(readStats('connect4')).toMatchObject({ best: 0, plays: 1 });
    act(() => vi.advanceTimersByTime(RESULT_DELAY_MS));
    expect(screen.getByRole('dialog', { name: 'Red wins!' })).toBeTruthy();
  });

  it('C asks before resetting the series; Esc keeps it', () => {
    saveSession('connect4', {
      schema: 1,
      data: { ...createInitialState({ mode: 'easy' }), points: 300, scores: { p1: 2, p2: 1, draws: 0 } },
      seconds: 0,
      score: 300,
    });
    render(<ConnectFourGame />);
    act(() => key('p'));
    act(() => key('c'));
    expect(screen.getByRole('dialog', { name: 'Reset series scores?' })).toBeTruthy();
    act(() => key('Escape'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('2–1–0')).toBeTruthy();
    act(() => key('c'));
    act(() => key('Enter'));
    expect(screen.getByText('0–0–0')).toBeTruthy();
  });

  it('pauses when the tab is hidden', () => {
    render(<ConnectFourGame />);
    act(() => key(' '));
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    visibility.mockRestore();
    expect(screen.getByRole('dialog', { name: 'Paused' })).toBeTruthy();
  });

  it('ignores hotkeys while typing in a field and leaves T to the theme', () => {
    render(
      <>
        <input aria-label="nick" />
        <ConnectFourGame />
      </>,
    );
    const input = screen.getByLabelText('nick');
    act(() => {
      fireEvent.keyDown(input, { key: ' ' });
      fireEvent.keyDown(input, { key: 'n' });
    });
    expect(screen.getByRole('dialog', { name: 'Connect Four' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Medium' }).getAttribute('aria-pressed')).toBe('true');
    act(() => key('t'));
    expect(screen.getByRole('dialog', { name: 'Connect Four' })).toBeTruthy();
    act(() => key(' '));
    act(() => fireEvent.keyDown(input, { key: '7' }));
    act(() => key('Enter'));
    expect(column(4).getAttribute('aria-label')).toMatch(/1 of 6/); // the cursor stayed in the middle
    act(() => key('r', { metaKey: true })); // Cmd+R reloads the page, not a new round
    expect(column(4).getAttribute('aria-label')).toMatch(/1 of 6/);
  });
});
