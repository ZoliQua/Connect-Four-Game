import { useEffect, useRef } from 'react';
import { chooseMove } from '../logic/ai';
import { AI_DELAY_MS } from '../logic/constants';
import { aiPlayerFor } from '../logic/game';
import type { GameAction, GameState, Rng } from '../logic/types';

/**
 * Schedules the AI's drop after `delayMs` when it is the AI's turn and the
 * round is `active` (running: not idle, paused or behind a dialog).
 *
 * The search runs inside the timeout callback — off the render path and
 * outside the reducer (which must stay pure and is invoked twice in
 * StrictMode). The answer carries the ply it was computed for, so the reducer
 * drops it if the position changed meanwhile. Any relevant change (a move,
 * pause, new round, mode change) or unmount cancels the pending timer.
 */
export const useAITurn = (
  state: GameState,
  dispatch: (action: GameAction) => void,
  delayMs: number = AI_DELAY_MS,
  active = true,
  rng: Rng = Math.random,
): void => {
  const ai = aiPlayerFor(state);
  const aiToMove = active && state.status === 'playing' && ai !== null && state.current === ai;
  const latest = useRef(state);
  latest.current = state;
  const rngRef = useRef(rng);
  rngRef.current = rng;

  useEffect(() => {
    if (!aiToMove) return;
    const timer = window.setTimeout(() => {
      const s = latest.current;
      if (s.mode === 'pvp') return;
      const col = chooseMove(s.moves, s.startingPlayer, s.mode, rngRef.current);
      if (col >= 0) dispatch({ type: 'aiMove', col, ply: s.moves.length });
    }, Math.max(0, delayMs));
    return () => window.clearTimeout(timer);
  }, [aiToMove, state.moves, state.mode, dispatch, delayMs]);
};
