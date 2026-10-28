import { useEffect, useRef } from 'react';
import { ARCADE_KEYS, isKey, shouldIgnoreKey } from '../arcade';

export type ConnectFourKeyHandlers = {
  /** A confirm dialog is open: only `onConfirm` / `onCancel` are live. */
  confirmOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** ← / → (A / D): move the column cursor by one. */
  onStep: (delta: -1 | 1) => void;
  /** `1`–`7`: jump to that column. */
  onColumn: (col: number) => void;
  /** Enter / Space: drop on the cursor column, start, resume or next round. */
  onPrimary: () => void;
  /** ↓ / S: drop (only while a round is being played). */
  onDrop: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onCycleMode: () => void;
  /** `C` asks for confirmation; Shift+C resets immediately. */
  onResetScores: (skipConfirm: boolean) => void;
};

const isButtonTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button');

/**
 * One window `keydown` listener for the component's lifetime; handlers are
 * read from a ref, so they are never stale and never re-attached. Every key is
 * ignored while the user types in a form field or holds Cmd/Ctrl/Alt.
 * `T` is left alone: it is the shared arcade theme toggle.
 */
export const useConnectFourKeys = (handlers: ConnectFourKeyHandlers): void => {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (shouldIgnoreKey(event)) return;
      const h = ref.current;
      const key = event.key;

      if (h.confirmOpen) {
        if (key === 'Enter') {
          event.preventDefault();
          h.onConfirm();
        } else if (key === 'Escape') {
          event.preventDefault();
          h.onCancel();
        }
        return;
      }

      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        event.preventDefault();
        h.onStep(-1);
        return;
      }
      if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        event.preventDefault();
        h.onStep(1);
        return;
      }
      if (key === 'ArrowDown' || key === 's' || key === 'S') {
        event.preventDefault();
        h.onDrop();
        return;
      }
      if (key.length === 1 && key >= '1' && key <= '7') {
        event.preventDefault();
        h.onColumn(Number(key) - 1);
        return;
      }
      if (key === 'Enter' || key === ' ') {
        // A focused button (a board column, Pause, an overlay action) activates
        // itself natively; handling it here too would act twice.
        if (isButtonTarget(event.target)) return;
        event.preventDefault();
        h.onPrimary();
        return;
      }
      if (isKey(event, ARCADE_KEYS.pause)) {
        event.preventDefault();
        h.onTogglePause();
        return;
      }
      if (isKey(event, ARCADE_KEYS.restart)) {
        event.preventDefault();
        h.onRestart();
        return;
      }
      if (key === 'n' || key === 'N') {
        event.preventDefault();
        h.onCycleMode();
        return;
      }
      if (key === 'c' || key === 'C') {
        event.preventDefault();
        h.onResetScores(event.shiftKey);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
};
