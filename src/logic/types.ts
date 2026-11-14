/** Player 1 plays red discs (the human against the AI), player 2 yellow. */
export type Player = 1 | 2;

/** 0 = empty hole. */
export type Cell = 0 | Player;

/**
 * 42 cells in row-major order with row 0 at the TOP (render order):
 * `index = row * COLS + col`. Always exactly `BOARD_CELLS` long.
 */
export type Board = readonly Cell[];

/**
 * Round state of the pure engine. The arcade lifecycle (idle / running /
 * paused / gameOver) is layered on top of it in ConnectFourGame.tsx.
 */
export type RoundStatus = 'playing' | 'won' | 'draw';

export type Mode = 'pvp' | 'easy' | 'medium' | 'hard';

/** Rounds won by each player and drawn rounds in the current series (match). */
export type Scores = { p1: number; p2: number; draws: number };

export type GameState = {
  board: Board;
  /** Columns played this round, in order — the board is a pure function of it. */
  moves: readonly number[];
  /** Side to move (after a finished round: the side that would have moved next). */
  current: Player;
  status: RoundStatus;
  winner: Player | null;
  /** Every cell of every four-or-longer line made by the winning disc, ascending. */
  winningCells: readonly number[] | null;
  mode: Mode;
  /** The human's side against the AI (player 1 in PvP). */
  humanPlayer: Player;
  /** Who opened this round. */
  startingPlayer: Player;
  scores: Scores;
  /** Keyboard / hover column cursor, 0–6. */
  focusCol: number;
  /** Series total of round scores — `duelRoundScore` summed. */
  points: number;
  /** Score of the current round: 0 while playing, set when the round ends. */
  roundScore: number;
  /** Set by Finish early: the match is over (runtime only, never saved). */
  finishedEarly?: boolean;
};

export type GameAction =
  /** A human drop (rejected on the AI's turn). */
  | { type: 'drop'; col: number }
  /**
   * The AI's chosen column. `ply` is the move count the AI searched; a stale
   * answer (the position changed meanwhile) is ignored.
   */
  | { type: 'aiMove'; col: number; ply: number }
  | { type: 'newRound' }
  | { type: 'changeMode'; mode: Mode }
  | { type: 'resetScores' }
  | { type: 'focus'; col: number }
  /** Finish early: ends the whole match; the current round score is what gets ranked. */
  | { type: 'finish' };

export type Rng = () => number;
