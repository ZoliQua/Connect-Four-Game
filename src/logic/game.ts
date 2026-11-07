import { duelRoundScore, type DuelDifficulty, type RunOutcome } from '../arcade';
import { dropDisc, EMPTY_BOARD, isBoardFull, isColumn, other, winningCellsAt } from './board';
import { BOARD_CELLS, CENTER_COL } from './constants';
import type { GameAction, GameState, Mode, Player } from './types';

export const MODES: readonly Mode[] = ['pvp', 'easy', 'medium', 'hard'] as const;

/** The AI's side, or null in local two-player mode. */
export const aiPlayerFor = (state: Pick<GameState, 'mode' | 'humanPlayer'>): Player | null =>
  state.mode === 'pvp' ? null : other(state.humanPlayer);

/** True when a human may drop now: the round is on and it is not the AI's turn. */
export const isHumanTurn = (state: Pick<GameState, 'mode' | 'humanPlayer' | 'current' | 'status'>): boolean =>
  state.status === 'playing' && state.current !== aiPlayerFor(state);

/** Difficulty fed to `duelRoundScore`; null (unranked) for PvP. */
export const difficultyFor = (mode: Mode): DuelDifficulty | null => (mode === 'pvp' ? null : mode);

/**
 * How a finished round ended from the human's side. In PvP the "human" is
 * player 1: the round is unranked there anyway.
 */
export const roundOutcome = (state: Pick<GameState, 'status' | 'winner' | 'humanPlayer'>): RunOutcome => {
  if (state.status === 'draw' || state.winner === null) return 'draw';
  return state.winner === state.humanPlayer ? 'win' : 'loss';
};

export type CreateInitialOptions = {
  mode?: Mode;
  humanPlayer?: Player;
  startingPlayer?: Player;
};

export const createInitialState = (opts: CreateInitialOptions = {}): GameState => {
  const startingPlayer = opts.startingPlayer ?? 1;
  return {
    board: EMPTY_BOARD,
    moves: [],
    current: startingPlayer,
    status: 'playing',
    winner: null,
    winningCells: null,
    mode: opts.mode ?? 'pvp',
    humanPlayer: opts.humanPlayer ?? 1,
    startingPlayer,
    scores: { p1: 0, p2: 0, draws: 0 },
    focusCol: CENTER_COL,
    points: 0,
    roundScore: 0,
  };
};

/** Scores a finished round with the shared arcade duel formula. */
const scoreRound = (state: GameState): GameState => {
  const roundScore = duelRoundScore({
    outcome: roundOutcome(state),
    difficulty: difficultyFor(state.mode),
    moves: state.moves.length,
    boardCells: BOARD_CELLS,
  });
  return { ...state, roundScore, points: state.points + roundScore };
};

/** Drops the side to move's disc into `col` and resolves win / draw. */
const applyDrop = (state: GameState, col: number): GameState => {
  if (state.status !== 'playing' || !isColumn(col)) return state;
  const res = dropDisc(state.board, col, state.current);
  if (!res) return state;
  const moves = [...state.moves, col];
  const winningCells = winningCellsAt(res.board, res.index);
  if (winningCells) {
    const winner = state.current;
    return scoreRound({
      ...state,
      board: res.board,
      moves,
      current: other(state.current),
      status: 'won',
      winner,
      winningCells,
      scores: {
        ...state.scores,
        p1: state.scores.p1 + (winner === 1 ? 1 : 0),
        p2: state.scores.p2 + (winner === 2 ? 1 : 0),
      },
    });
  }
  if (isBoardFull(res.board)) {
    return scoreRound({
      ...state,
      board: res.board,
      moves,
      current: other(state.current),
      status: 'draw',
      scores: { ...state.scores, draws: state.scores.draws + 1 },
    });
  }
  return { ...state, board: res.board, moves, current: other(state.current) };
};

/** A fresh, empty round on top of the current series. */
const freshRound = (state: GameState, startingPlayer: Player): GameState => ({
  ...state,
  board: EMPTY_BOARD,
  moves: [],
  current: startingPlayer,
  startingPlayer,
  status: 'playing',
  winner: null,
  winningCells: null,
  focusCol: CENTER_COL,
  roundScore: 0,
});

/** The pure reducer of the engine. Never calls the AI: the AI's column arrives in `aiMove`. */
export const advanceGame = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'drop':
      // Human input only: never drop a disc for the AI (e.g. a click or Enter
      // during the AI's thinking delay).
      if (!isHumanTurn(state)) return state;
      return applyDrop(state, action.col);

    case 'aiMove': {
      if (state.status !== 'playing') return state;
      const ai = aiPlayerFor(state);
      if (ai === null || state.current !== ai) return state;
      // A stale answer for a position that has changed since the search started.
      if (action.ply !== state.moves.length) return state;
      return applyDrop(state, action.col);
    }

    case 'newRound': {
      // Loser-goes-first (as in Tic-Tac-Toe and Gomoku): after a decided round
      // the loser opens the next one; after a draw or an abandoned round the
      // opener alternates.
      const next: Player =
        state.status === 'won' && state.winner !== null ? other(state.winner) : other(state.startingPlayer);
      return freshRound(state, next);
    }

    case 'changeMode':
      // A new mode starts a new series: scores and points reset, player 1 opens.
      return {
        ...freshRound(state, 1),
        mode: action.mode,
        scores: { p1: 0, p2: 0, draws: 0 },
        points: 0,
      };

    case 'resetScores':
      return { ...state, scores: { p1: 0, p2: 0, draws: 0 }, points: 0 };

    case 'focus':
      if (!isColumn(action.col) || action.col === state.focusCol) return state;
      return { ...state, focusCol: action.col };
  }
};
