import { describe, expect, it } from 'vitest';
import { advanceGame, createInitialState } from './game';
import { isConnectFourSession, type SavedGame } from './persist';
import type { GameState } from './types';

const drops = (s: GameState, ...cols: number[]) => cols.reduce((acc, col) => advanceGame(acc, { type: 'drop', col }), s);
const DRAW = [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 2, 3, 2, 3, 2, 3, 3, 2, 3, 2, 3, 2, 4, 5, 4, 5, 4, 5, 5, 4, 5, 4, 5, 4, 6, 6, 6, 6, 6, 6];
const roundTrip = (s: SavedGame): unknown => JSON.parse(JSON.stringify(s));

describe('isConnectFourSession', () => {
  const fresh = createInitialState({ mode: 'medium' });
  const mid = drops(createInitialState({ mode: 'pvp' }), 3, 3, 4);
  const won = drops(createInitialState({ mode: 'pvp' }), 0, 0, 1, 1, 2, 2, 3);
  const drawn = drops(createInitialState({ mode: 'pvp' }), ...DRAW);
  const p2Opens = drops(createInitialState({ mode: 'hard', startingPlayer: 2 }), 3);

  it('accepts real states (fresh, mid-round, won, drawn, player 2 opening) after a JSON round trip', () => {
    for (const s of [fresh, mid, won, drawn, p2Opens]) expect(isConnectFourSession(roundTrip(s))).toBe(true);
  });

  it('rejects non-objects and missing / mistyped fields', () => {
    for (const v of [null, undefined, 42, 'x', [], true]) expect(isConnectFourSession(v)).toBe(false);
    const bad: Partial<Record<keyof SavedGame, unknown>>[] = [
      { mode: 'insane' },
      { status: 'idle' },
      { current: 3 },
      { humanPlayer: 0 },
      { startingPlayer: '1' },
      { winner: 2 },
      { scores: { p1: -1, p2: 0, draws: 0 } },
      { scores: { p1: 1.5, p2: 0, draws: 0 } },
      { scores: null },
      { points: -10 },
      { points: '100' },
      { roundScore: Number.NaN },
      { focusCol: 7 },
      { board: [] },
      { board: Array(42).fill(3) },
      { moves: [7] },
      { moves: 'abc' },
      { winningCells: [1, -1] },
    ];
    for (const patch of bad) expect(isConnectFourSession({ ...mid, ...patch })).toBe(false);
    const { moves, ...noMoves } = mid;
    void moves;
    expect(isConnectFourSession(noMoves)).toBe(false);
  });

  it('rejects impossible positions: board / moves mismatch, floating discs, wrong turn', () => {
    const floating = [...mid.board];
    floating[3] = 1; // top row of column 3 with gaps below
    expect(isConnectFourSession({ ...mid, board: floating })).toBe(false);
    expect(isConnectFourSession({ ...mid, moves: [3, 4, 3] })).toBe(false); // other order, other board
    expect(isConnectFourSession({ ...mid, current: 1 })).toBe(false);
    expect(isConnectFourSession({ ...mid, startingPlayer: 2 })).toBe(false);
    expect(isConnectFourSession({ ...fresh, moves: [0, 0, 0, 0, 0, 0, 0], board: fresh.board })).toBe(false);
  });

  it('requires status, winner and highlight to agree with the board', () => {
    expect(isConnectFourSession({ ...won, status: 'playing', winner: null, winningCells: null, roundScore: 0 })).toBe(false);
    expect(isConnectFourSession({ ...won, winner: 2 })).toBe(false);
    expect(isConnectFourSession({ ...won, winningCells: [35, 36, 37] })).toBe(false);
    expect(isConnectFourSession({ ...mid, status: 'won', winner: 1, winningCells: [35, 36, 37, 38] })).toBe(false);
    expect(isConnectFourSession({ ...mid, status: 'draw' })).toBe(false);
    expect(isConnectFourSession({ ...drawn, status: 'playing' })).toBe(false);
    expect(isConnectFourSession({ ...mid, roundScore: 100 })).toBe(false); // no score while playing
    // a disc after the winning move
    const after = { ...won, moves: [...won.moves, 6] };
    expect(isConnectFourSession(after)).toBe(false);
  });
});
