import { applyDental } from './dental';
import { applyLang, isLang, type ApplyOptions, type Lang } from './i18n';

/**
 * URL hand-off of the shared preferences: `?lang=en|hu|de` and `?dental=1|0`,
 * read from the query and from a query inside the hash route
 * (`#/play/snake?lang=hu`, the hash wins). Applied once at boot and saved, so
 * the choice sticks after the first click from dulzoltan.hu.
 */

export type UrlPrefs = { lang?: Lang; dental?: boolean };
type Loc = { search: string; hash: string };

function currentLocation(): Loc {
  try {
    if (typeof window !== 'undefined') return { search: window.location.search, hash: window.location.hash };
  } catch {
    /* ignore */
  }
  return { search: '', hash: '' };
}

function collect(query: string, into: UrlPrefs): void {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(query);
  } catch {
    return;
  }
  const lang = params.get('lang');
  if (isLang(lang)) into.lang = lang;
  const dental = params.get('dental');
  if (dental === '1') into.dental = true;
  else if (dental === '0') into.dental = false;
}

export function readUrlPrefs(loc: Loc = currentLocation()): UrlPrefs {
  const out: UrlPrefs = {};
  collect(loc.search ?? '', out);
  const hash = loc.hash ?? '';
  const q = hash.indexOf('?');
  if (q >= 0) collect(hash.slice(q + 1), out);
  return out;
}

/**
 * Apply (and persist) whatever the URL asks for. Call once at boot.
 * `{ silent: true }` skips the change events: use it when applying during the
 * first render (as `ArcadeShell` does), where no listener exists yet and an
 * event could trigger React's "update while rendering" warning; components
 * then read the new values on mount.
 */
export function applyUrlPrefs(loc?: Loc, opts: ApplyOptions = {}): void {
  const prefs = readUrlPrefs(loc);
  if (prefs.lang) applyLang(prefs.lang, opts);
  if (prefs.dental !== undefined) applyDental(prefs.dental, opts);
}

/**
 * Append the hand-off params to a link to another arcade origin. Both are
 * always sent (`dental=1|0`), so turning dental mode off carries over too.
 */
export function withPrefs(url: string, prefs: { lang: Lang; dental: boolean }): string {
  const params = `lang=${prefs.lang}&dental=${prefs.dental ? 1 : 0}`;
  const hashAt = url.indexOf('#');
  const base = hashAt >= 0 ? url.slice(0, hashAt) : url;
  const hash = hashAt >= 0 ? url.slice(hashAt) : '';
  return `${base}${base.includes('?') ? '&' : '?'}${params}${hash}`;
}
