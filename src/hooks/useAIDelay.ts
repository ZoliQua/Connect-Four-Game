import { useCallback, useState } from 'react';

export type AISpeed = 'instant' | 'fast' | 'normal' | 'slow';

export const AI_SPEED_MS: Record<AISpeed, number> = {
  instant: 0,
  fast: 150,
  normal: 400,
  slow: 1000,
};

const STORAGE_KEY = 'connect4.aiSpeed';

const read = (): AISpeed => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'instant' || raw === 'fast' || raw === 'normal' || raw === 'slow') {
      return raw;
    }
  } catch {
    // ignore
  }
  return 'normal';
};

const write = (value: AISpeed): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
};

export const useAIDelay = (): {
  speed: AISpeed;
  delayMs: number;
  setSpeed: (next: AISpeed) => void;
} => {
  const [speed, setSpeedState] = useState<AISpeed>(() => read());

  const setSpeed = useCallback((next: AISpeed) => {
    setSpeedState((prev) => {
      if (prev === next) return prev;
      write(next);
      return next;
    });
  }, []);

  return { speed, delayMs: AI_SPEED_MS[speed], setSpeed };
};
