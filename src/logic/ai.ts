import { BOARD_CELLS, COLS } from './constants';
import { COLUMN_ORDER, columnInMask, out, Position } from './bitboard';
import type { Player, Rng } from './types';

/**
 * Connect Four AI: negamax with α-β pruning on a bitboard, centre-first and
 * threat-count move ordering, a transposition table, "non-losing moves"
 * pruning (never hand the opponent an immediate win, always block a single
 * threat) and an incremental window heuristic at the depth limit. Hard mode
 * deepens iteratively under a time budget.
 *
 * Scores are from the side to move: a win is `WIN − (discs on the board when
 * it lands)`, so faster wins score higher and slower losses less badly; the
 * value is absolute (independent of the search root), which keeps the
 * transposition table valid across iterations.
 */

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export const WIN = 1_000_000;
const INF = 2 * WIN;
/** Scores beyond this are proven wins / losses, not heuristics. */
export const DECIDED = WIN - BOARD_CELLS - 1;

export type AIConfig = {
  /** Plies searched (Hard: the iterative-deepening ceiling). */
  depth: number;
  /** Random pick among root moves within `slack` of the best heuristic score (0 = exact ties). */
  slack: number;
  /** Chance of a random legal drop instead of a searched one (never when a win is on the board). */
  blunder: number;
  /** Iterative deepening with this time budget (ms); depths ≤ `minDepth` always complete. */
  timeMs?: number;
  minDepth?: number;
  /** Hard cap on searched nodes (safety net for slow devices and fake timers). */
  nodeLimit?: number;
  /** The first N discs of a round (both sides) are random among the middle five columns. */
  randomOpening?: number;
};

export const AI_LEVELS: Record<AIDifficulty, AIConfig> = {
  // Takes a win, usually blocks, often drifts.
  easy: { depth: 2, slack: 6, blunder: 0.3 },
  // Sees four plies ahead; varies between equally good moves.
  medium: { depth: 4, slack: 2, blunder: 0 },
  // Iterative deepening to ≥ 10 plies within ~450 ms; solves endgames outright.
  hard: { depth: BOARD_CELLS, slack: 0, blunder: 0, timeMs: 450, minDepth: 10, nodeLimit: 4_000_000 },
};

/** The landing-page demo: fast, shallow and varied so rounds differ. */
export const DEMO_AI: AIConfig = { depth: 3, slack: 4, blunder: 0.06, randomOpening: 2 };

// ── Transposition table (typed arrays, allocated once) ───────
const TT_BITS = 18;
const TT_SIZE = 1 << TT_BITS;
const EXACT = 0;
const LOWER = 1;
const UPPER = 2;

type Table = {
  keyLo: Int32Array;
  keyHi: Int32Array;
  score: Int32Array;
  /** Searched depth + 1; 0 marks an empty slot. */
  depth: Int8Array;
  flag: Int8Array;
  move: Int8Array;
};
let table: Table | null = null;
function freshTable(): Table {
  if (!table) {
    table = {
      keyLo: new Int32Array(TT_SIZE),
      keyHi: new Int32Array(TT_SIZE),
      score: new Int32Array(TT_SIZE),
      depth: new Int8Array(TT_SIZE),
      flag: new Int8Array(TT_SIZE),
      move: new Int8Array(TT_SIZE),
    };
  } else {
    // Every search starts clean so results never depend on earlier searches.
    table.depth.fill(0);
  }
  return table;
}
const slotOf = (lo: number, hi: number) =>
  (Math.imul(hi, 0x9e3779b1) ^ Math.imul(lo ^ (lo >>> 15), 0x85ebca77)) >>> (32 - TT_BITS);

const defaultNow = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();

export type SearchStats = { nodes: number; depth: number; aborted: boolean };

class Search {
  nodes = 0;
  aborted = false;
  deadline = Infinity;
  nodeLimit = Infinity;
  private readonly tt = freshTable();
  // Per-ply move-ordering buffers (a child always uses the next ply's slice).
  private readonly orderCols = new Int8Array((BOARD_CELLS + 1) * COLS);
  private readonly orderScores = new Int32Array((BOARD_CELLS + 1) * COLS);

  constructor(
    readonly pos: Position,
    private readonly now: () => number,
  ) {}

  negamax(depth: number, alpha: number, beta: number): number {
    this.nodes += 1;
    if ((this.nodes & 1023) === 0 && (this.nodes >= this.nodeLimit || this.now() > this.deadline)) {
      this.aborted = true;
    }
    if (this.aborted) return 0;

    const p = this.pos;
    const n = p.moves;
    if (n >= BOARD_CELLS) return 0;
    if (p.canWinNext()) return WIN - (n + 1);
    p.nonLosingMoves();
    const safeLo = out.lo;
    const safeHi = out.hi;
    // Every drop hands the opponent a win: lost on their next disc.
    if ((safeLo | safeHi) === 0) return -(WIN - (n + 2));
    // Two cells left and no immediate win either way: a draw.
    if (n >= BOARD_CELLS - 2) return 0;
    if (depth <= 0) return p.evaluate();

    const tt = this.tt;
    const kLo = p.keyLo();
    const kHi = p.keyHi();
    const slot = slotOf(kLo, kHi);
    let ttMove = -1;
    if (tt.depth[slot] !== 0 && tt.keyLo[slot] === kLo && tt.keyHi[slot] === kHi) {
      ttMove = tt.move[slot];
      if (tt.depth[slot] - 1 >= depth) {
        const s = tt.score[slot];
        const f = tt.flag[slot];
        if (f === EXACT) return s;
        if (f === LOWER && s > alpha) alpha = s;
        else if (f === UPPER && s < beta) beta = s;
        if (alpha >= beta) return s;
      }
    }

    // Order the safe drops: TT move first, then most threats created, centre-first on ties.
    const base = n * COLS;
    const cols = this.orderCols;
    const scores = this.orderScores;
    let count = 0;
    for (let i = 0; i < COLS; i += 1) {
      const col = COLUMN_ORDER[i];
      if (!columnInMask(safeLo, safeHi, col)) continue;
      const s = col === ttMove ? 1 << 20 : p.threatsAfter(col);
      let j = count;
      while (j > 0 && scores[base + j - 1] < s) {
        cols[base + j] = cols[base + j - 1];
        scores[base + j] = scores[base + j - 1];
        j -= 1;
      }
      cols[base + j] = col;
      scores[base + j] = s;
      count += 1;
    }

    const alphaOrig = alpha;
    let best = -INF;
    let bestMove = cols[base];
    for (let i = 0; i < count; i += 1) {
      const col = cols[base + i];
      p.play(col);
      const v = -this.negamax(depth - 1, -beta, -alpha);
      p.undo();
      if (this.aborted) return 0;
      if (v > best) {
        best = v;
        bestMove = col;
      }
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }

    tt.keyLo[slot] = kLo;
    tt.keyHi[slot] = kHi;
    tt.score[slot] = best;
    tt.depth[slot] = Math.min(depth, 126) + 1;
    tt.flag[slot] = best <= alphaOrig ? UPPER : best >= beta ? LOWER : EXACT;
    tt.move[slot] = bestMove;
    return best;
  }

  /** Value of dropping into `col` at the root, searching `depth` plies in total. */
  rootMove(col: number, depth: number, alpha: number, beta: number): number {
    const p = this.pos;
    if (p.isWinningMove(col)) return WIN - (p.moves + 1);
    p.play(col);
    const v = -this.negamax(depth - 1, -beta, -alpha);
    p.undo();
    return v;
  }
}

export const legalColumns = (pos: Position): number[] => COLUMN_ORDER.filter((c) => pos.canPlay(c));

/**
 * Exact score of every legal root move at a fixed depth (full window per
 * move). Index = column; null for full columns.
 */
export function scoreMoves(
  moves: readonly number[],
  startingPlayer: Player,
  depth: number,
): { scores: (number | null)[]; nodes: number } {
  const search = new Search(Position.fromMoves(moves, startingPlayer - 1), defaultNow);
  const scores: (number | null)[] = Array(COLS).fill(null);
  for (const col of legalColumns(search.pos)) scores[col] = search.rootMove(col, depth, -INF, INF);
  return { scores, nodes: search.nodes };
}

/**
 * Best move by iterative deepening with α-β at the root (previous best first).
 * Stops at `maxDepth`, on a proven result, or when the time / node budget runs
 * out — keeping the last completed depth's answer.
 */
export function searchBestMove(
  moves: readonly number[],
  startingPlayer: Player,
  opts: { maxDepth: number; timeMs?: number; minDepth?: number; nodeLimit?: number; now?: () => number },
): { col: number; score: number } & SearchStats {
  const now = opts.now ?? defaultNow;
  const pos = Position.fromMoves(moves, startingPlayer - 1);
  const search = new Search(pos, now);
  search.nodeLimit = opts.nodeLimit ?? Infinity;
  let order = legalColumns(pos);
  if (order.length === 0) return { col: -1, score: 0, nodes: 0, depth: 0, aborted: false };

  const start = now();
  const remaining = BOARD_CELLS - pos.moves;
  const maxDepth = Math.max(1, Math.min(opts.maxDepth, remaining));
  const minDepth = opts.minDepth ?? 1;
  let bestCol = order[0];
  let bestScore = -INF;
  let reached = 0;

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    search.deadline = opts.timeMs !== undefined && depth > minDepth ? start + opts.timeMs : Infinity;
    let alpha = -INF;
    let iterBest = order[0];
    let iterScore = -INF;
    for (const col of order) {
      const v = search.rootMove(col, depth, alpha, INF);
      if (search.aborted) break;
      if (v > iterScore) {
        iterScore = v;
        iterBest = col;
      }
      if (v > alpha) alpha = v;
    }
    // A half-finished iteration is discarded: keep the last completed depth.
    if (search.aborted) break;
    bestCol = iterBest;
    bestScore = iterScore;
    reached = depth;
    order = [bestCol, ...order.filter((c) => c !== bestCol)];
    if (Math.abs(bestScore) > DECIDED) break;
    if (opts.timeMs !== undefined && depth >= minDepth && now() - start > opts.timeMs * 0.45) break;
  }
  return { col: bestCol, score: bestScore, nodes: search.nodes, depth: reached, aborted: search.aborted };
}

/** Column of an immediate win for the side to move, or -1. */
export function winningColumn(pos: Position): number {
  for (const col of COLUMN_ORDER) if (pos.canPlay(col) && pos.isWinningMove(col)) return col;
  return -1;
}

/** Column the opponent would win in next if left open (a must-block), or -1. */
export function threatColumn(pos: Position): number {
  for (const col of COLUMN_ORDER) {
    if (!pos.canPlay(col)) continue;
    pos.side ^= 1;
    const wins = pos.isWinningMove(col);
    pos.side ^= 1;
    if (wins) return col;
  }
  return -1;
}

const pick = <T>(items: readonly T[], rng: Rng): T => items[Math.min(items.length - 1, Math.floor(rng() * items.length))];

/**
 * The AI's column for the side to move after `moves` (round opened by
 * `startingPlayer`). Always takes an immediate win and — unless it blunders on
 * Easy — blocks an immediate threat. Returns -1 when the board is full.
 */
export function chooseMove(
  moves: readonly number[],
  startingPlayer: Player,
  level: AIDifficulty | AIConfig,
  rng: Rng,
  now?: () => number,
): number {
  const cfg = typeof level === 'string' ? AI_LEVELS[level] : level;
  const pos = Position.fromMoves(moves, startingPlayer - 1);
  const legal = legalColumns(pos);
  if (legal.length === 0) return -1;

  const win = winningColumn(pos);
  if (win >= 0) return win;

  if (cfg.blunder > 0 && rng() < cfg.blunder) return pick(legal, rng);

  const block = threatColumn(pos);
  if (block >= 0) return block;

  if (cfg.randomOpening && pos.moves < cfg.randomOpening) {
    const middle = legal.filter((c) => c >= 1 && c <= 5);
    if (middle.length > 0) return pick(middle, rng);
  }

  if (cfg.timeMs !== undefined) {
    return searchBestMove(moves, startingPlayer, {
      maxDepth: cfg.depth,
      timeMs: cfg.timeMs,
      minDepth: cfg.minDepth,
      nodeLimit: cfg.nodeLimit,
      now,
    }).col;
  }

  const { scores } = scoreMoves(moves, startingPlayer, cfg.depth);
  let best = -INF;
  for (const s of scores) if (s !== null && s > best) best = s;
  // Proven results are never blurred by the slack.
  const slack = Math.abs(best) > DECIDED ? 0 : cfg.slack;
  const candidates = legal.filter((c) => {
    const s = scores[c];
    return s !== null && s >= best - slack;
  });
  return pick(candidates.length > 0 ? candidates : legal, rng);
}
