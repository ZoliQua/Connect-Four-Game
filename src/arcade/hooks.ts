import { useCallback, useEffect, useRef, useState, type RefCallback } from 'react';
import { loadSession, clearSession, saveSession, type SessionEnvelope } from './session';
import { readStats, recordRun, subscribeStats, type GameStats } from './stats';
import { applyTheme, readTheme, THEME_EVENT, type ArcadeTheme } from './theme';
import type {
  ArcadeGameId,
  ArcadeGameProps,
  ArcadeStatus,
  RunOutcome,
  RunResult,
} from './types';

/**
 * Pause-aware run timer. Counts whole seconds while `running` is true, keeps
 * the total across pauses and resets to `initialSeconds` whenever `resetKey`
 * changes (new run, or a restored session's saved time).
 */
export function useRunTimer(running: boolean, resetKey: unknown, initialSeconds = 0): number {
  const [seconds, setSeconds] = useState(initialSeconds);
  const accumMsRef = useRef(initialSeconds * 1000);
  const startRef = useRef<number | null>(null);
  const initialRef = useRef(initialSeconds);
  initialRef.current = initialSeconds;

  // Only a new run resets the clock; `running` is handled by the effect below
  // (its cleanup runs first and banks the old run's time, which we then drop).
  useEffect(() => {
    accumMsRef.current = initialRef.current * 1000;
    startRef.current = null;
    setSeconds(initialRef.current);
  }, [resetKey]);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      const base = startRef.current ?? Date.now();
      setSeconds(Math.floor((accumMsRef.current + Date.now() - base) / 1000));
    }, 250);
    return () => {
      window.clearInterval(id);
      if (startRef.current !== null) {
        accumMsRef.current += Date.now() - startRef.current;
        startRef.current = null;
      }
      setSeconds(Math.floor(accumMsRef.current / 1000));
    };
  }, [running, resetKey]);

  return seconds;
}

/** Live stats for one game; re-renders when any tab records a run. */
export function useGameStats(id: ArcadeGameId): GameStats {
  const [stats, setStats] = useState(() => readStats(id));
  useEffect(() => {
    setStats(readStats(id));
    return subscribeStats(() => setStats(readStats(id)));
  }, [id]);
  return stats;
}

export type ArcadeRunOptions = {
  gameId: ArcadeGameId;
  status: ArcadeStatus;
  score: number;
  seconds: number;
  /**
   * Changes whenever a new run starts. Guarantees exactly one recorded
   * result per run, even if `status` flickers or React re-runs effects.
   */
  runKey: string | number;
  /** Evaluated when the run reaches `gameOver`. Defaults to `over`. */
  outcome?: RunOutcome | (() => RunOutcome);
  /** Defaults to true. */
  ranked?: boolean;
  props?: ArcadeGameProps;
};

export type ArcadeRunStats = GameStats & {
  /**
   * Best score as it stood before the current run was recorded. Compare the
   * final score against this for a "new best!" message — `best` itself already
   * includes the finished run.
   */
  bestBeforeRun: number;
};

/**
 * The single place where a game's run is scored: records stats once per run,
 * notifies the host (`onGameOver`, `onRunEnd`) and mirrors live status to it
 * (`onStatusChange`). Returns the game's stats (Best, plays, …).
 */
export function useArcadeRun(opts: ArcadeRunOptions): ArcadeRunStats {
  const { gameId, status, score, seconds, runKey, props } = opts;
  const stats = useGameStats(gameId);
  // Frozen while the run is over, so it still holds the pre-run best.
  const bestBeforeRef = useRef(stats.best);
  if (status !== 'gameOver') bestBeforeRef.current = stats.best;
  const recordedRef = useRef<string | number | null>(null);
  const latest = useRef(opts);
  latest.current = opts;

  useEffect(() => {
    if (status !== 'gameOver' || recordedRef.current === runKey) return;
    recordedRef.current = runKey;
    const o = latest.current;
    const outcome = typeof o.outcome === 'function' ? o.outcome() : (o.outcome ?? 'over');
    const run: RunResult = {
      score: Math.max(0, Math.floor(o.score)),
      seconds: Math.max(0, Math.floor(o.seconds)),
      outcome,
      ranked: o.ranked ?? true,
    };
    recordRun(gameId, run);
    o.props?.onRunEnd?.(run);
    if (run.ranked && run.score > 0) o.props?.onGameOver?.(run.score);
  }, [status, runKey, gameId]);

  const onStatusChange = props?.onStatusChange;
  useEffect(() => {
    onStatusChange?.({ status, score, seconds });
  }, [onStatusChange, status, score, seconds]);

  return { ...stats, bestBeforeRun: bestBeforeRef.current };
}

export type AutosaveOptions<T> = {
  gameId: ArcadeGameId;
  schema: number;
  /** Save while true (a run is in progress). */
  enabled: boolean;
  /** Drop any save when true (run finished / reset to a fresh game). */
  discard: boolean;
  data: T;
  seconds: number;
  score: number;
  /** Throttle for change-driven saves. Page hide always saves immediately. */
  intervalMs?: number;
};

/**
 * Persists the in-progress run so closing the tab, reloading or switching
 * games in the portal never loses it. Returns the time of the last save.
 */
export function useSessionAutosave<T>(opts: AutosaveOptions<T>): number | null {
  const { gameId, schema, enabled, discard, data, seconds, score, intervalMs = 1000 } = opts;
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const latest = useRef({ data, seconds, score, enabled });
  latest.current = { data, seconds, score, enabled };
  const lastSaveRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const l = latest.current;
    if (!l.enabled) return;
    const env = saveSession(gameId, { schema, data: l.data, seconds: l.seconds, score: l.score });
    lastSaveRef.current = Date.now();
    if (env) setSavedAt(env.savedAt);
  }, [gameId, schema]);

  useEffect(() => {
    if (discard) {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      clearSession(gameId);
      setSavedAt(null);
    }
  }, [discard, gameId]);

  useEffect(() => {
    if (!enabled || discard) return;
    const wait = Math.max(0, intervalMs - (Date.now() - lastSaveRef.current));
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(flush, wait);
  }, [enabled, discard, data, seconds, score, intervalMs, flush]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHide);
      // Unmount (e.g. leaving the game in the portal) saves the latest state.
      flush();
    };
  }, [flush]);

  return savedAt;
}

/**
 * Read a saved session exactly once (on first render). Use its `data` to seed
 * the game's initial state, always restored as paused.
 */
export function useRestoredSession<T>(
  gameId: ArcadeGameId,
  schema: number,
  isValid?: (data: unknown) => data is T,
): SessionEnvelope<T> | null {
  const [restored] = useState(() => loadSession<T>(gameId, schema, isValid));
  return restored;
}

/** Shared light/dark theme, synced across the portal, games and tabs. */
export function useArcadeTheme(): [ArcadeTheme, (t: ArcadeTheme) => void, () => void] {
  const [theme, setThemeState] = useState<ArcadeTheme>(readTheme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  useEffect(() => {
    const onTheme = (e: Event) => {
      const t = (e as CustomEvent<ArcadeTheme>).detail;
      if (t === 'dark' || t === 'light') setThemeState(t);
    };
    const onStorage = () => setThemeState(readTheme());
    window.addEventListener(THEME_EVENT, onTheme);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, onTheme);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  const setTheme = useCallback((t: ArcadeTheme) => {
    setThemeState(t);
    applyTheme(t);
  }, []);
  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, []);
  return [theme, setTheme, toggle];
}

/** True while the element is on screen; drives demo animations. */
export function useInView<T extends Element>(): [RefCallback<T>, boolean] {
  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const ref = useCallback((node: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.15,
    });
    io.observe(node);
    observerRef.current = io;
  }, []);
  return [ref, inView];
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}
