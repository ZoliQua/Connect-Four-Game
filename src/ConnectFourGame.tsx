import { useCallback, useEffect, useMemo, useReducer, useState, type CSSProperties } from 'react';
import {
  clearSession,
  DUEL_BASE_POINTS,
  formatClock,
  formatNumber,
  gameName,
  GameOverlay,
  KeyHelp,
  Molar,
  SaveBadge,
  StatPanel,
  Tooth,
  useArcadeRun,
  useDental,
  useRestoredSession,
  useRunTimer,
  useKitMessages,
  useLang,
  useMessages,
  useSessionAutosave,
  type ArcadeGameProps,
  type ArcadeStatus,
  type OverlayAction,
} from './arcade';
import { AISpeedToggle } from './components/AISpeedToggle';
import { DentalToggle } from './components/DentalToggle';
import { GameBoard } from './components/GameBoard';
import { ModeSelect } from './components/ModeSelect';
import { useAIDelay } from './hooks/useAIDelay';
import { useAITurn } from './hooks/useAITurn';
import { useConnectFourKeys } from './hooks/useConnectFourKeys';
import { replayMoves } from './logic/board';
import { COLS } from './logic/constants';
import { advanceGame, aiPlayerFor, createInitialState, isHumanTurn, MODES, roundOutcome } from './logic/game';
import { isConnectFourSession, type SavedGame } from './logic/persist';
import type { GameState, Mode, Player } from './logic/types';
import { MESSAGES, type MessageKey } from './i18n';
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

const KEYS: [string, MessageKey][] = [
  ['← →', 'keyColumn'],
  ['1–7', 'keyJump'],
  ['Enter Space ↓', 'keyDrop'],
  ['P Esc', 'keyPause'],
  ['R', 'keyNewRound'],
  ['N', 'keyCycleMode'],
  ['C', 'keyResetScores'],
];

const COLOR_NAME: Record<Player, MessageKey> = { 1: 'red', 2: 'yellow' };
/** Dental mode draws red discs as incisors and yellow ones as molars, so the text names the shape. */
const SHAPE_NAME: Record<Player, MessageKey> = { 1: 'incisor', 2: 'molar' };

const MODE_KEY: Record<Mode, MessageKey> = {
  pvp: 'modePvp',
  easy: 'modeEasy',
  medium: 'modeMedium',
  hard: 'modeHard',
};

/** Disc owners as read out in the column labels. */
const discNames = (ai: Player | null): Record<Player, MessageKey> => {
  if (ai === null) return { 1: 'discRed', 2: 'discYellow' };
  return ai === 2 ? { 1: 'discYoursRed', 2: 'discAiYellow' } : { 1: 'discAiRed', 2: 'discYoursYellow' };
};

/** Cell of the newest disc (it plays the drop animation), or -1. */
const lastIndexOf = (moves: readonly number[], startingPlayer: Player): number =>
  moves.length === 0 ? -1 : (replayMoves(moves, startingPlayer)?.lastIndex ?? -1);

export function ConnectFourGame(props: ArcadeGameProps = {}) {
  const { embedded = false } = props;
  const t = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
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
  const [dental] = useDental();
  const playerName = (p: Player) => t((dental ? SHAPE_NAME : COLOR_NAME)[p]);
  const names = useMemo(() => {
    const keys = discNames(ai);
    return { 1: t(keys[1]), 2: t(keys[2]) } as Record<Player, string>;
  }, [ai, t]);
  const keyRows = useMemo(() => KEYS.map(([keys, action]): [string, string] => [keys, t(action)]), [t]);
  const num = (n: number) => formatNumber(n, lang);
  const record = `${num(humanWins)}–${num(aiWins)}–${num(state.scores.draws)}`;
  const lastIndex = useMemo(() => lastIndexOf(state.moves, state.startingPlayer), [state.moves, state.startingPlayer]);
  const roundNumber = state.scores.p1 + state.scores.p2 + state.scores.draws + (roundOver ? 0 : 1);

  let turnLabel: string | undefined;
  if (status === 'running') {
    if (ai === null) turnLabel = t('toMove', { color: playerName(state.current) });
    else turnLabel = state.current === ai ? t('aiThinking') : t('yourTurn');
  }

  let overlay: { title: string; message: string; actions: OverlayAction[] } | null = null;
  if (confirmOpen) {
    overlay = {
      title: t('resetTitle'),
      message: t('resetBody'),
      actions: [
        { label: t('resetConfirm'), onClick: confirmReset, primary: true, kbd: 'Enter' },
        { label: t('keep'), onClick: cancelReset, kbd: 'Esc' },
      ],
    };
  } else if (status === 'idle') {
    overlay = {
      title: gameName('connect4', lang),
      message: state.mode === 'pvp' ? t('idlePvp') : t('idleAi'),
      actions: [{ label: k('start'), onClick: start, primary: true, kbd: 'Space' }],
    };
  } else if (status === 'paused') {
    overlay = welcomeBack
      ? {
          title: k('welcomeBack'),
          message: t('welcomeBody', { mode: t(MODE_KEY[state.mode]), points: num(state.points), record }),
          actions: [
            { label: t('continue'), onClick: togglePause, primary: true, kbd: 'P' },
            { label: t('newRound'), onClick: newRound, kbd: 'R' },
            { label: t('newSeries'), onClick: newSeries },
          ],
        }
      : {
          title: k('paused'),
          message: t('pausedBody'),
          actions: [
            { label: k('resume'), onClick: togglePause, primary: true, kbd: 'P' },
            { label: t('newRound'), onClick: newRound, kbd: 'R' },
          ],
        };
  } else if (status === 'gameOver' && showResult) {
    const outcome = roundOutcome(state);
    let title: string;
    if (outcome === 'draw') title = t('draw');
    else if (ai === null) title = t('colorWins', { color: playerName(state.winner as Player) });
    else title = outcome === 'win' ? t('youWin') : t('aiWins');
    const message = ranked
      ? t('resultRanked', { score: num(state.roundScore), discs: state.moves.length, points: num(state.points), best: num(best) }) +
        (newBest ? t('resultNewBest') : '')
      : t('resultPvp');
    overlay = {
      title,
      message,
      actions: [{ label: t('nextRound'), onClick: newRound, primary: true, kbd: 'R' }],
    };
  }

  const base = ranked ? DUEL_BASE_POINTS[state.mode as Exclude<Mode, 'pvp'>] : 0;

  return (
    <div className={`arc-game ${styles.game}`} style={{ '--game-color': 'var(--game-connect4)' } as CSSProperties}>
      {!embedded && (
        <header className="arc-game__head">
          <div>
            <h1 className="arc-game__title">{gameName('connect4', lang)}</h1>
            <p className="arc-game__sub">{t('subtitle')}</p>
          </div>
        </header>
      )}

      <StatPanel
        status={status}
        statusLabel={turnLabel}
        items={[
          { label: k('score'), value: num(state.roundScore) },
          { label: k('best'), value: num(best), highlight: newBest },
          { label: ai === null ? t(dental ? 'statImd' : 'statRyd') : t('statWld'), value: record },
          { label: k('time'), value: formatClock(seconds) },
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
            <h2 className="arc-panel__title">{t('panelGame')}</h2>
            <div className={styles.buttons}>
              <button
                type="button"
                className="arc-btn arc-btn--primary"
                onClick={status === 'running' || status === 'paused' ? togglePause : primary}
              >
                {status === 'running'
                  ? k('pause')
                  : status === 'paused'
                    ? k('resume')
                    : status === 'idle'
                      ? k('start')
                      : t('nextRound')}
              </button>
              <button type="button" className="arc-btn" onClick={newRound} disabled={status === 'idle'}>
                {t('newRound')}
              </button>
            </div>
            <div className={styles.save}>
              <SaveBadge savedAt={phase !== 'idle' ? savedAt : null} onDiscard={discardSave} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelSeries')}</h2>
            <dl className={styles.series}>
              <div>
                <dt>
                  {dental ? (
                    <span className={`${styles.seriesIcon} ${styles.seriesTooth}`} data-testid="c4-series-tooth" aria-hidden="true">
                      <Tooth size={14} />
                    </span>
                  ) : (
                    <span className={`${styles.dot} ${styles.red}`} aria-hidden="true" />
                  )}
                  {ai === null ? playerName(1) : t('you')}
                </dt>
                <dd>{num(humanWins)}</dd>
              </div>
              <div>
                <dt>
                  {dental ? (
                    <span className={`${styles.seriesIcon} ${styles.seriesMolar}`} data-testid="c4-series-molar" aria-hidden="true">
                      <Molar size={14} />
                    </span>
                  ) : (
                    <span className={`${styles.dot} ${styles.yellow}`} aria-hidden="true" />
                  )}
                  {ai === null ? playerName(2) : t('ai')}
                </dt>
                <dd>{num(aiWins)}</dd>
              </div>
              <div>
                <dt>{t('draws')}</dt>
                <dd>{num(state.scores.draws)}</dd>
              </div>
            </dl>
            <p className={styles.note}>
              {ranked
                ? t('roundRanked', { n: Math.max(1, roundNumber), points: num(state.points) })
                : t('roundUnranked', { n: Math.max(1, roundNumber) })}
            </p>
            <button
              type="button"
              className={`arc-btn arc-btn--ghost ${styles.reset}`}
              onClick={() => requestReset(false)}
              disabled={!hasScores}
            >
              {t('resetScores')} <kbd className="arc-kbd">C</kbd>
            </button>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelMode')}</h2>
            <ModeSelect mode={state.mode} onChange={changeMode} />
            <p className={styles.note}>
              {ranked ? t('modeNoteRanked', { min: num(base), max: num(base * 2) }) : t('modeNotePvp')}
            </p>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelSettings')}</h2>
            <div className={styles.settings}>
              <AISpeedToggle speed={aiSpeed} onChange={setAISpeed} disabled={!ranked} />
              <DentalToggle className={styles.dentalRow} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelKeys')}</h2>
            <KeyHelp rows={keyRows} />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default ConnectFourGame;
