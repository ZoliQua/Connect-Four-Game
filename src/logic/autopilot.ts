import { chooseMove, DEMO_AI, type AIConfig } from './ai';
import { advanceGame, createInitialState } from './game';
import type { GameState, Rng } from './types';

/** Fresh demo state: a PvP round (both seats driven by the autopilot). */
export const createDemoState = (): GameState => createInitialState({ mode: 'pvp' });

/**
 * One autopilot drop with the REAL engine: the side to move picks a column
 * with the fast, shallow demo AI and the disc goes through `advanceGame` like
 * a human's. A finished round is returned unchanged.
 */
export function autoplayStep(state: GameState, rng: Rng, ai: AIConfig = DEMO_AI): GameState {
  if (state.status !== 'playing') return state;
  const col = chooseMove(state.moves, state.startingPlayer, ai, rng);
  if (col < 0) return state;
  return advanceGame(state, { type: 'drop', col });
}

/** Deterministic PRNG (mulberry32) so demo rounds are reproducible in tests. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
