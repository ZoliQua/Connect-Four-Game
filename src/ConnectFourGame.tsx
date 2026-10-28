import { useCallback, useEffect, useMemo, useReducer, useState, type CSSProperties } from 'react';
import {
  clearSession,
  DUEL_BASE_POINTS,
  formatClock,
  GameOverlay,
  KeyHelp,
  SaveBadge,
  StatPanel,
  useArcadeRun,
  useRestoredSession,
  useRunTimer,
  useSessionAutosave,
  type ArcadeGameProps,
  type ArcadeStatus,
  type OverlayAction,
} from './arcade';
import { AISpeedToggle } from './components/AISpeedToggle';
import { GameBoard } from './components/GameBoard';
import { ModeSelect } from './components/ModeSelect';
import { useAIDelay } from './hooks/useAIDelay';
import { useAITurn } from './hooks/useAITurn';
import { useConnectFourKeys } from './hooks/useConnectFourKeys';
import { replayMoves } from './logic/board';
import { COLS } from './logic/constants';
import { advanceGame, aiPlayerFor, createInitialState, isHumanTurn, MODE_LABEL, MODES, roundOutcome } from './logic/game';
import { isConnectFourSession, type SavedGame } from './logic/persist';
import type { GameState, Mode, Player } from './logic/types';
import styles from './App.module.css';

/** Bump when SavedGame changes shape; older saves are then discarded. */
const SESSION_SCHEMA = 1;

/** Lets the last disc land and the winning four glow before the result card covers the board. */
export const RESULT_DELAY_MS = 1100;

/**
 * UI phase layered on top of the engine's round status:
 * `idle` before the first round of a visit, `live` while a round is on (or
 * just finished), `paused` while the round is suspended.
 */
type Phase = 'idle' | 'live' | 'paused';

const KEYS: [string, string][] = [
  ['← →', 'Choose column (or A D)'],
  ['1–7', 'Jump to column'],
  ['Enter Space ↓', 'Drop · start · next round'],
  ['P Esc', 'Pause / resume'],
  ['R', 'New round'],
  ['N', 'Cycle mode'],
  ['C', 'Reset series scores'],
];

const COLOR_NAME: Record<Player, string> = { 1: 'Red', 2: 'Yellow' };

/** Disc owners as read out in the column labels. */
const discNames = (ai: Player | null): Record<Player, string> => {
  if (ai === null) return { 1: 'red', 2: 'yellow' };
  return ai === 2 ? { 1: 'yours (red)', 2: 'AI (yellow)' } : { 1: 'AI (red)', 2: 'yours (yellow)' };
};

/** Cell of the newest disc (it plays the drop animation), or -1. */
const lastIndexOf = (moves: readonly number[], startingPlayer: Player): number =>
  moves.length === 0 ? -1 : (replayMoves(moves, startingPlayer)?.lastIndex ?? -1);

export function ConnectFourGame(props: ArcadeGameProps = {}) {
  const { embedded = false } = props;
  const restored = useRestoredSession<SavedGame>('connect4', SESSION_SCHEMA, isConnectFourSession);
  // A restored round that was still being played resumes exactly; a finished
  // one is not replayed (it is already recorded) — the series goes on with a new round.
  const restoredInProgress = restored !== null && restored.data.status === 'playing';

  const [state, dispatch] = useReducer(advanceGame, undefined, (): GameState => {
    // Ranked by default: the arcade scores rounds against the AI; PvP is one click away.
    if (!restored) return createInitialState({ mode: 'medium' });
    return restoredInProgress ? restored.data : advanceGame(restored.data, { type: 'newRound' });
  });
  const [phase, setPhase] = useState<Phase>(restored ? 'paused' : 'idle');
  const [runKey, setRunKey] = useState(0);
  const [welcomeBack, setWelcomeBack] = useState(restored !== null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const { speed: aiSpeed, delayMs: aiDelay, setSpeed: setAISpeed } = useAIDelay();

  const roundOver = state.status !== 'playing';
  const status: ArcadeStatus =
    phase === 'idle' ? 'idle' : roundOver ? 'gameOver' : phase === 'paused' ? 'paused' : 'running';
  const running = status === 'running';
  const ranked = state.mode !== 'pvp';
  const ai = aiPlayerFor(state);
  const humanTurn = isHumanTurn(state);

  const seconds = useRunTimer(running, runKey, runKey === 0 && restoredInProgress ? (restored?.seconds ?? 0) : 0);

  const stats = useArcadeRun({
    gameId: 'connect4',
    status,
    score: state.roundScore,
    seconds,
    runKey,
    outcome: () => roundOutcome(state),
    ranked,
    props,
  });

  const savedAt = useSessionAutosave({
    gameId: 'connect4',
    schema: SESSION_SCHEMA,
    // The whole series (board, scores, points, mode) is the session: it is
    // kept between rounds and only dropped on an explicit discard.
    enabled: phase !== 'idle',
    discard: phase === 'idle',
    data: state,
    seconds,
    score: state.points,
  });

  useAITurn(state, dispatch, aiDelay, running && !confirmOpen);

  useEffect(() => {
    if (!roundOver) {
      setShowResult(false);
      return;
    }
    const id = window.setTimeout(() => setShowResult(true), RESULT_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [roundOver, runKey]);

  // Leaving the tab pauses the round, so neither the clock nor the AI runs unseen.
  useEffect(() => {
    if (!running) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') setPhase((p) => (p === 'live' ? 'paused' : p));
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [running]);

  // ── Actions ────────────────────────────────────────────────
  const beginRound = useCallback((newRound: boolean) => {
    if (newRound) dispatch({ type: 'newRound' });
    setWelcomeBack(false);
    setConfirmOpen(false);
    setPhase('live');
    setRunKey((k) => k + 1);
  }, []);

  // The idle state already holds a fresh round; just open it.
  const start = useCallback(() => beginRound(false), [beginRound]);

  const newRound = useCallback(() => beginRound(phase !== 'idle'), [phase, beginRound]);

  const togglePause = useCallback(() => {
    if (roundOver) return;
    setWelcomeBack(false);
    setPhase((p) => (p === 'live' ? 'paused' : p === 'paused' ? 'live' : p));
  }, [roundOver]);

  const changeMode = useCallback(
    (mode: Mode) => {
      if (mode === state.mode) return;
      dispatch({ type: 'changeMode', mode });
      // In idle the new mode simply waits for Start; otherwise a new series begins.
      if (phase !== 'idle') beginRound(false);
    },
    [state.mode, phase, beginRound],
  );

  const newSeries = useCallback(() => {
    dispatch({ type: 'resetScores' });
    beginRound(true);
  }, [beginRound]);

  const hasScores = state.scores.p1 > 0 || state.scores.p2 > 0 || state.scores.draws > 0 || state.points > 0;
  const requestReset = useCallback(
    (skipConfirm: boolean) => {
      if (!hasScores) return;
      if (skipConfirm) dispatch({ type: 'resetScores' });
      else setConfirmOpen(true);
    },
    [hasScores],
  );
  const confirmReset = useCallback(() => {
    dispatch({ type: 'resetScores' });
    setConfirmOpen(false);
  }, []);
  const cancelReset = useCallback(() => setConfirmOpen(false), []);

  const discardSave = useCallback(() => {
    clearSession('connect4');
    setWelcomeBack(false);
    setConfirmOpen(false);
    // Re-entering the same mode clears the board, scores and points.
    dispatch({ type: 'changeMode', mode: state.mode });
    setPhase('idle');
    setRunKey((k) => k + 1);
  }, [state.mode]);

  const interactive = running && humanTurn && !confirmOpen;
  const drop = useCallback(
    (col: number) => {
      if (!interactive) return;
      dispatch({ type: 'drop', col });
    },
    [interactive],
  );
  const focusCol = useCallback((col: number) => dispatch({ type: 'focus', col }), []);

  const primary = useCallback(() => {
    if (status === 'idle') start();
    else if (status === 'gameOver') newRound();
    else if (status === 'paused') togglePause();
    else drop(state.focusCol);
  }, [status, start, newRound, togglePause, drop, state.focusCol]);

  useConnectFourKeys({
    confirmOpen,
    onConfirm: confirmReset,
    onCancel: cancelReset,
    onStep: (delta) => {
      if (running) focusCol(Math.min(COLS - 1, Math.max(0, state.focusCol + delta)));
    },
    onColumn: (col) => {
      if (running) focusCol(col);
    },
    onPrimary: primary,
    onDrop: () => {
      if (running) drop(state.focusCol);
    },
    onTogglePause: togglePause,
    onRestart: newRound,
    onCycleMode: () => changeMode(MODES[(MODES.indexOf(state.mode) + 1) % MODES.length]),
    onResetScores: requestReset,
  });

  // ── View ───────────────────────────────────────────────────
  const best = Math.max(stats.best, ranked ? state.roundScore : 0);
  const newBest = ranked && state.roundScore > 0 && state.roundScore > stats.bestBeforeRun;
  const humanWins = state.humanPlayer === 1 ? state.scores.p1 : state.scores.p2;
  const aiWins = state.humanPlayer === 1 ? state.scores.p2 : state.scores.p1;
  const names = useMemo(() => discNames(ai), [ai]);
  const lastIndex = useMemo(() => lastIndexOf(state.moves, state.startingPlayer), [state.moves, state.startingPlayer]);
  const roundNumber = state.scores.p1 + state.scores.p2 + state.scores.draws + (roundOver ? 0 : 1);

  let turnLabel: string | undefined;
  if (status === 'running') {
    if (ai === null) turnLabel = `${COLOR_NAME[state.current]} to move`;
    else turnLabel = state.current === ai ? 'AI thinking…' : 'Your turn';
  }

  let overlay: { title: string; message: string; actions: OverlayAction[] } | null = null;
  if (confirmOpen) {
    overlay = {
      title: 'Reset series scores?',
      message: 'This clears wins, losses, draws and series points. Your arcade Best and stats stay.',
      actions: [
        { label: 'Reset scores', onClick: confirmReset, primary: true, kbd: 'Enter' },
        { label: 'Keep', onClick: cancelReset, kbd: 'Esc' },
      ],
    };
  } else if (status === 'idle') {
    overlay = {
      title: 'Connect Four',
      message:
        state.mode === 'pvp'
          ? 'Two players, one rack: line up four discs. PvP rounds are just for fun (unranked).'
          : 'Line up four discs before the AI does. Faster wins and harder AIs score more points.',
      actions: [{ label: 'Start', onClick: start, primary: true, kbd: 'Space' }],
    };
  } else if (status === 'paused') {
    overlay = welcomeBack
      ? {
          title: 'Welcome back',
          message: `Your ${MODE_LABEL[state.mode]} series was restored — ${state.points} points, ${humanWins}–${aiWins}–${state.scores.draws}.`,
          actions: [
            { label: 'Continue', onClick: togglePause, primary: true, kbd: 'P' },
            { label: 'New round', onClick: newRound, kbd: 'R' },
            { label: 'New series', onClick: newSeries },
          ],
        }
      : {
          title: 'Paused',
          message: 'Your series is autosaved — you can close the tab and continue later.',
          actions: [
            { label: 'Resume', onClick: togglePause, primary: true, kbd: 'P' },
            { label: 'New round', onClick: newRound, kbd: 'R' },
          ],
        };
  } else if (status === 'gameOver' && showResult) {
    const outcome = roundOutcome(state);
    let title: string;
    if (outcome === 'draw') title = "It's a draw";
    else if (ai === null) title = `${COLOR_NAME[state.winner as Player]} wins!`;
    else title = outcome === 'win' ? 'You win!' : 'The AI wins';
    const message = ranked
      ? `+${state.roundScore} points in ${state.moves.length} discs · Series ${state.points} · Best ${best}${newBest ? ' — new best!' : ''}`
      : 'PvP rounds are unranked. Loser opens the next round.';
    overlay = {
      title,
      message,
      actions: [{ label: 'Next round', onClick: newRound, primary: true, kbd: 'R' }],
    };
  }

  const base = ranked ? DUEL_BASE_POINTS[state.mode as Exclude<Mode, 'pvp'>] : 0;

  return (
    <div className={`arc-game ${styles.game}`} style={{ '--game-color': 'var(--game-connect4)' } as CSSProperties}>
      {!embedded && (
        <header className="arc-game__head">
          <div>
            <h1 className="arc-game__title">Connect Four</h1>
            <p className="arc-game__sub">Drop discs, line up four — against a deep α-β search or a friend.</p>
          </div>
        </header>
      )}

      <StatPanel
        status={status}
        statusLabel={turnLabel}
        items={[
          { label: 'Score', value: state.roundScore },
          { label: 'Best', value: best, highlight: newBest },
          { label: ai === null ? 'R–Y–D' : 'W–L–D', value: `${humanWins}–${aiWins}–${state.scores.draws}` },
          { label: 'Time', value: formatClock(seconds) },
        ]}
      />

      <div className={styles.layout}>
        <div className={`arc-game__board ${styles.boardWrap}`}>
          <GameBoard
            board={state.board}
            lastIndex={lastIndex}
            winningCells={state.winningCells}
            current={state.current}
            focusCol={state.focusCol}
            interactive={interactive}
            names={names}
            onDrop={drop}
            onFocusCol={focusCol}
          />
          {overlay && <GameOverlay {...overlay} />}
        </div>

        <aside className={styles.side}>
          <section className="arc-panel">
            <h2 className="arc-panel__title">Game</h2>
            <div className={styles.buttons}>
              <button
                type="button"
                className="arc-btn arc-btn--primary"
                onClick={status === 'running' || status === 'paused' ? togglePause : primary}
              >
                {status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : status === 'idle' ? 'Start' : 'Next round'}
              </button>
              <button type="button" className="arc-btn" onClick={newRound} disabled={status === 'idle'}>
                New round
              </button>
            </div>
            <div className={styles.save}>
              <SaveBadge savedAt={phase !== 'idle' ? savedAt : null} onDiscard={discardSave} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">Series</h2>
            <dl className={styles.series}>
              <div>
                <dt>
                  <span className={`${styles.dot} ${styles.red}`} aria-hidden="true" />
                  {ai === null ? 'Red' : 'You'}
                </dt>
                <dd>{humanWins}</dd>
              </div>
              <div>
                <dt>
                  <span className={`${styles.dot} ${styles.yellow}`} aria-hidden="true" />
                  {ai === null ? 'Yellow' : 'AI'}
                </dt>
                <dd>{aiWins}</dd>
              </div>
              <div>
                <dt>Draws</dt>
                <dd>{state.scores.draws}</dd>
              </div>
            </dl>
            <p className={styles.note}>
              Round {Math.max(1, roundNumber)}
              {ranked ? ` · ${state.points} series points` : ' · unranked'} · loser opens the next round.
            </p>
            <button
              type="button"
              className={`arc-btn arc-btn--ghost ${styles.reset}`}
              onClick={() => requestReset(false)}
              disabled={!hasScores}
            >
              Reset scores <kbd className="arc-kbd">C</kbd>
            </button>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">Mode</h2>
            <ModeSelect mode={state.mode} onChange={changeMode} />
            <p className={styles.note}>
              {ranked
                ? `Ranked: a win pays ${base}–${base * 2} (faster wins pay more), a draw a quarter. Changing mode starts a new series.`
                : 'Two players on one device. Unranked — rounds count as plays only.'}
            </p>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">Settings</h2>
            <div className={styles.settings}>
              <AISpeedToggle speed={aiSpeed} onChange={setAISpeed} disabled={!ranked} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">Keys</h2>
            <KeyHelp rows={KEYS} />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default ConnectFourGame;
