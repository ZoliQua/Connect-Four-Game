import { describe, expect, it } from 'vitest';
import { seededRng } from './autopilot';
import { cellIndex, dropDisc, EMPTY_BOARD, landingRow, other, validColumns, winningCellsAt } from './board';
import { COLS, ROWS } from './constants';
import { hasFour, out, popcount, Position, WINDOW_COUNT } from './bitboard';
import type { Board, Player } from './types';

/** Random legal games (stopping at the first win) as mailbox boards + bitboard positions. */
function* randomGames(seed: number, count: number) {
  const rng = seededRng(seed);
  for (let g = 0; g < count; g += 1) {
    let board: Board = EMPTY_BOARD;
    let player: Player = 1;
    const pos = new Position();
    const moves: number[] = [];
    for (;;) {
      yield { board, pos, player, moves: [...moves] };
      const cols = validColumns(board);
      if (cols.length === 0) break;
      const col = cols[Math.floor(rng() * cols.length)];
      const res = dropDisc(board, col, player)!;
      board = res.board;
      pos.play(col);
      moves.push(col);
      if (winningCellsAt(board, res.index)) break;
      player = other(player);
    }
  }
}

/** Brute force on the mailbox: does `player` win by dropping into `col`? */
const winsWith = (board: Board, col: number, player: Player) => {
  const res = dropDisc(board, col, player);
  return res !== null && winningCellsAt(res.board, res.index) !== null;
};

const playableMaskCols = (lo: number, hi: number): number[] => {
  const cols: number[] = [];
  for (let c = 0; c < COLS; c += 1) {
    const colBits = c < 4 ? (lo >>> (c * 7)) & 0x7f : (hi >>> ((c - 4) * 7)) & 0x7f;
    if (colBits !== 0) cols.push(c);
  }
  return cols;
};

describe('bitboard', () => {
  it('counts bits and enumerates the 69 lines of four', () => {
    expect(popcount(0)).toBe(0);
    expect(popcount(0x0fffffff)).toBe(28);
    expect(popcount(0b1011)).toBe(3);
    expect(WINDOW_COUNT).toBe(69);
  });

  it('agrees with the mailbox rules on wins, immediate wins and safe moves (random games)', () => {
    let checked = 0;
    for (const { board, pos, player } of randomGames(42, 120)) {
      const lastMover = other(player);
      const mailboxWin = board.some((c, i) => c === lastMover && winningCellsAt(board, i) !== null);
      expect(pos.moves === 0 ? false : pos.lastMoverWon()).toBe(mailboxWin);
      if (mailboxWin) continue;

      const legal = validColumns(board);
      const myWins = legal.filter((c) => winsWith(board, c, player));
      expect(legal.filter((c) => pos.isWinningMove(c))).toEqual(myWins);
      expect(pos.canWinNext()).toBe(myWins.length > 0);

      if (myWins.length === 0 && legal.length > 0) {
        // Safe = after my drop the opponent has no immediate winning reply.
        const safe = legal.filter((c) => {
          const b = dropDisc(board, c, player)!.board;
          return !validColumns(b).some((oc) => winsWith(b, oc, lastMover));
        });
        pos.nonLosingMoves();
        expect(playableMaskCols(out.lo, out.hi)).toEqual(safe);
      }
      checked += 1;
    }
    expect(checked).toBeGreaterThan(1500);
  });

  it('undo restores bitboards and the incremental heuristic exactly', () => {
    const rng = seededRng(7);
    const pos = new Position();
    const snapshots: string[] = [];
    const snap = () => JSON.stringify([pos.sLo, pos.sHi, pos.maskLo, pos.maskHi, pos.score, pos.side, [...pos.heights]]);
    for (let i = 0; i < 30; i += 1) {
      snapshots.push(snap());
      const cols = [0, 1, 2, 3, 4, 5, 6].filter((c) => pos.canPlay(c));
      pos.play(cols[Math.floor(rng() * cols.length)]);
    }
    for (let i = 29; i >= 0; i -= 1) {
      pos.undo();
      expect(snap()).toBe(snapshots[i]);
    }
    expect(pos.score).toBe(0);
  });

  it('keys are unique per position and independent of move order', () => {
    const a = Position.fromMoves([3, 2, 4, 3]);
    const b = Position.fromMoves([4, 2, 3, 3]); // same discs, other order
    expect([a.keyLo(), a.keyHi()]).toEqual([b.keyLo(), b.keyHi()]);
    const c = Position.fromMoves([3, 2, 3, 4]);
    expect([a.keyLo(), a.keyHi()]).not.toEqual([c.keyLo(), c.keyHi()]);
  });

  it('detects lines that cross the 32-bit halves (columns 3 | 4)', () => {
    const bit = (col: number, row: number) => (col < 4 ? [1 << (col * 7 + row), 0] : [0, 1 << ((col - 4) * 7 + row)]);
    const set = (cells: [number, number][]) =>
      cells.reduce(([lo, hi], [c, r]) => {
        const [bl, bh] = bit(c, r);
        return [lo | bl, hi | bh];
      }, [0, 0]);
    const [hLo, hHi] = set([[2, 0], [3, 0], [4, 0], [5, 0]]);
    expect(hasFour(hLo, hHi)).toBe(true);
    const [dLo, dHi] = set([[2, 0], [3, 1], [4, 2], [5, 3]]);
    expect(hasFour(dLo, dHi)).toBe(true);
    const [eLo, eHi] = set([[3, 5], [4, 4], [5, 3], [6, 2]]);
    expect(hasFour(eLo, eHi)).toBe(true);
    // a column top next to the next column's bottom is not a line
    const [wLo, wHi] = set([[3, 4], [3, 5], [4, 0], [4, 1]]);
    expect(hasFour(wLo, wHi)).toBe(false);
  });

  it('places discs at the same cells as the mailbox board', () => {
    const pos = Position.fromMoves([3, 3, 4]);
    expect([...pos.heights]).toEqual([0, 0, 0, 2, 1, 0, 0]);
    let b: Board = EMPTY_BOARD;
    for (const [i, c] of [3, 3, 4].entries()) b = dropDisc(b, c, i % 2 === 0 ? 1 : 2)!.board;
    expect(landingRow(b, 3)).toBe(ROWS - 3);
    expect(b[cellIndex(ROWS - 1, 4)]).toBe(1);
  });
});
