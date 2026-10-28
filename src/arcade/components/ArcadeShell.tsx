import { useEffect, type ReactNode } from 'react';
import { useArcadeTheme } from '../hooks';
import { ARCADE_AUTHOR, ARCADE_GAMES, ARCADE_PORTAL_URL, ARCADE_REPO_URL, gameInfo } from '../registry';
import { ARCADE_KEYS, isKey, shouldIgnoreKey } from '../keyboard';
import type { ArcadeGameId } from '../types';

/**
 * Page chrome for a game running on its own (outside the portal): the same
 * brand bar, theme toggle and typography as Zoltan's Arcade, plus links to
 * the sibling games and the portal.
 */
export function ArcadeShell({ gameId, children }: { gameId: ArcadeGameId; children: ReactNode }) {
  const game = gameInfo(gameId);
  const [theme, , toggleTheme] = useArcadeTheme();

  useEffect(() => {
    document.title = `${game.name} · Zoltan's Arcade`;
  }, [game.name]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shouldIgnoreKey(e)) return;
      if (isKey(e, ARCADE_KEYS.theme)) toggleTheme();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleTheme]);

  return (
    <div className="arc-page" style={{ ['--game-color' as string]: `var(${game.colorVar})` }}>
      <header className="arc-topbar">
        <a className="arc-brand" href={ARCADE_PORTAL_URL} title="Open Zoltan's Arcade">
          <span className="arc-brand__logo" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="7" width="18" height="11" rx="4" />
              <path d="M8 11v3M6.5 12.5h3M15 12h.01M17.5 13.5h.01" />
            </svg>
          </span>
          <span className="arc-brand__text">
            <strong>Zoltan&apos;s Arcade</strong>
            <span>{game.name}</span>
          </span>
        </a>

        <nav className="arc-topbar__nav" aria-label="Other games">
          <details className="arc-menu">
            <summary className="arc-btn arc-btn--ghost">More games</summary>
            <ul className="arc-menu__list">
              {ARCADE_GAMES.filter((g) => g.id !== gameId).map((g) => (
                <li key={g.id}>
                  <a href={g.repo} target="_blank" rel="noreferrer" style={{ ['--game-color' as string]: `var(${g.colorVar})` }}>
                    <span className="arc-menu__swatch" aria-hidden="true" />
                    {g.name}
                    <small>{g.tag}</small>
                  </a>
                </li>
              ))}
            </ul>
          </details>
          <a className="arc-btn arc-btn--ghost" href={ARCADE_PORTAL_URL}>
            Play all in the Arcade →
          </a>
          <button
            type="button"
            className="arc-icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title="Toggle theme (T)"
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
        </nav>
      </header>

      <main className="arc-page__main">{children}</main>

      <footer className="arc-footer">
        <a href={game.repo} target="_blank" rel="noreferrer">
          {game.name} on GitHub
        </a>
        <span aria-hidden="true">·</span>
        <span>
          Part of{' '}
          <a href={ARCADE_REPO_URL} target="_blank" rel="noreferrer">
            Arcade-Game-Center
          </a>
        </span>
        <span aria-hidden="true">·</span>
        <span>MIT © {ARCADE_AUTHOR}</span>
      </footer>
    </div>
  );
}
