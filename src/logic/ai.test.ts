import { describe, expect, it } from 'vitest';
import { AI_LEVELS, chooseMove, DECIDED, scoreMoves, searchBestMove, threatColumn, winningColumn } from './ai';
import { seededRng } from './autopilot';
import { dropDisc, other, replayMoves, validColumns, winningCellsAt } from './board';
import { BOARD_CELLS } from './constants';
import { out, Position } from './bitboard';
import type { Board, Player } from './types';

const LEVELS = ['easy', 'medium', 'hard'] as const;
const RNGS = [() => 0, () => 0.5, () => 0.999];

/** Exact game value (+1 win / 0 draw / −1 loss for the side to move) by plain minimax. */
function solve(board: Board, player: Player): number {
  const cols = validColumns(board);
  if (cols.length === 0) return 0;
  let best = -1;
  for (const c of cols) {
    const res = dropDisc(board, c, player)!;
    if (winningCellsAt(res.board, res.index)) return 1;
  }
  for (const c of cols) {
    const v = -solve(dropDisc(board, c, player)!.board, other(player));
    if (v > best) best = v;
    if (best === 1) break;
  }
  return best;
}

describe('AI', () => {
  it('always takes an immediate win, at every level', () => {
    // P1 has three on the bottom row (0, 1, 2); P2 stacked on top.
    const moves = [0, 0, 1, 1, 2, 2];
    for (const level of LEVELS) for (const rng of RNGS) expect(chooseMove(moves, 1, level, rng)).toBe(3);
    // A vertical win for P2 beats blocking P1's (non-existent) threat.
    expect(chooseMove([0, 6, 1, 6, 0, 6, 1], 1, 'medium', () => 0.5)).toBe(6);
  });

  it('blocks an immediate threat at Medium and Hard, whatever the dice', () => {
    // P1 owns 0, 1, 2 on the bottom row and threatens column 3; P2 must block.
    const moves = [0, 6, 1, 6, 2];
    expect(threatColumn(Position.fromMoves(moves))).toBe(3);
    for (const level of ['medium', 'hard'] as const) {
      for (const rng of RNGS) expect(chooseMove(moves, 1, level, rng)).toBe(3);
    }
  });

  it('Easy blocks usually but can blunder a block away', () => {
    // P1 threatens a vertical four in column 0; P2 (Easy) to move.
    const moves = [0, 3, 0, 3, 0];
    expect(chooseMove(moves, 1, 'easy', () => 0.9)).toBe(0); // no blunder: blocks
    expect(chooseMove(moves, 1, 'easy', () => 0)).not.toBe(0); // blunder roll: a random column
  });

  it('never hands the opponent an immediate win when a safe drop exists (random positions)', () => {
    const rng = seededRng(5);
    let tested = 0;
    let hardTested = 0;
    for (let attempt = 0; tested < 60 && attempt < 1000; attempt += 1) {
      const moves: number[] = [];
      const length = 6 + Math.floor(rng() * 24);
      let alive = true;
      while (moves.length < length && alive) {
        const r = replayMoves(moves, 1)!;
        const cols = validColumns(r.board);
        moves.push(cols[Math.floor(rng() * cols.length)]);
        alive = replayMoves(moves, 1)?.winner === null;
      }
      if (!alive) continue;
      const pos = Position.fromMoves(moves);
      if (winningColumn(pos) >= 0) continue;
      pos.nonLosingMoves();
      if ((out.lo | out.hi) === 0) continue; // lost anyway
      const levels = hardTested < 6 ? (['medium', 'hard'] as const) : (['medium'] as const);
      for (const level of levels) {
        const col = chooseMove(moves, 1, level, rng);
        expect(winningColumn(Position.fromMoves([...moves, col]))).toBe(-1);
      }
      if (levels.length === 2) hardTested += 1;
      tested += 1;
    }
    expect(tested).toBe(60);
  });

  it('solves endgames exactly (matches plain minimax on random positions)', () => {
    const rng = seededRng(2024);
    let tested = 0;
    while (tested < 25) {
      // Random game to 34 discs without a winner so far.
      const moves: number[] = [];
      let board: Board | null = null;
      let ok = true;
      for (let i = 0; i < 34 && ok; i += 1) {
        const r = replayMoves(moves, 1)!;
        const cols = validColumns(r.board);
        moves.push(cols[Math.floor(rng() * cols.length)]);
        const next = replayMoves(moves, 1);
        ok = next !== null && next.winner === null;
        board = next?.board ?? null;
      }
      if (!ok || !board) continue;
      const toMove: Player = moves.length % 2 === 0 ? 1 : 2;
      const exact = solve(board, toMove);
      const { score } = searchBestMove(moves, 1, { maxDepth: BOARD_CELLS });
      const sign = score > DECIDED ? 1 : score < -DECIDED ? -1 : 0;
      expect(sign).toBe(exact);
      tested += 1;
    }
  });

  it('finds a forced win the opponent cannot stop (double threat)', () => {
    // P1: 2, 3 on the bottom row with 1 and 4, 5 open; P2 stacked harmlessly.
    // P1 to move plays 4 (or 1) and wins next turn whatever P2 does.
    const moves = [2, 2, 3, 3];
    const r = searchBestMove(moves, 1, { maxDepth: 6 });
    expect([1, 4]).toContain(r.col);
    expect(r.score).toBeGreaterThan(DECIDED);
  });

  it('Hard opens in the centre and deepens to at least 10 plies within its budget', () => {
    const r = searchBestMove([], 1, {
      maxDepth: AI_LEVELS.hard.depth,
      timeMs: AI_LEVELS.hard.timeMs,
      minDepth: AI_LEVELS.hard.minDepth,
      nodeLimit: AI_LEVELS.hard.nodeLimit,
    });
    expect(r.col).toBe(3);
    expect(r.depth).toBeGreaterThanOrEqual(10);
  });

  it('respects the time budget via the injected clock (and keeps the last full depth)', () => {
    let t = 0;
    const now = () => (t += 1); // 1 ms per clock read: the budget runs out quickly
    const r = searchBestMove([], 1, { maxDepth: 42, timeMs: 5, minDepth: 2, now });
    expect(r.depth).toBeGreaterThanOrEqual(2);
    expect(r.depth).toBeLessThan(42);
    expect(r.col).toBeGreaterThanOrEqual(0);
  });

  it('scores every legal root move and marks full columns null', () => {
    const { scores } = scoreMoves([0, 0, 0, 0, 0, 0], 1, 2);
    expect(scores[0]).toBeNull();
    expect(scores.slice(1).every((s) => typeof s === 'number')).toBe(true);
    const drawn = [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 2, 3, 2, 3, 2, 3, 3, 2, 3, 2, 3, 2, 4, 5, 4, 5, 4, 5, 5, 4, 5, 4, 5, 4, 6, 6, 6, 6, 6, 6];
    expect(chooseMove(drawn, 1, 'hard', () => 0)).toBe(-1); // full board: no move
  });

  it('a deep search beats Medium', () => {
    const rng = seededRng(99);
    let deepWins = 0;
    for (let g = 0; g < 3; g += 1) {
      const moves: number[] = [];
      let winner: Player | null = null;
      while (moves.length < BOARD_CELLS && winner === null) {
        const deepToMove = moves.length % 2 === 0; // deep search plays player 1
        const col = deepToMove
          ? searchBestMove(moves, 1, { maxDepth: 10 }).col
          : chooseMove(moves, 1, 'medium', rng);
        moves.push(col);
        winner = replayMoves(moves, 1)!.winner;
      }
      if (winner === 1) deepWins += 1;
    }
    expect(deepWins).toBeGreaterThanOrEqual(2);
  });
});
