import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyLang, LANGS, saveSession } from './arcade';
import { ConnectFourGame } from './ConnectFourGame';
import { MESSAGES } from './i18n';
import { createInitialState } from './logic/game';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  act(() => applyLang('en'));
  vi.useRealTimers();
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const discs = (container: HTMLElement) => container.querySelectorAll('.disc:not(.ghost)').length;

describe('Connect Four i18n', () => {
  it('has every key in en, hu and de with a non-empty value', () => {
    const keys = Object.keys(MESSAGES.en).sort();
    expect(keys.length).toBeGreaterThan(0);
    for (const lang of LANGS) {
      expect(Object.keys(MESSAGES[lang]).sort()).toEqual(keys);
      for (const k of keys) expect((MESSAGES[lang] as Record<string, string>)[k].trim()).not.toBe('');
    }
  });

  it('renders the German start overlay after applyLang("de")', () => {
    applyLang('de');
    render(<ConnectFourGame />);
    expect(screen.getByRole('dialog', { name: 'Vier gewinnt' })).toBeTruthy();
    expect(screen.getByText(/Bilde vor der KI eine Viererreihe/)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Spielmodus' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mittel' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('switching to Hungarian mid-round keeps the board, score and status', () => {
    localStorage.setItem('connect4.aiSpeed', 'fast');
    const { container } = render(<ConnectFourGame />);
    act(() => key(' '));
    act(() => fireEvent.click(screen.getByRole('button', { name: /^Column 3,/ })));
    act(() => vi.advanceTimersByTime(200));
    expect(discs(container)).toBe(2);
    expect(screen.getByRole('status').textContent).toBe('Your turn');

    act(() => applyLang('hu'));
    expect(discs(container)).toBe(2);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Te jössz');
    expect(screen.getByRole('button', { name: /^3\. oszlop, 6-ból 1: a tiéd \(piros\)/ })).toBeTruthy();
    expect(screen.getByText('0–0–0')).toBeTruthy();
  });

  it('formats numbers with the language grouping', () => {
    saveSession('connect4', {
      schema: 1,
      data: { ...createInitialState({ mode: 'easy' }), points: 12500, scores: { p1: 9, p2: 1, draws: 0 } },
      seconds: 0,
      score: 12500,
    });
    applyLang('de');
    const { unmount } = render(<ConnectFourGame />);
    expect(screen.getByRole('dialog', { name: 'Willkommen zurück' }).textContent).toMatch(/12\.500 Punkte/);
    unmount();
    act(() => applyLang('en'));
    render(<ConnectFourGame />);
    expect(screen.getByRole('dialog', { name: 'Welcome back' }).textContent).toMatch(/12,500 points/);
  });
});
