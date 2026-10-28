# Connect Four Game — CLAUDE.md

## Project Facts

* **Repository**: https://github.com/ZoliQua/Connect-Four-Game (package `connect-four-game`)
* **Portal**: https://github.com/ZoliQua/Arcade-Game-Center — arcade id **`connect4`**, colour token `--game-connect4`,
  play URL https://drdul.hu/arcade/#/play/connect4. The same `src/` is mirrored into `Arcade-Game-Center/apps/connect4/`.
* **Sister games**: Tetris, Snake (the reference implementation), 2048, Pac-Man, Gomoku, Tic-Tac-Toe, Breakout, Space Invaders.
  The closest siblings are Tic-Tac-Toe and Gomoku (same duel UX, scoring and round flow).
* **Stack**: React 18.3, Vite 5.4, TypeScript 5.6, CSS Modules on the shared arcade tokens. No other runtime dependencies.
* **Package manager**: npm. **Node**: >=20.
* **Scripts**:
  * `npm run dev` — local dev server
  * `npm run build` — `tsc -b && vite build`
  * `npm run preview` — preview production build
  * `npm run typecheck` — `tsc -b`
  * `npm run lint` — ESLint (flat config, typescript-eslint)
  * `npm test` — Vitest (logic + component tests, jsdom)
  * `npm run check` — lint → typecheck → test → build (same as CI)
* **Board**: 7 columns × 6 rows. `Board` = 42 `Cell`s (`0 | 1 | 2`), row-major, **row 0 at the top** (`index = row * 7 + col`).
  `GameState.moves` is the column history; the board is always `replayMoves(moves, startingPlayer)`.
* **Players**: 1 = red (the human vs the AI, `humanPlayer`), 2 = yellow. Round 1 is opened by red; afterwards loser-goes-first
  (draws / abandoned rounds alternate).
* **Modes**: `'pvp'`, `'easy'`, `'medium'` (default), `'hard'` — see `AI_LEVELS` in `src/logic/ai.ts`.
* **Scoring**: each round is one arcade run, scored with the kit's `duelRoundScore({ outcome, difficulty: mode | null, moves: moves.length, boardCells: 42 })`
  from the human's side. PvP → difficulty `null` → `ranked: false`, score 0 (outcome from red's side).
  `GameState.roundScore` is the current round's score, `GameState.points` the series total.
* **Stats**: kept by the kit (`arcade.stats.connect4`); Best = `stats.best`. No game-owned high-score storage.
* **Session**: the whole series (`SavedGame` = `GameState`) under `arcade.session.connect4`, schema `SESSION_SCHEMA = 1`,
  validated by `isConnectFourSession` (replays the moves). Kept between rounds; dropped only by Discard (→ idle).
* **Other prefs**: `connect4.aiSpeed`.
* **No game loop**: state advances only on input and on the AI's delayed dispatch. Animations are pure CSS.
* **Rendering**: DOM (column buttons + CSS discs). No canvas.
* **Communication**: respond to the user in **Hungarian** in chat, even though this file and the codebase are in English.

If any fact above disagrees with the real repository, verify first and flag the divergence to the user before editing code.

---

## Primary Goal

A correct, type-safe Connect Four with a genuinely strong AI that runs standalone and embeds unchanged in the Arcade-Game-Center portal.

**Priority order**: correctness → truthfulness → verification → small diffs → maintainability → polish.

---

## Architecture

```
src/
  arcade/              # VENDORED shared kit from Arcade-Game-Center/packages/kit — never edit here
  logic/               # pure rules, no React
    types.ts constants.ts
    board.ts           # landingRow, dropDisc, winningCellsAt, findWinner, replayMoves (mailbox, row 0 = top)
    game.ts            # advanceGame reducer, createInitialState, roundOutcome, aiPlayerFor, isHumanTurn, scoring
    bitboard.ts        # Position: two-int bitboard (cols 0–3 | 4–6), make/unmake, winning cells, non-losing moves,
                       # incremental 69-window heuristic
    ai.ts              # Search (negamax α-β + TT), scoreMoves, searchBestMove (iterative deepening), chooseMove, AI_LEVELS, DEMO_AI
    autopilot.ts       # demo driver: autoplayStep, createDemoState, seededRng
    persist.ts         # isConnectFourSession — strict saved-session validator
    *.test.ts
  hooks/               # useAITurn (search inside the delayed timeout), useConnectFourKeys, useAIDelay
  components/          # GameBoard (full + mini) + GameBoard.module.css, ModeSelect, AISpeedToggle
  demo/ConnectFourDemo.tsx (+ test)
  ConnectFourGame.tsx  # embeddable game, ArcadeGameProps; App.module.css for its layout
  ConnectFourGame.test.tsx
  App.tsx              # exactly <ArcadeShell gameId="connect4"><ConnectFourGame /></ArcadeShell>
  main.tsx             # imports arcade/arcade.css once, applyTheme(readTheme())
  index.ts             # exports ConnectFourGame, ConnectFourDemo, default + types
  test/setup.ts
```

Stats, Best, session autosave/restore, timer, theme, stat strip and overlays come from `src/arcade/`
(`useArcadeRun`, `useSessionAutosave`, `useRestoredSession`, `useRunTimer`, `StatPanel`, `GameOverlay`, `SaveBadge`, `KeyHelp`).
Change the kit only in Arcade-Game-Center and sync it.

`advanceGame(state, action)` owns every state transition and never calls the AI. `src/logic/*` never imports from `react`,
`hooks/` or `components/` (it may import pure helpers such as `duelRoundScore` from `../arcade`). Randomness is injected
(`Rng`); `Math.random` is only used by `useAITurn`'s default, the demo uses `seededRng`.

### AI invariants

* Scores are from the side to move; a win is `WIN − discs on the board when it lands` (absolute → TT-safe across iterations).
* `negamax` assumes nobody has won yet: it checks `canWinNext` first, then `nonLosingMoves`; the root checks `isWinningMove` itself.
* The TT is cleared per search (deterministic results). Time is read via `performance.now()` (not faked by Vitest) and capped by
  `nodeLimit`; tests use fixed depths or an injected clock.
* `chooseMove` order: immediate win → (Easy only: blunder roll) → block → random opening (demo) → search.

### Arcade status mapping

`ConnectFourGame` layers a UI `phase` (`idle | live | paused`) over the engine's round status (`playing | won | draw`):

| Arcade status | When |
| --- | --- |
| `idle` | first visit / after Discard, before Start (Start overlay) |
| `running` | phase `live` and round `playing` |
| `paused` | phase `paused` and round `playing` (also every restored session, and when the tab is hidden) |
| `gameOver` | round `won` / `draw` until the next round starts |

`runKey` is a round counter: Start, New round (R), mode change and New series increment it; abandoning a round never records it.
A restored round that had already finished is not replayed — `newRound` is applied and the series continues paused.

---

## Input

* **Mouse / touch**: each column is a `<button data-col>`; a click drops only while running and on the human's turn. Hover moves the cursor.
* **Keyboard** (`useConnectFourKeys`): one window listener per mount (handlers via ref); starts with `shouldIgnoreKey`.
  ← → / A D cursor · 1–7 jump · ↓ / S drop · Enter / Space drop / start / resume / next round (left to the native button when a
  button has focus) · **P/Esc** pause · **R** new round · **N** cycle mode · **C** reset scores (confirm overlay; **Shift+C** skips it).
  **T** is reserved for the theme.
* **AI** (`useAITurn`): runs the search in the timeout after the AI delay, only while running and no dialog is open; cancelled on
  every change and on unmount. `aiMove` carries the searched ply; `drop` is rejected on the AI's turn.

---

## Working Rules

**Verify before and after every non-trivial change.** Read the target file and its neighbours; afterwards re-check imports, call sites and state transitions.

**No hallucination.** Never claim a build, lint or test passed without running it.

**Small, local, reversible changes.** One fix or one feature at a time.

**Preserve architecture.** Do not change Vite config, tsconfig, folder layout or styling approach without a stated reason and user approval.

**No new dependencies** without justification. No Zustand, game engines, lodash, immer, animation libraries.

**CSS**: CSS Modules + kit tokens only. No `:root`, `html`, `body`, `*` or bare element selectors in game styles. Must look right in both `[data-theme='dark']` and `[data-theme='light']`.

---

## Connect-Four-Specific Bug Checklist

* Discs land on the lowest empty cell; full columns and bad indices are no-ops; no drop after the round ended.
* All four directions detected, no wrap across the board edge or across the 32-bit halves (columns 3 | 4); win check before draw.
* Bitboard and mailbox agree (cross-check test); `undo` restores bitboards and the heuristic exactly.
* AI never moves while idle, paused, behind the reset dialog or after the round ended; stale `aiMove`s are ignored.
* Every level takes an immediate win; Medium / Hard always block; Hard reaches ≥ 10 plies.
* Loser opens the next round; draws / abandoned rounds alternate the opener.
* Every finished round is recorded exactly once (`useArcadeRun` + `runKey`); PvP is unranked.
* The session validator replays the moves and rejects anything that does not match; restored sessions are always paused.
* Demo: no keyboard, stats or storage writes; one timeout chain; freezes when `active === false`.
* Hotkeys ignored while typing or with Cmd/Ctrl/Alt.

---

## Implementation Protocol (short)

1. **Current state** — only what you verified from the repo.
2. **Goal** — the exact requested change.
3. **Plan** — the smallest safe path and which files you will touch.
4. **Edit** — only the scoped change.
5. **Verify** — `npm run check`; note any checks you skipped.
6. **Report** — see below.

---

## End-of-Task Report

* **Changed files** — each file with a one-line reason.
* **Verified** — which checks actually ran.
* **Not verified** — explicit gaps.
* **Risks / follow-ups** — only real concerns, no filler.

---

**Guiding principle**: correctness over speed, verification over confidence, truth over fluency, small safe diffs over large rewrites. When in doubt — inspect more, assume less, change less, state uncertainty clearly.

---

## Git & Commit Rules

- Commit **only** as `Zoltán Dul <zoltan.dul@gmail.com>` (the global git identity).
- **Never** add `Co-Authored-By: Claude …`, "Generated with Claude Code" or any AI attribution
  to commit messages or pull-request descriptions.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
