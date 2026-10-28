import { isColumn, isBoardFull, other, replayMoves } from './board';
import { BOARD_CELLS } from './constants';
import { MODES } from './game';
import type { GameState, Mode, Player, RoundStatus } from './types';

/** What a saved session stores: the whole series (board, scores, points, mode). */
export type SavedGame = GameState;

const STATUSES: readonly RoundStatus[] = ['playing', 'won', 'draw'];

const isNonNegInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const isPlayer = (v: unknown): v is Player => v === 1 || v === 2;

function isScores(v: unknown): boolean {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const s = v as Record<string, unknown>;
  return isNonNegInt(s.p1) && isNonNegInt(s.p2) && isNonNegInt(s.draws);
}

const sameCells = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Guards a saved Connect Four session before it is trusted as game state.
 * Besides field types it replays the saved column list from an empty board
 * and requires the result to match exactly: the board, the side to move, the
 * status, the winner and the highlighted cells — so a tampered or corrupted
 * save can never produce an impossible position (floating discs, a disc after
 * a win, wrong turn order).
 */
export function isConnectFourSession(v: unknown): v is SavedGame {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const s = v as Record<string, unknown>;

  if (!MODES.includes(s.mode as Mode)) return false;
  if (!STATUSES.includes(s.status as RoundStatus)) return false;
  if (!isPlayer(s.current) || !isPlayer(s.humanPlayer) || !isPlayer(s.startingPlayer)) return false;
  if (!(s.winner === null || isPlayer(s.winner))) return false;
  if (!isScores(s.scores)) return false;
  if (!isNonNegInt(s.points) || !isNonNegInt(s.roundScore)) return false;
  if (!isColumn(s.focusCol)) return false;
  if (!Array.isArray(s.board) || s.board.length !== BOARD_CELLS) return false;
  if (!s.board.every((c) => c === 0 || c === 1 || c === 2)) return false;
  if (!Array.isArray(s.moves) || s.moves.length > BOARD_CELLS || !s.moves.every(isColumn)) return false;
  if (!(s.winningCells === null || (Array.isArray(s.winningCells) && s.winningCells.every(isNonNegInt)))) return false;

  const replay = replayMoves(s.moves as number[], s.startingPlayer as Player);
  if (!replay || !sameCells(replay.board, s.board)) return false;
  const toMove = s.moves.length % 2 === 0 ? (s.startingPlayer as Player) : other(s.startingPlayer as Player);
  if (s.current !== toMove) return false;

  const status = s.status as RoundStatus;
  if (status === 'playing') {
    return (
      replay.winner === null &&
      !isBoardFull(replay.board) &&
      s.winner === null &&
      s.winningCells === null &&
      s.roundScore === 0
    );
  }
  if (status === 'won') {
    return (
      replay.winner !== null &&
      s.winner === replay.winner &&
      Array.isArray(s.winningCells) &&
      replay.winningCells !== null &&
      sameCells(s.winningCells, replay.winningCells)
    );
  }
  // draw
  return replay.winner === null && isBoardFull(replay.board) && s.winner === null && s.winningCells === null;
}
