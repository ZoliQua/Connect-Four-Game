import { BOARD_CELLS, COLS, CONNECT, ROWS } from './constants';
import type { Board, Cell, Player } from './types';

/** Pure board rules on the render-friendly 42-cell array (row 0 = top). */

export const EMPTY_BOARD: Board = Object.freeze(Array<Cell>(BOARD_CELLS).fill(0));

export const cellIndex = (row: number, col: number): number => row * COLS + col;
export const rowOf = (index: number): number => Math.floor(index / COLS);
export const colOf = (index: number): number => index % COLS;

export const isColumn = (col: unknown): col is number =>
  typeof col === 'number' && Number.isInteger(col) && col >= 0 && col < COLS;

export const other = (player: Player): Player => (player === 1 ? 2 : 1);

/** Row a disc dropped into `col` lands on, or -1 when the column is full. */
export function landingRow(board: Board, col: number): number {
  if (!isColumn(col)) return -1;
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (board[cellIndex(row, col)] === 0) return row;
  }
  return -1;
}

export const canDrop = (board: Board, col: number): boolean => landingRow(board, col) >= 0;

/** Columns that still have room, left to right. */
export function validColumns(board: Board): number[] {
  const out: number[] = [];
  for (let col = 0; col < COLS; col += 1) if (board[col] === 0) out.push(col);
  return out;
}

/** Discs already in a column (0–6). */
export function columnHeight(board: Board, col: number): number {
  let n = 0;
  for (let row = 0; row < ROWS; row += 1) if (board[cellIndex(row, col)] !== 0) n += 1;
  return n;
}

export const isBoardFull = (board: Board): boolean => validColumns(board).length === 0;

/** Drops `player`'s disc into `col`. Returns null when the column is full or invalid. */
export function dropDisc(board: Board, col: number, player: Player): { board: Board; index: number } | null {
  const row = landingRow(board, col);
  if (row < 0) return null;
  const index = cellIndex(row, col);
  const next = board.slice();
  next[index] = player;
  return { board: next, index };
}

const DIRECTIONS: readonly (readonly [dr: number, dc: number])[] = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal ↘
  [1, -1], // diagonal ↙
];

/**
 * Cells of every line of four or more through `index` that belong to the
 * disc's owner (ascending, deduplicated), or null when the disc wins nothing.
 */
export function winningCellsAt(board: Board, index: number): number[] | null {
  const player = board[index];
  if (player === 0 || player === undefined) return null;
  const row = rowOf(index);
  const col = colOf(index);
  const cells = new Set<number>();
  for (const [dr, dc] of DIRECTIONS) {
    const line = [index];
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[cellIndex(r, c)] === player) {
        line.push(cellIndex(r, c));
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (line.length >= CONNECT) for (const i of line) cells.add(i);
  }
  return cells.size > 0 ? [...cells].sort((a, b) => a - b) : null;
}

/** Any four in a row on the board: the owner, or null. Scans every cell. */
export function findWinner(board: Board): Player | null {
  for (let i = 0; i < BOARD_CELLS; i += 1) {
    const p = board[i];
    if (p !== 0 && winningCellsAt(board, i) !== null) return p;
  }
  return null;
}

/** Replays a column list from an empty board. Null if a move is illegal or comes after a win. */
export function replayMoves(
  moves: readonly number[],
  startingPlayer: Player,
): { board: Board; lastIndex: number; winner: Player | null; winningCells: number[] | null } | null {
  let board = EMPTY_BOARD;
  let player = startingPlayer;
  let lastIndex = -1;
  let winningCells: number[] | null = null;
  let winner: Player | null = null;
  for (const col of moves) {
    if (winner !== null) return null;
    const res = dropDisc(board, col, player);
    if (!res) return null;
    board = res.board;
    lastIndex = res.index;
    winningCells = winningCellsAt(board, res.index);
    if (winningCells) winner = player;
    player = other(player);
  }
  return { board, lastIndex, winner, winningCells };
}
