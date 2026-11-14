# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.1] — 2026-11-14

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the three new arcade games, Minesweeper, Solitaire and Ulti, with their accent colours.
- README: the Zoltan's Arcade family table lists all fourteen games.

## [1.1.0] — 2026-11-09

### Added

- Three languages: English, Hungarian and German, switchable in the top bar / settings and by `?lang=en|hu|de`; the choice is shared across the arcade (`arcade.lang`).
- Dental mode (off by default, shared `arcade.dental`, `?dental=1`): the discs are teeth, incisor versus molar silhouettes (shape, not only colour). Presentation only: rules, scores, stats and saves are unchanged.

### Changed

- Numbers use the locale's digit grouping.
- Links now point to https://dulzoltan.hu/arcade/ (the arcade moved to its new domain).

### Added

- Hungarian and German: every game string follows the shared arcade language (`src/i18n.ts`); the game is called „Négy a sorban” / „Vier gewinnt”.
- Dental mode (shared `arcade.dental`, off by default; toggle in the arcade top bar and in Settings): red discs are white incisors, yellow discs gold molars — two silhouettes, not just two colours. The winning four keep their glow; rules, scores and saves are unchanged.

## [1.0.2] — 2026-11-04

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the eleventh arcade game, Texas Hold'em, with its accent colour.
- README: the Zoltan's Arcade family table lists all eleven games.

## [1.0.1] — 2026-11-01

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the tenth arcade game, Nut Sort, with its accent colour.
- README: the Zoltan's Arcade family table lists all ten games.

## [1.0.0] - 2026-10-28

### Added
- Connect Four on the classic 7 × 6 rack: discs fall to the lowest empty cell with a CSS-transform drop animation (skipped under
  `prefers-reduced-motion`), a hover / keyboard preview disc, the newest disc marked and every winning line (four or longer,
  crossing lines included) highlighted while the rest dims.
- Modes PvP (unranked), Easy, Medium (default) and Hard with the shared mode panel; changing mode starts a new series.
- AI: bitboard negamax with α-β pruning, transposition table, centre-first / threat-count move ordering, "non-losing moves"
  pruning and an incremental 69-window heuristic. Easy = depth 2 with randomness and occasional blunders, Medium = depth 4,
  Hard = iterative deepening (≥ 10 plies, ~450 ms budget, node cap). Every level takes an immediate win; Medium and Hard always block.
- The AI searches inside its delayed timeout (off the render path, outside the pure reducer); its answer carries the searched ply,
  so a stale move never lands, and human drops are rejected on the AI's turn.
- Round scoring with the kit's `duelRoundScore` (difficulty = mode, moves = discs dropped, 42 cells); each round is one arcade run.
  Stat strip Score · Best · W–L–D (R–Y–D in PvP) · Time, and a Series panel with You / AI / Draws and series points.
- Loser-goes-first between rounds (draws and abandoned rounds alternate the opener), as in Tic-Tac-Toe and Gomoku.
- Pause with **P** / **Esc** and automatically when the tab is hidden; **R** new round, **N** cycle mode, **C** / **Shift+C**
  reset series scores (confirm overlay), ← → / A D / 1–7 column cursor, Enter / Space / ↓ / S drop. **T** stays the arcade theme key.
- Autosave & resume of the whole series (`arcade.session.connect4`) with a strict validator that replays the saved moves;
  restored sessions open paused with a *Welcome back* overlay.
- AI delay setting (Instant / 0.15 s / 0.4 s / 1 s, `connect4.aiSpeed`).
- `ConnectFourDemo` attract mode: two shallow, slightly random AIs on the real engine, auto-restarting after each result.
- Accessible board: a group of seven column buttons with descriptive `aria-label`s, roving focus and visible focus rings.
- Vitest + Testing Library suite (rules, bitboard vs. mailbox cross-checks, exact endgame solving vs. plain minimax, AI tactics,
  scoring, validator, demo, component behaviour), `npm run check`, GitHub Actions CI, community files and a game favicon.

### Notes
- Unlike Tic-Tac-Toe, the number keys pick a **column** here (1–7); modes are cycled with **N** or picked in the Mode panel.
