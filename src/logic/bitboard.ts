import { COLS, ROWS } from './constants';

/**
 * Bitboard position for the AI search.
 *
 * Layout (the classic 7 × (6 + 1) encoding): bit `col * 7 + row`, row 0 at the
 * BOTTOM, row 6 an always-empty sentinel so lines never wrap between columns.
 * The 49 bits are split into two 32-bit integers on a column boundary —
 * `lo` holds columns 0–3 (bits 0–27), `hi` columns 4–6 (bits 0–20) — so every
 * bitwise op stays on fast small integers (no BigInt, no allocation).
 *
 * The position also keeps per-window disc counts incrementally, so the
 * heuristic evaluation is O(1) at the search leaves.
 */

export const H1 = ROWS + 1; // bits per column, sentinel included
const SPLIT = 4 * H1; // 28: first bit stored in `hi`
const M_LO = 0x0fffffff; // 28 bits
const M_HI = 0x1fffff; // 21 bits

const columnMask = (col: number): number => ((1 << ROWS) - 1) << ((col < 4 ? col : col - 4) * H1);
const bottomBit = (col: number): number => 1 << ((col < 4 ? col : col - 4) * H1);

let bl = 0;
let bh = 0;
let fl = 0;
let fh = 0;
for (let c = 0; c < COLS; c += 1) {
  if (c < 4) {
    bl |= bottomBit(c);
    fl |= columnMask(c);
  } else {
    bh |= bottomBit(c);
    fh |= columnMask(c);
  }
}
const BOTTOM_LO = bl;
const BOTTOM_HI = bh;
const BOARD_LO = fl;
const BOARD_HI = fh;

// ── 49-bit pair shifts (k in 1..27) ──────────────────────────
const shlLo = (lo: number, k: number) => (lo << k) & M_LO;
const shlHi = (lo: number, hi: number, k: number) => ((hi << k) | (lo >>> (SPLIT - k))) & M_HI;
const shrLo = (lo: number, hi: number, k: number) => ((lo >>> k) | (hi << (SPLIT - k))) & M_LO;
const shrHi = (hi: number, k: number) => hi >>> k;

export function popcount(v: number): number {
  v -= (v >>> 1) & 0x55555555;
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return (Math.imul((v + (v >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24) & 0xff;
}

// vertical (1), horizontal (7), diagonal ↗ (8), diagonal ↘ (6)
const DIRS = [1, H1, H1 + 1, H1 - 1] as const;

/** True when the stone set (lo, hi) contains four in a row. */
export function hasFour(lo: number, hi: number): boolean {
  for (const d of DIRS) {
    const mLo = lo & shrLo(lo, hi, d);
    const mHi = hi & shrHi(hi, d);
    if ((mLo & shrLo(mLo, mHi, 2 * d)) !== 0 || (mHi & shrHi(mHi, 2 * d)) !== 0) return true;
  }
  return false;
}

/** Scratch result of `winningCells` (avoids allocating a pair per call). */
export const out = { lo: 0, hi: 0 };

/**
 * Empty cells (not necessarily playable yet) that would complete four for the
 * stone set (pLo, pHi), given the occupancy (mLo, mHi). Result in `out`.
 */
export function winningCells(pLo: number, pHi: number, mLo: number, mHi: number): void {
  // vertical: three stones directly below
  let rLo = shlLo(pLo, 1) & shlLo(pLo, 2) & shlLo(pLo, 3);
  let rHi = shlHi(pLo, pHi, 1) & shlHi(pLo, pHi, 2) & shlHi(pLo, pHi, 3);
  for (let i = 1; i < 4; i += 1) {
    const d = DIRS[i];
    // two stones on one side …
    let tLo = shlLo(pLo, d) & shlLo(pLo, 2 * d);
    let tHi = shlHi(pLo, pHi, d) & shlHi(pLo, pHi, 2 * d);
    rLo |= tLo & shlLo(pLo, 3 * d);
    rHi |= tHi & shlHi(pLo, pHi, 3 * d);
    rLo |= tLo & shrLo(pLo, pHi, d);
    rHi |= tHi & shrHi(pHi, d);
    // … or on the other
    tLo = shrLo(pLo, pHi, d) & shrLo(pLo, pHi, 2 * d);
    tHi = shrHi(pHi, d) & shrHi(pHi, 2 * d);
    rLo |= tLo & shlLo(pLo, d);
    rHi |= tHi & shlHi(pLo, pHi, d);
    rLo |= tLo & shrLo(pLo, pHi, 3 * d);
    rHi |= tHi & shrHi(pHi, 3 * d);
  }
  out.lo = rLo & (BOARD_LO ^ mLo);
  out.hi = rHi & (BOARD_HI ^ mHi);
}

// ── Windows (every possible line of four) for the heuristic ───
type Window = readonly number[]; // 4 bit positions
const windows: Window[] = [];
for (let c = 0; c < COLS; c += 1) {
  for (let r = 0; r < ROWS; r += 1) {
    for (const [dc, dr] of [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ]) {
      const ec = c + 3 * dc;
      const er = r + 3 * dr;
      if (ec < 0 || ec >= COLS || er < 0 || er >= ROWS) continue;
      windows.push([0, 1, 2, 3].map((k) => (c + k * dc) * H1 + (r + k * dr)));
    }
  }
}
/** 69 on a 7 × 6 board. */
export const WINDOW_COUNT = windows.length;

// Flattened bit position → window ids.
const cellWinStart = new Int16Array(COLS * H1 + 1);
const cellWinIds: number[] = [];
for (let b = 0; b < COLS * H1; b += 1) {
  cellWinStart[b] = cellWinIds.length;
  windows.forEach((w, id) => {
    if (w.includes(b)) cellWinIds.push(id);
  });
}
cellWinStart[COLS * H1] = cellWinIds.length;
const CELL_WIN_IDS = Int16Array.from(cellWinIds);

/** Points for a window holding n discs of one side and none of the other. */
export const WINDOW_WEIGHT = [0, 1, 4, 16, 0] as const;
/** Extra points per disc in the centre column. */
export const CENTER_WEIGHT = 3;

// WSCORE[c0 * 5 + c1], from side 0's point of view.
const WSCORE = new Int32Array(25);
for (let a = 0; a <= 4; a += 1) {
  for (let b = 0; b <= 4; b += 1) {
    WSCORE[a * 5 + b] = a > 0 && b > 0 ? 0 : a > 0 ? WINDOW_WEIGHT[a] : -WINDOW_WEIGHT[b];
  }
}

/** Centre-first column order used for move ordering. */
export const COLUMN_ORDER: readonly number[] = [3, 2, 4, 1, 5, 0, 6];

/**
 * Mutable position with make / unmake. Sides are 0 and 1 (game players 1 and
 * 2); `side` is the side to move.
 */
export class Position {
  /** Stones per side, low and high halves. */
  sLo = [0, 0];
  sHi = [0, 0];
  maskLo = 0;
  maskHi = 0;
  heights = new Int8Array(COLS);
  history = new Int8Array(COLS * ROWS);
  moves = 0;
  side = 0;
  /** Heuristic score from side 0's point of view (windows + centre). */
  score = 0;
  private counts = [new Int8Array(WINDOW_COUNT), new Int8Array(WINDOW_COUNT)];

  /** A position from the columns played so far, `firstSide` (0 or 1) moving first. */
  static fromMoves(moves: readonly number[], firstSide = 0): Position {
    const p = new Position();
    p.side = firstSide;
    for (const col of moves) {
      if (!p.canPlay(col)) throw new Error(`Illegal move ${col}`);
      p.play(col);
    }
    return p;
  }

  canPlay(col: number): boolean {
    return col >= 0 && col < COLS && this.heights[col] < ROWS;
  }

  play(col: number): void {
    const row = this.heights[col];
    const s = this.side;
    if (col < 4) {
      const bit = 1 << (col * H1 + row);
      this.sLo[s] |= bit;
      this.maskLo |= bit;
    } else {
      const bit = 1 << ((col - 4) * H1 + row);
      this.sHi[s] |= bit;
      this.maskHi |= bit;
    }
    this.updateWindows(col * H1 + row, s, 1);
    if (col === 3) this.score += s === 0 ? CENTER_WEIGHT : -CENTER_WEIGHT;
    this.heights[col] = row + 1;
    this.history[this.moves] = col;
    this.moves += 1;
    this.side = s ^ 1;
  }

  undo(): void {
    this.moves -= 1;
    const col = this.history[this.moves];
    const s = this.side ^ 1;
    const row = this.heights[col] - 1;
    if (col < 4) {
      const bit = ~(1 << (col * H1 + row));
      this.sLo[s] &= bit;
      this.maskLo &= bit;
    } else {
      const bit = ~(1 << ((col - 4) * H1 + row));
      this.sHi[s] &= bit;
      this.maskHi &= bit;
    }
    this.updateWindows(col * H1 + row, s, -1);
    if (col === 3) this.score -= s === 0 ? CENTER_WEIGHT : -CENTER_WEIGHT;
    this.heights[col] = row;
    this.side = s;
  }

  private updateWindows(bitPos: number, s: number, delta: 1 | -1): void {
    const c0 = this.counts[0];
    const c1 = this.counts[1];
    const mine = this.counts[s];
    let score = this.score;
    for (let i = cellWinStart[bitPos]; i < cellWinStart[bitPos + 1]; i += 1) {
      const w = CELL_WIN_IDS[i];
      score -= WSCORE[c0[w] * 5 + c1[w]];
      mine[w] += delta;
      score += WSCORE[c0[w] * 5 + c1[w]];
    }
    this.score = score;
  }

  /** Heuristic value for the side to move. */
  evaluate(): number {
    return this.side === 0 ? this.score : -this.score;
  }

  /** True when the side to move wins by dropping into `col` (which must be playable). */
  isWinningMove(col: number): boolean {
    const s = this.side;
    const row = this.heights[col];
    let lo = this.sLo[s];
    let hi = this.sHi[s];
    if (col < 4) lo |= 1 << (col * H1 + row);
    else hi |= 1 << ((col - 4) * H1 + row);
    return hasFour(lo, hi);
  }

  /** Did the side that just moved complete four? */
  lastMoverWon(): boolean {
    const s = this.side ^ 1;
    return hasFour(this.sLo[s], this.sHi[s]);
  }

  /** Playable cells (the lowest empty cell of each non-full column), into `out`. */
  possible(): void {
    out.lo = (this.maskLo + BOTTOM_LO) & BOARD_LO;
    out.hi = (this.maskHi + BOTTOM_HI) & BOARD_HI;
  }

  /** True when the side to move has a winning drop right now. */
  canWinNext(): boolean {
    const s = this.side;
    winningCells(this.sLo[s], this.sHi[s], this.maskLo, this.maskHi);
    const wLo = out.lo;
    const wHi = out.hi;
    this.possible();
    return ((wLo & out.lo) | (wHi & out.hi)) !== 0;
  }

  /**
   * Playable cells that do not hand the opponent an immediate win, into
   * `out` (Pascal Pons' "possible non-losing moves"). If the opponent has a
   * playable winning cell, only blocking it is allowed; if it has two, the
   * result is empty (the position is lost). Never drops directly below an
   * opponent winning cell. Assumes the side to move cannot win right now.
   */
  nonLosingMoves(): void {
    const o = this.side ^ 1;
    winningCells(this.sLo[o], this.sHi[o], this.maskLo, this.maskHi);
    const oLo = out.lo;
    const oHi = out.hi;
    this.possible();
    let pLo = out.lo;
    let pHi = out.hi;
    const forcedLo = pLo & oLo;
    const forcedHi = pHi & oHi;
    if ((forcedLo | forcedHi) !== 0) {
      if (popcount(forcedLo) + popcount(forcedHi) > 1) {
        out.lo = 0;
        out.hi = 0;
        return;
      }
      pLo = forcedLo;
      pHi = forcedHi;
    }
    // Not directly below an opponent winning cell.
    out.lo = pLo & ~((oLo >>> 1) & M_LO);
    out.hi = pHi & ~((oHi >>> 1) & M_HI);
  }

  /** Unique key halves of the position (side-to-move stones + mask). */
  keyLo(): number {
    return this.sLo[this.side] + this.maskLo;
  }
  keyHi(): number {
    return this.sHi[this.side] + this.maskHi;
  }

  /**
   * Strength of dropping into `col` for move ordering: how many winning cells
   * the side to move would then own (more threats first).
   */
  threatsAfter(col: number): number {
    const s = this.side;
    const row = this.heights[col];
    let lo = this.sLo[s];
    let hi = this.sHi[s];
    let mLo = this.maskLo;
    let mHi = this.maskHi;
    if (col < 4) {
      const bit = 1 << (col * H1 + row);
      lo |= bit;
      mLo |= bit;
    } else {
      const bit = 1 << ((col - 4) * H1 + row);
      hi |= bit;
      mHi |= bit;
    }
    winningCells(lo, hi, mLo, mHi);
    return popcount(out.lo) + popcount(out.hi);
  }
}

/** Column whose playable cell is in the (lo, hi) mask, or false. */
export function columnInMask(lo: number, hi: number, col: number): boolean {
  return col < 4 ? (lo & columnMask(col)) !== 0 : (hi & columnMask(col)) !== 0;
}
