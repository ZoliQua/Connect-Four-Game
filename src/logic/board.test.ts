import { describe, expect, it } from 'vitest';
import {
  canDrop,
  cellIndex,
  columnHeight,
  dropDisc,
  EMPTY_BOARD,
  findWinner,
  isBoardFull,
  landingRow,
  replayMoves,
  validColumns,
  winningCellsAt,
} from './board';
import { BOARD_CELLS, COLS, ROWS } from './constants';
import type { Board, Player } from './types';

const play = (moves: number[], first: Player = 1): Board => {
  const r = replayMoves(moves, first);
  if (!r) throw new Error('illegal');
  return r.board;
};

describe('board rules', () => {
  it('has 7 × 6 empty cells to start', () => {
    expect(EMPTY_BOARD).toHaveLength(BOARD_CELLS);
    expect(EMPTY_BOARD.every((c) => c === 0)).toBe(true);
    expect(validColumns(EMPTY_BOARD)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('drops discs to the lowest empty cell and stacks them', () => {
    const a = dropDisc(EMPTY_BOARD, 2, 1);
    expect(a?.index).toBe(cellIndex(ROWS - 1, 2));
    const b = dropDisc(a!.board, 2, 2);
    expect(b?.index).toBe(cellIndex(ROWS - 2, 2));
    expect(columnHeight(b!.board, 2)).toBe(2);
    // the input board is never mutated
    expect(EMPTY_BOARD[cellIndex(ROWS - 1, 2)]).toBe(0);
  });

  it('rejects a full column and invalid columns', () => {
    const full = play([0, 0, 0, 0, 0, 0]);
    expect(landingRow(full, 0)).toBe(-1);
    expect(canDrop(full, 0)).toBe(false);
    expect(dropDisc(full, 0, 1)).toBeNull();
    for (const bad of [-1, 7, 1.5, Number.NaN]) expect(dropDisc(EMPTY_BOARD, bad, 1)).toBeNull();
    expect(validColumns(full)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('detects horizontal, vertical and both diagonal fours', () => {
    // horizontal on the bottom row
    const h = replayMoves([0, 0, 1, 1, 2, 2, 3], 1)!;
    expect(h.winner).toBe(1);
    expect(h.winningCells).toEqual([35, 36, 37, 38]);
    // vertical
    const v = replayMoves([4, 5, 4, 5, 4, 5, 4], 1)!;
    expect(v.winner).toBe(1);
    expect(v.winningCells).toEqual([4 + 7 * 2, 4 + 7 * 3, 4 + 7 * 4, 4 + 7 * 5]);
    // diagonal ↗ for player 1: (5,0) (4,1) (3,2) (2,3)
    const d1 = replayMoves([0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3], 1)!;
    expect(d1.winner).toBe(1);
    expect(d1.winningCells).toEqual([cellIndex(2, 3), cellIndex(3, 2), cellIndex(4, 1), cellIndex(5, 0)]);
    // diagonal ↖ (mirror image)
    const d2 = replayMoves([6, 5, 5, 4, 4, 3, 4, 3, 3, 0, 3], 1)!;
    expect(d2.winner).toBe(1);
    expect(d2.winningCells).toEqual([cellIndex(2, 3), cellIndex(3, 4), cellIndex(4, 5), cellIndex(5, 6)]);
  });

  it('highlights every cell of a five-long line and of crossing lines', () => {
    // P1 bottom row 0,1,_,3,4 then fills 2 → five in a row
    const five = replayMoves([0, 0, 1, 1, 3, 3, 4, 4, 2], 1)!;
    expect(five.winningCells).toEqual([35, 36, 37, 38, 39]);
    const none = replayMoves([0, 1, 0, 1, 0, 1], 1)!;
    expect(none.winner).toBeNull();
    expect(winningCellsAt(none.board, cellIndex(5, 0))).toBeNull();
  });

  it('does not wrap lines across the board edge', () => {
    // 4, 5, 6 on the bottom row and 0 on the row above must not connect.
    const b = play([4, 4, 5, 5, 6, 0, 0], 1);
    expect(findWinner(b)).toBeNull();
  });

  it('replay rejects moves after a win and moves into full columns', () => {
    expect(replayMoves([0, 1, 0, 1, 0, 1, 0, 1], 1)).toBeNull();
    expect(replayMoves([2, 2, 2, 2, 2, 2, 2], 1)).toBeNull();
    expect(replayMoves([3], 2)!.board[cellIndex(5, 3)]).toBe(2);
  });

  it('a full board without four in a row is full and has no winner', () => {
    // Columns filled in pairs with alternating owners: no line of four anywhere.
    const order = [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 2, 3, 2, 3, 2, 3, 3, 2, 3, 2, 3, 2, 4, 5, 4, 5, 4, 5, 5, 4, 5, 4, 5, 4, 6, 6, 6, 6, 6, 6];
    const r = replayMoves(order, 1)!;
    expect(r).not.toBeNull();
    expect(r.winner).toBeNull();
    expect(isBoardFull(r.board)).toBe(true);
    expect(findWinner(r.board)).toBeNull();
    expect(COLS * ROWS).toBe(order.length);
  });
});
