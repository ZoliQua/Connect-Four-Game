import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, loadSession } from './arcade';
import { ConnectFourGame } from './ConnectFourGame';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('hu', { silent: true });
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  applyLang('en', { silent: true });
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const finishBtn = () => screen.queryByRole('button', { name: 'Befejezés' });
const discs = (c: HTMLElement) => c.querySelectorAll('.disc:not(.ghost)').length;
const column = (n: number) => screen.getByRole('button', { name: new RegExp(`^${n}\\. oszlop,`) });

describe('Connect Four finish early', () => {
  it('is hidden before the run starts and visible after the first move', () => {
    render(<ConnectFourGame />);
    expect(finishBtn()).toBeNull();
    act(() => key(' '));
    act(() => fireEvent.click(column(4)));
    expect(finishBtn()).toBeTruthy();
  });

  it('confirms with the round score 0, ranks it once, ends the match and drops the save', () => {
    const onGameOver = vi.fn();
    render(<ConnectFourGame onGameOver={onGameOver} />);
    act(() => key(' '));
    act(() => fireEvent.click(column(4)));
    fireEvent.click(finishBtn()!);
    expect(screen.getByRole('alertdialog').textContent).toContain('0 pont kerül a ranglistára');
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(0, { finished: true });
    expect(screen.getByRole('dialog', { name: 'Idő előtt befejezve' })).toBeTruthy();
    expect(loadSession('connect4', 1)).toBeNull();
    act(() => vi.advanceTimersByTime(4000));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(loadSession('connect4', 1)).toBeNull();
    expect(finishBtn()).toBeNull();
  });

  it('is unranked in local two-player', () => {
    const onGameOver = vi.fn();
    render(<ConnectFourGame onGameOver={onGameOver} />);
    act(() => key('n')); // medium -> hard
    act(() => key('n')); // hard -> pvp
    act(() => key(' '));
    act(() => fireEvent.click(column(4)));
    fireEvent.click(finishBtn()!);
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Idő előtt befejezve' })).toBeTruthy();
  });

  it('Cancel changes nothing', () => {
    const onGameOver = vi.fn();
    const { container } = render(<ConnectFourGame onGameOver={onGameOver} />);
    act(() => key(' '));
    act(() => fireEvent.click(column(4)));
    fireEvent.click(finishBtn()!);
    fireEvent.click(screen.getByRole('button', { name: 'Mégse' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onGameOver).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(discs(container)).toBeGreaterThanOrEqual(1);
  });

  it('stops the AI while the confirm is open', () => {
    localStorage.setItem('connect4.aiSpeed', 'fast');
    const { container } = render(<ConnectFourGame />);
    act(() => key(' '));
    act(() => fireEvent.click(column(4)));
    fireEvent.click(finishBtn()!);
    act(() => vi.advanceTimersByTime(3000));
    expect(discs(container)).toBe(1);
  });

  it('after finishing, R starts a fresh series', () => {
    const { container } = render(<ConnectFourGame />);
    act(() => key(' '));
    act(() => fireEvent.click(column(4)));
    fireEvent.click(finishBtn()!);
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    act(() => key('r'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(discs(container)).toBe(0);
    expect(finishBtn()).toBeTruthy();
  });
});
