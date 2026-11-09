import { memo, useEffect, useRef, type CSSProperties } from 'react';
import { Molar, Tooth, useDental, useMessages } from '../arcade';
import { MESSAGES, type MessageKey } from '../i18n';
import { cellIndex, columnHeight } from '../logic/board';
import { COLS, ROWS } from '../logic/constants';
import type { Board, Player } from '../logic/types';
import styles from './GameBoard.module.css';

export type GameBoardProps = {
  board: Board;
  /** Cell of the most recent disc: it plays the drop animation. */
  lastIndex?: number;
  winningCells?: readonly number[] | null;
  /** Side to move: colours the hover / keyboard preview disc. */
  current?: Player;
  /** Column cursor (keyboard / hover); ignored by the mini variant. */
  focusCol?: number;
  /** True when a click may drop a disc (a human's turn in a running round). */
  interactive?: boolean;
  onDrop?: (col: number) => void;
  onFocusCol?: (col: number) => void;
  /** Player names for the column labels. */
  names?: Record<Player, string>;
  /** `mini` renders the compact, non-focusable landing-page variant. */
  variant?: 'full' | 'mini';
};

const noop = () => {};
const DEFAULT_NAMES: Record<Player, MessageKey> = { 1: 'discRed', 2: 'discYellow' };
const discClass = (p: Player) => (p === 1 ? styles.p1 : styles.p2);

/** Dental mode: red discs are incisors, yellow discs gold molars — two silhouettes, not just two colours. */
const DENTAL_TEST_ID: Record<Player, string> = { 1: 'c4-disc-tooth', 2: 'c4-disc-molar' };
const dentalArt = (p: Player) =>
  p === 1 ? <Tooth className={styles.tooth} size="100%" /> : <Molar className={styles.tooth} size="100%" />;

type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

function columnLabel(board: Board, col: number, names: Record<Player, string>, t: T): string {
  const discs: string[] = [];
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    const c = board[cellIndex(row, col)];
    if (c !== 0) discs.push(names[c]);
  }
  if (discs.length === ROWS) return t('colFull', { n: col + 1, discs: discs.join(', ') });
  if (discs.length === 0) return t('colEmpty', { n: col + 1 });
  return t('colPartial', { n: col + 1, count: discs.length, rows: ROWS, discs: discs.join(', ') });
}

/**
 * The 7 × 6 rack. Each column is one button (click / tap / Enter drops into
 * it); the cursor column shows a preview disc above the rack. The newest disc
 * falls in from the top with a CSS transform (no animation under reduced
 * motion); the winning four (or more) glow and the rest dim.
 */
export const GameBoard = memo(function GameBoard({
  board,
  lastIndex = -1,
  winningCells = null,
  current = 1,
  focusCol = -1,
  interactive = false,
  onDrop = noop,
  onFocusCol = noop,
  names: namesProp,
  variant = 'full',
}: GameBoardProps) {
  const t = useMessages(MESSAGES);
  const [dental] = useDental();
  const names = namesProp ?? { 1: t(DEFAULT_NAMES[1]), 2: t(DEFAULT_NAMES[2]) };
  const mini = variant === 'mini';
  const rootRef = useRef<HTMLDivElement>(null);
  const won = winningCells !== null && winningCells.length > 0;

  // Roving focus: when the cursor moves while a column has DOM focus, focus follows it.
  useEffect(() => {
    const root = rootRef.current;
    if (mini || !root || focusCol < 0) return;
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !root.contains(active) || active.dataset.col === String(focusCol)) return;
    root.querySelector<HTMLElement>(`[data-col="${focusCol}"]`)?.focus();
  }, [focusCol, mini]);

  const columns = [];
  for (let col = 0; col < COLS; col += 1) {
    const full = columnHeight(board, col) === ROWS;
    const cells = [];
    for (let row = 0; row < ROWS; row += 1) {
      const index = cellIndex(row, col);
      const value = board[index];
      const winning = won && winningCells.includes(index);
      cells.push(
        <span key={row} className={styles.cell}>
          {value !== 0 && (
            <span
              key={`${index}-${value}`}
              className={[
                styles.disc,
                discClass(value),
                index === lastIndex ? styles.drop : '',
                index === lastIndex && !won ? styles.last : '',
                winning ? styles.win : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={index === lastIndex ? ({ '--fall': row + 1 } as CSSProperties) : undefined}
              data-testid={dental ? DENTAL_TEST_ID[value] : undefined}
            >
              {dental && dentalArt(value)}
            </span>
          )}
        </span>,
      );
    }

    if (mini) {
      columns.push(
        <div key={col} className={styles.column}>
          {cells}
        </div>,
      );
      continue;
    }

    const focused = focusCol === col;
    const playable = interactive && !full;
    columns.push(
      <button
        key={col}
        type="button"
        data-col={col}
        className={[styles.column, focused ? styles.focused : '', playable ? styles.playable : '']
          .filter(Boolean)
          .join(' ')}
        aria-label={columnLabel(board, col, names, t)}
        aria-disabled={!playable}
        tabIndex={focused || (focusCol < 0 && col === 3) ? 0 : -1}
        onClick={() => {
          if (playable) onDrop(col);
        }}
        onFocus={() => onFocusCol(col)}
        onMouseEnter={() => {
          if (interactive) onFocusCol(col);
        }}
      >
        <span className={styles.slot} aria-hidden="true">
          {focused && playable && (
            <span className={`${styles.disc} ${styles.ghost} ${discClass(current)}`}>{dental && dentalArt(current)}</span>
          )}
        </span>
        {cells}
      </button>,
    );
  }

  return (
    <div
      ref={rootRef}
      className={[styles.board, mini ? styles.mini : '', won ? styles.over : '', dental ? styles.dental : '']
        .filter(Boolean)
        .join(' ')}
      data-dental={dental}
      role={mini ? undefined : 'group'}
      aria-label={mini ? undefined : t('boardLabel')}
      aria-hidden={mini ? true : undefined}
    >
      <span className={styles.frame} aria-hidden="true" />
      <div className={styles.columns}>{columns}</div>
    </div>
  );
});

export default GameBoard;
