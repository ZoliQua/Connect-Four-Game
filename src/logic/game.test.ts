import { describe, expect, it } from 'vitest';
import { duelRoundScore } from '../arcade';
import { advanceGame, aiPlayerFor, createInitialState, difficultyFor, isHumanTurn, roundOutcome } from './game';
import type { GameAction, GameState } from './types';

const drops = (s: GameState, ...cols: number[]) =>
  cols.reduce((acc, col) => advanceGame(acc, { type: 'drop', col }), s);
const apply = (s: GameState, ...actions: GameAction[]) => actions.reduce(advanceGame, s);

describe('createInitialState', () => {
  it('starts an empty round with player 1 to move and the cursor in the middle', () => {
    const s = createInitialState({ mode: 'medium' });
    expect(s).toMatchObject({ status: 'playing', current: 1, startingPlayer: 1, focusCol: 3, moves: [], points: 0 });
    expect(aiPlayerFor(s)).toBe(2);
    expect(aiPlayerFor(createInitialState())).toBeNull();
  });
});

describe('advanceGame', () => {
  it('alternates players, records moves and ignores full columns', () => {
    let s = drops(createInitialState(), 3, 3);
    expect(s.moves).toEqual([3, 3]);
    expect(s.current).toBe(1);
    s = drops(s, 3, 3, 3, 3);
    const before = s;
    expect(drops(s, 3)).toBe(before); // column 3 is full
  });

  it('wins with four in a row, scores the round and tallies the series', () => {
    const s = drops(createInitialState({ mode: 'pvp' }), 0, 0, 1, 1, 2, 2, 3);
    expect(s.status).toBe('won');
    expect(s.winner).toBe(1);
    expect(s.winningCells).toEqual([35, 36, 37, 38]);
    expect(s.scores).toEqual({ p1: 1, p2: 0, draws: 0 });
    expect(s.roundScore).toBe(0); // PvP is unranked
    expect(drops(s, 4)).toBe(s); // no drops after the round ends
  });

  it('scores a ranked win with duelRoundScore over the 42-cell board', () => {
    let s = createInitialState({ mode: 'hard' });
    // Human (1) bottom row; the AI's replies are fed as aiMove actions.
    s = apply(
      s,
      { type: 'drop', col: 0 },
      { type: 'aiMove', col: 0, ply: 1 },
      { type: 'drop', col: 1 },
      { type: 'aiMove', col: 1, ply: 3 },
      { type: 'drop', col: 2 },
      { type: 'aiMove', col: 2, ply: 5 },
      { type: 'drop', col: 3 },
    );
    const expected = duelRoundScore({ outcome: 'win', difficulty: 'hard', moves: 7, boardCells: 42 });
    expect(roundOutcome(s)).toBe('win');
    expect(s.roundScore).toBe(expected);
    expect(s.points).toBe(expected);
    expect(expected).toBe(Math.round(500 * (1 + 35 / 42)));
  });

  it('a loss scores 0 and a draw a quarter of the base', () => {
    const lost = apply(
      createInitialState({ mode: 'easy', startingPlayer: 2 }),
      { type: 'aiMove', col: 6, ply: 0 },
      { type: 'drop', col: 0 },
      { type: 'aiMove', col: 6, ply: 2 },
      { type: 'drop', col: 0 },
      { type: 'aiMove', col: 6, ply: 4 },
      { type: 'drop', col: 0 },
      { type: 'aiMove', col: 6, ply: 6 },
    );
    expect(lost.winner).toBe(2);
    expect(roundOutcome(lost)).toBe('loss');
    expect(lost.roundScore).toBe(0);
    expect(duelRoundScore({ outcome: 'draw', difficulty: difficultyFor('medium'), moves: 42, boardCells: 42 })).toBe(63);
  });

  it('declares a draw on a full board without four in a row', () => {
    const order = [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 2, 3, 2, 3, 2, 3, 3, 2, 3, 2, 3, 2, 4, 5, 4, 5, 4, 5, 5, 4, 5, 4, 5, 4, 6, 6, 6, 6, 6, 6];
    const s = drops(createInitialState({ mode: 'pvp' }), ...order);
    expect(s.status).toBe('draw');
    expect(s.winner).toBeNull();
    expect(s.scores.draws).toBe(1);
    expect(roundOutcome(s)).toBe('draw');
  });

  it('never lets a human drop on the AI turn; stale AI answers are ignored', () => {
    let s = createInitialState({ mode: 'medium' });
    s = drops(s, 3);
    expect(isHumanTurn(s)).toBe(false);
    expect(drops(s, 4)).toBe(s); // a click during the AI's thinking delay
    expect(advanceGame(s, { type: 'aiMove', col: 4, ply: 0 })).toBe(s); // searched an older position
    const after = advanceGame(s, { type: 'aiMove', col: 4, ply: 1 });
    expect(after.moves).toEqual([3, 4]);
    expect(advanceGame(after, { type: 'aiMove', col: 4, ply: 2 })).toBe(after); // human's turn now
    expect(advanceGame(createInitialState(), { type: 'aiMove', col: 3, ply: 0 }).moves).toEqual([]); // PvP has no AI
  });

  it('loser opens the next round; draws and abandoned rounds alternate the opener', () => {
    const won = drops(createInitialState({ mode: 'pvp' }), 0, 0, 1, 1, 2, 2, 3); // P1 wins
    const next = advanceGame(won, { type: 'newRound' });
    expect(next).toMatchObject({ startingPlayer: 2, current: 2, status: 'playing', moves: [], roundScore: 0 });
    expect(next.scores.p1).toBe(1); // the series survives
    const abandoned = advanceGame(drops(next, 3), { type: 'newRound' });
    expect(abandoned.startingPlayer).toBe(1);
  });

  it('changing mode starts a new series; reset keeps the board', () => {
    const won = drops(createInitialState({ mode: 'pvp' }), 0, 0, 1, 1, 2, 2, 3);
    const m = advanceGame(won, { type: 'changeMode', mode: 'hard' });
    expect(m).toMatchObject({ mode: 'hard', scores: { p1: 0, p2: 0, draws: 0 }, points: 0, moves: [], startingPlayer: 1 });
    const mid = drops(createInitialState({ mode: 'pvp' }), 3);
    const reset = advanceGame({ ...mid, points: 99, scores: { p1: 2, p2: 1, draws: 1 } }, { type: 'resetScores' });
    expect(reset).toMatchObject({ points: 0, scores: { p1: 0, p2: 0, draws: 0 }, moves: [3] });
  });

  it('moves the column cursor within the board only', () => {
    const s = createInitialState();
    expect(advanceGame(s, { type: 'focus', col: 6 }).focusCol).toBe(6);
    expect(advanceGame(s, { type: 'focus', col: 7 })).toBe(s);
    expect(advanceGame(s, { type: 'focus', col: 3 })).toBe(s);
  });
});
