/** Board geometry: 7 columns × 6 rows, the classic Connect Four rack. */
export const COLS = 7;
export const ROWS = 6;
export const BOARD_CELLS = COLS * ROWS;

/** Discs in a row needed to win. */
export const CONNECT = 4;

/** The middle column — the strongest opening and the default cursor position. */
export const CENTER_COL = 3;

/** Default AI "thinking" delay (the Normal AI speed). */
export const AI_DELAY_MS = 400;
