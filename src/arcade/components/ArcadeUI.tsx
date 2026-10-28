import type { ReactNode } from 'react';
import { formatSavedAt } from '../format';
import type { ArcadeStatus } from '../types';

export type StatItem = {
  label: string;
  value: ReactNode;
  /** Highlights the value, e.g. a freshly beaten Best. */
  highlight?: boolean;
};

const STATUS_LABEL: Record<ArcadeStatus, string> = {
  idle: 'Ready',
  running: 'Playing',
  paused: 'Paused',
  gameOver: 'Game over',
};

export function StatusPill({ status, label }: { status: ArcadeStatus; label?: string }) {
  return (
    <span className={`arc-status arc-status--${status}`} role="status">
      <span className="arc-status__dot" aria-hidden="true" />
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}

/** The unified score strip: Score · Best · Time (+ game extras). */
export function StatPanel({
  items,
  status,
  statusLabel,
}: {
  items: StatItem[];
  status?: ArcadeStatus;
  statusLabel?: string;
}) {
  return (
    <div className="arc-stats">
      <dl className="arc-stats__grid">
        {items.map((it) => (
          <div key={it.label} className={`arc-stat${it.highlight ? ' arc-stat--hl' : ''}`}>
            <dt>{it.label}</dt>
            <dd>{it.value}</dd>
          </div>
        ))}
      </dl>
      {status && <StatusPill status={status} label={statusLabel} />}
    </div>
  );
}

export type OverlayAction = {
  label: string;
  onClick: () => void;
  primary?: boolean;
  /** Keyboard hint rendered next to the label, e.g. "P". */
  kbd?: string;
};

/** Centered card over the board for idle / paused / game-over states. */
export function GameOverlay({
  title,
  message,
  actions = [],
  children,
}: {
  title: ReactNode;
  message?: ReactNode;
  actions?: OverlayAction[];
  children?: ReactNode;
}) {
  return (
    <div className="arc-overlay" role="dialog" aria-live="polite" aria-label={typeof title === 'string' ? title : undefined}>
      <div className="arc-overlay__card">
        <h2 className="arc-overlay__title">{title}</h2>
        {message && <p className="arc-overlay__msg">{message}</p>}
        {children}
        {actions.length > 0 && (
          <div className="arc-overlay__actions">
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                className={`arc-btn${a.primary ? ' arc-btn--primary' : ''}`}
                onClick={a.onClick}
              >
                {a.label}
                {a.kbd && <kbd className="arc-kbd">{a.kbd}</kbd>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Small "Autosaved · just now" chip with an optional discard action. */
export function SaveBadge({ savedAt, onDiscard }: { savedAt: number | null; onDiscard?: () => void }) {
  if (savedAt === null) return null;
  return (
    <span className="arc-save" title={new Date(savedAt).toLocaleString()}>
      <span className="arc-save__dot" aria-hidden="true" />
      Autosaved · {formatSavedAt(savedAt)}
      {onDiscard && (
        <button type="button" className="arc-save__discard" onClick={onDiscard}>
          Discard
        </button>
      )}
    </span>
  );
}

/** Uniform keyboard help list. */
export function KeyHelp({ rows }: { rows: [keys: string, action: string][] }) {
  return (
    <ul className="arc-keys">
      {rows.map(([keys, action]) => (
        <li key={keys}>
          <span>
            {keys.split(' ').map((k) => (
              <kbd key={k} className="arc-kbd">
                {k}
              </kbd>
            ))}
          </span>
          <span>{action}</span>
        </li>
      ))}
    </ul>
  );
}
