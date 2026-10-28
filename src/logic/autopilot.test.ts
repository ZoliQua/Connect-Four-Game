import { describe, expect, it } from 'vitest';
import { autoplayStep, createDemoState, seededRng } from './autopilot';
import { advanceGame } from './game';
import type { GameState, Rng } from './types';

const playOut = (rng: Rng): GameState => {
  let s = createDemoState();
  for (let i = 0; i < 42 && s.status === 'playing'; i += 1) s = autoplayStep(s, rng);
  return s;
};

describe('demo autopilot', () => {
  it('plays a whole round on the real engine, one legal disc per step', () => {
    const rng = seededRng(1);
    let s = createDemoState();
    let steps = 0;
    while (s.status === 'playing') {
      const next = autoplayStep(s, rng);
      expect(next.moves).toHaveLength(s.moves.length + 1);
      s = next;
      steps += 1;
    }
    expect(steps).toBeGreaterThanOrEqual(7);
    expect(['won', 'draw']).toContain(s.status);
    expect(autoplayStep(s, rng)).toBe(s); // finished rounds stay put
  });

  it('is reproducible per seed and varied across seeds', () => {
    expect(playOut(seededRng(3)).moves).toEqual(playOut(seededRng(3)).moves);
    const games = new Set([1, 2, 3, 4, 5, 6].map((seed) => playOut(seededRng(seed)).moves.join('')));
    expect(games.size).toBeGreaterThan(3);
  });

  it('keeps looping rounds with the loser opening the next one', () => {
    const rng = seededRng(11);
    const s = playOut(rng);
    const next = advanceGame(s, { type: 'newRound' });
    expect(next.status).toBe('playing');
    expect(next.moves).toEqual([]);
    if (s.winner !== null) expect(next.startingPlayer).not.toBe(s.winner);
  });
});
