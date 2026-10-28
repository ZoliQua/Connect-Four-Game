import { useEffect, useMemo, useRef, useState } from 'react';
import type { ArcadeDemoProps } from '../arcade';
import { GameBoard } from '../components/GameBoard';
import { autoplayStep, createDemoState, seededRng } from '../logic/autopilot';
import { replayMoves } from '../logic/board';
import { advanceGame } from '../logic/game';

export const DEMO_MOVE_MS = 360;
export const DEMO_RESTART_MS = 1600;

/**
 * Attract mode for the portal landing page: two fast, shallow AIs (with a
 * little randomness, so every round differs) play the real engine against
 * each other — one disc every 360 ms, a new round 1.6 s after each result.
 * No keyboard, no stats, no saves, no sound; frozen while `active` is false.
 */
export function ConnectFourDemo({ active = true }: ArcadeDemoProps) {
  const rngRef = useRef<() => number>();
  if (!rngRef.current) rngRef.current = seededRng((Date.now() ^ 0xc4c4) >>> 0);
  const [game, setGame] = useState(createDemoState);
  const playing = game.status === 'playing';

  useEffect(() => {
    if (!active) return;
    const rng = rngRef.current as () => number;
    const id = window.setTimeout(
      () => setGame((prev) => (prev.status === 'playing' ? autoplayStep(prev, rng) : advanceGame(prev, { type: 'newRound' }))),
      playing ? DEMO_MOVE_MS : DEMO_RESTART_MS,
    );
    return () => window.clearTimeout(id);
  }, [active, playing, game]);

  const lastIndex = useMemo(
    () => (game.moves.length === 0 ? -1 : (replayMoves(game.moves, game.startingPlayer)?.lastIndex ?? -1)),
    [game.moves, game.startingPlayer],
  );

  return (
    <div className="arc-demo" aria-hidden="true">
      <GameBoard board={game.board} lastIndex={lastIndex} winningCells={game.winningCells} variant="mini" />
    </div>
  );
}

export default ConnectFourDemo;
