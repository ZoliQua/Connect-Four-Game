import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, duelRoundScore, formatNumber } from './arcade';
import { ConnectFourGame } from './ConnectFourGame';
import { setCoarsePointer } from './test/touchEnv';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('hu', { silent: true });
  vi.useFakeTimers();
  setCoarsePointer(false);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  applyLang('en', { silent: true });
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const openRules = () => fireEvent.click(screen.getByRole('button', { name: /Szabályok/ }));
const dialog = () => screen.getByRole('dialog', { name: /szabályok|Regeln/ });
const headings = () => within(dialog()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
type D = 'easy' | 'medium' | 'hard';
const win = (d: D, moves: number) => duelRoundScore({ outcome: 'win', difficulty: d, moves, boardCells: 42 });
const draw = (d: D) => duelRoundScore({ outcome: 'draw', difficulty: d, moves: 42, boardCells: 42 });

describe('Connect Four rules dialog', () => {
  it('shows a Rules button; opening mid-run pauses and closing leaves it paused', () => {
    render(<ConnectFourGame />);
    expect(screen.getByRole('button', { name: /Szabályok/ })).toBeTruthy();
    act(() => key(' '));
    expect(screen.queryByRole('dialog')).toBeNull();
    openRules();
    expect(dialog()).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Bezárás' }));
    expect(screen.getByRole('dialog', { name: 'Szünet' })).toBeTruthy();
  });

  it('R keeps starting a new round and does not open the rules', () => {
    render(<ConnectFourGame />);
    act(() => key(' '));
    act(() => key('r'));
    expect(screen.queryByRole('dialog', { name: /szabályok/ })).toBeNull();
  });

  it('lists goal, play, rules, scoring, dental in order; mobile only on touch', () => {
    const { unmount } = render(<ConnectFourGame />);
    openRules();
    expect(headings()).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód']);
    unmount();
    setCoarsePointer(true);
    render(<ConnectFourGame />);
    openRules();
    expect(headings()).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód', 'Mobilon']);
    expect(dialog().textContent).toContain('Koppints az oszlop bármely pontjára');
    expect(dialog().textContent).toContain('Teljes képernyő');
  });

  it('prints the real score ranges as full sentences (hu and de)', () => {
    const n = (v: number, l: 'hu' | 'de') => formatNumber(v, l);
    const names = { hu: { easy: 'Könnyű', medium: 'Közepes', hard: 'Nehéz' }, de: { easy: 'Leicht', medium: 'Mittel', hard: 'Schwer' } };
    const sentence = (l: 'hu' | 'de', d: D) =>
      l === 'hu'
        ? `${names.hu[d]}: győzelem ${n(win(d, 42), l)}–${n(win(d, 7), l)}, döntetlen ${n(draw(d), l)}`
        : `${names.de[d]}: Sieg ${n(win(d, 42), l)}–${n(win(d, 7), l)}, Unentschieden ${n(draw(d), l)}`;
    expect(win('medium', 7)).toBe(458);
    expect(win('medium', 42)).toBe(250);
    render(<ConnectFourGame />);
    openRules();
    let text = dialog().textContent ?? '';
    for (const d of ['easy', 'medium', 'hard'] as const) expect(text).toContain(sentence('hu', d));
    expect(text).toContain('Közepes: győzelem 250–458, döntetlen 63');
    act(() => applyLang('de'));
    text = dialog().textContent ?? '';
    for (const d of ['easy', 'medium', 'hard'] as const) expect(text).toContain(sentence('de', d));
  });

  it('the Mode panel note shows the same real range, not base to double', () => {
    render(<ConnectFourGame />);
    const text = document.body.textContent ?? '';
    const range = (d: D) => `${formatNumber(win(d, 42), 'hu')}–${formatNumber(win(d, 7), 'hu')}`;
    expect(text).toContain(`Pontozott: egy győzelem ${range('medium')} pontot ér (a gyorsabb többet), egy döntetlen a negyedét.`);
    act(() => applyLang('de'));
    expect(document.body.textContent).toContain(`Gewertet: Ein Sieg bringt ${range('medium')} (schnellere Siege mehr), ein Unentschieden ein Viertel.`);
    act(() => applyLang('hu'));
    expect(document.body.textContent).not.toContain('250–500');
  });

  it('has a described diagram', () => {
    render(<ConnectFourGame />);
    openRules();
    expect(within(dialog()).getByRole('img', { name: /Ábra/ })).toBeTruthy();
  });

  it('keeps the run when the language changes inside the rules', () => {
    render(<ConnectFourGame />);
    act(() => key('1'));
    act(() => key(' '));
    openRules();
    act(() => applyLang('de'));
    expect(screen.getByRole('heading', { level: 3, name: 'Ziel' })).toBeTruthy();
    expect(screen.getByRole('dialog', { name: /Regeln/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(screen.getByRole('dialog', { name: 'Pausiert' })).toBeTruthy();
  });
});
