# 🔴 Connect Four

A type-safe Connect Four built with **React 18**, **Vite** and **TypeScript** — 7 × 6 rack, falling-disc animation,
PvP and three AI levels driven by a **bitboard negamax with α-β pruning, a transposition table and iterative deepening**.
Runs on its own **and** as one of the nine games of **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** —
play it at [drdul.hu/arcade/#/play/connect4](https://drdul.hu/arcade/#/play/connect4).

[![CI](https://github.com/ZoliQua/Connect-Four-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Connect-Four-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Table of contents

- [The Zoltan's Arcade family](#-the-zoltans-arcade-family)
- [Features](#-features)
- [Quick start](#-quick-start)
- [Controls](#%EF%B8%8F-controls)
- [Scoring & stats](#-scoring--stats)
- [Autosave & resume](#-autosave--resume)
- [Embedding in Arcade-Game-Center](#-embedding-in-arcade-game-center)
- [How it works](#-how-it-works)
- [Scripts](#-scripts)
- [Architecture](#%EF%B8%8F-architecture)
- [Contributing](#-contributing)
- [License](#%EF%B8%8F-license)

## 🕹️ The Zoltan's Arcade family

Every game is a standalone repo that also plugs into the portal. They share one design system, one scoring model and one save format through the vendored [`src/arcade/`](./src/arcade) kit.

| Game | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | All games in one place, live demos, stats, leaderboard |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Puzzle |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Maze |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategy |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duel |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Paddle |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 **Connect Four** (this repo) | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duel |

## ✨ Features

- 🔴 **Classic 7 × 6 Connect Four** — discs fall to the lowest empty hole with a smooth drop (CSS transform; off under reduced motion)
- 🎮 **Four modes** — Player-vs-Player, Easy, Medium (default) and Hard; the AI modes are ranked
- 🧠 **Real search AI** — bitboard negamax, α-β pruning, transposition table, "non-losing moves" pruning, window heuristic;
  Hard deepens iteratively to 10+ plies (typically 15–22) in ~450 ms and solves endgames outright
- 👆 **Hover / keyboard preview** — a ghost disc shows where your drop goes; the winning four (or five…) glow, the rest dims
- 🏆 **Unified arcade scoring** — every round is scored with the shared duel formula; Best, plays and wins are shared with the portal
- 📊 **Series scoreboard** — You / AI / Draws (Red / Yellow / Draws in PvP) plus series points
- 🔄 **Loser-goes-first** — the previous round's loser opens the next round (draws and abandoned rounds alternate)
- ⏸️ **Pause** (P / Esc, or automatically when the tab is hidden) — freezes the board, the AI and the round timer
- 💾 **Autosave & resume** — the whole series (board, scores, points, mode) survives reloads and tab closes
- ⚡ **AI delay** — Instant / 0.15 s / 0.4 s / 1 s thinking delay, remembered
- 🌗 **Dark / light theme** shared with every arcade game (press **T**)
- 🤖 **Attract-mode demo** (`<ConnectFourDemo />`) — two shallow, slightly random AIs play the real engine on the portal's landing page
- ⌨️ **Keyboard-first and accessible** — columns are real buttons with `aria-label`s, visible focus, roving focus;
  hotkeys are ignored while you type in a form field or hold Cmd/Ctrl/Alt
- 🧪 **Tested** — rules, bitboard vs. mailbox cross-checks, exact endgame solving vs. plain minimax, AI tactics, scoring,
  the save validator, the demo and component behaviour

## 🚀 Quick start

Requires **Node ≥ 20** and npm.

```bash
git clone https://github.com/ZoliQua/Connect-Four-Game.git
cd Connect-Four-Game
npm install
npm run dev          # http://localhost:5173
```

Production build: `npm run build && npm run preview`. The build uses relative asset paths, so `dist/` can be served from any sub-folder.

## ⌨️ Controls

| Key | Action |
| --- | --- |
| 🖱️ Click / tap a column | Drop your disc into it |
| ⬅️ ➡️ / **A D** | Move the column cursor |
| **1** – **7** | Jump to that column |
| **Enter** / **Space** / ⬇️ / **S** | Drop on the cursor column (Enter/Space also start · resume · next round) |
| **P** / **Esc** | Pause / resume |
| **R** | New round (keeps the series) |
| **N** | Cycle mode (PvP → Easy → Medium → Hard; starts a new series) |
| **C** | Reset series scores (asks first — **Enter** confirms, **Esc** keeps) |
| **Shift + C** | Reset series scores without asking |
| **T** | Toggle dark / light theme (standalone page) |

Arrow keys call `preventDefault()` so the page never scrolls. Each column is a `<button>` labelled with its contents
(`Column 4, 2 of 6: yours (red), AI (yellow) (bottom up)`); when a column has keyboard focus, focus follows the cursor.
Enter / Space on a focused button activate that button natively.

## 🎯 Scoring & stats

Each **round is one arcade run**. When a round ends it is scored with the kit's shared `duelRoundScore` (the same formula
Gomoku and Tic-Tac-Toe use), from the human's side, with `moves` = discs dropped by both players and `boardCells` = 42:

| Result | Points | Easy (base 100) | Medium (base 250) | Hard (base 500) |
| --- | --- | --- | --- | --- |
| Win | `base × (1 + empty cells / 42)` | 183 (7-disc win) … 150 (21 discs) … 100 | 458 … 375 … 250 | **917** … 750 … 500 |
| Draw | `base / 4` | 25 | 63 | 125 |
| Loss | 0 | 0 | 0 | 0 |
| PvP | 0 — unranked | | | |

The stat strip shows:

| Stat | Meaning |
| --- | --- |
| **Score** | The current round's score (0 while playing, set when the round ends) |
| **Best** | Best single-round score ever (`arcade.stats.connect4`, shared with the portal) |
| **W–L–D** | Your wins – AI wins – draws this series (in PvP: **R–Y–D**, red – yellow – draws) |
| **Time** | Active (unpaused) time of the current round |

The **Series** panel repeats the tally in large numbers and shows the series points (the sum of round scores in this mode).
Every finished round is recorded once by the kit under `arcade.stats.connect4` (`best`, `plays`, `wins`, `totalScore`,
`totalSeconds`, `lastScore`, `lastPlayedAt`). PvP rounds are recorded as unranked (`ranked: false`, outcome from red's side):
they count as plays but never touch Best or the leaderboard, and `onGameOver` is not called for them.

## 💾 Autosave & resume

The session is the **whole series**, not just the round: board, column history, side to move, mode, opener, series scores and
points (key `arcade.session.connect4`, schema-versioned). It is checked by a strict validator that **replays the saved column list**
and rejects anything that does not match exactly (floating discs, a disc after a win, wrong turn order, a wrong highlight).
It is saved about once a second, whenever the page is hidden and when the game unmounts — and it is kept **between rounds**.
Reloading shows **Welcome back** with the series paused (*Continue* · *New round* · *New series*); a round that had already
finished is not replayed — the series continues with a fresh round. Only **Discard** next to the *Autosaved* badge (back to an
idle board), *Reset scores* or a mode change drop it.

## 🧩 Embedding in Arcade-Game-Center

```tsx
import { ConnectFourGame, ConnectFourDemo } from '@arcade/connect4';

<ConnectFourGame
  embedded                                   // hide the page title; the portal shows it
  onGameOver={(score) => submitScore('connect4', score)}   // ranked rounds with points > 0
  onRunEnd={(run) => console.log(run.outcome, run.ranked)} // every round, PvP included
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<ConnectFourDemo active={cardIsVisible} />    // landing-page attract mode
```

Both components follow the shared `ArcadeGameProps` / `ArcadeDemoProps` contract from `src/arcade/types.ts`.

Status mapping: `idle` before the first round of a visit (Start overlay), `running` while a round is played, `paused` while
suspended (or restored), `gameOver` from the moment a round ends until the next one starts. `score` is the current round's
score; `runKey` is a round counter.

## 🧠 How it works

The engine is a single pure reducer, `advanceGame(state, action)`, over a 42-cell array (row 0 at the top) plus the column history:

```
playing ──┬── (four in a row) ──────────→ won   ─┐
          └── (rack full, no four) ──────→ draw  ─┴─ newRound → playing (loser opens)
```

1. **`drop`** puts the side to move's disc on the lowest empty cell of a column — rejected on the AI's turn, on full columns and after the round ended.
2. **`aiMove`** carries the AI's column **and the ply it searched**; a stale answer for a changed position is ignored.
3. Win check first (every line through the new disc, so five-in-a-row and crossing lines all light up), then the full-rack draw check.
4. A finished round is **scored** with `duelRoundScore`; series points and the tally update in the same step.
5. **`newRound`** clears the rack and keeps the series; **`changeMode`** starts a new series; **`resetScores`** zeroes it.

### 🤖 Game modes & AI

| Mode | Red (opens round 1) | Yellow | Engine |
| --- | --- | --- | --- |
| **PvP** | Human | Human (same device) | — |
| **Easy** | Human | AI | depth 2, wide random choice, 30 % random drops (may miss a block) |
| **Medium** | Human | AI | depth 4, random among near-equal moves |
| **Hard** | Human | AI | iterative deepening ≥ 10 plies, ~450 ms budget, deterministic |

Every level **takes an immediate win**; Medium and Hard **always block** an immediate threat (Easy usually does).

The search (`src/logic/ai.ts`, `src/logic/bitboard.ts`):

- **Bitboard** — the classic 7 × (6 + 1) layout (bit `col·7 + row`, an empty sentinel row per column so lines never wrap),
  split on a column boundary into two 32-bit integers (columns 0–3 / 4–6). Four-in-a-row, "winning cells" and playable cells are a
  handful of shifts and ANDs — no BigInt, no allocation.
- **Negamax + α-β**, with move ordering: transposition-table move first, then the drop that creates the most threats, centre-first on ties.
- **Non-losing moves** (after Pascal Pons): if the opponent has one playable winning cell only blocking it is searched, two means the
  position is lost, and a drop directly below an opponent winning cell is never searched.
- **Transposition table** — 2¹⁸ typed-array slots keyed by the unique `stones + mask` encoding, storing score, bound, depth and best move.
  Win scores are absolute (`WIN − discs on the board`), so entries stay valid across iterations; the table is cleared per search so
  results never depend on earlier games.
- **Heuristic** at the depth limit: all 69 lines of four are scored incrementally on make / unmake (1 / 4 / 16 points for one / two /
  three discs in an otherwise empty line, ± by side) plus 3 points per centre-column disc — O(1) at the leaves.
- **Iterative deepening** (Hard) under a time budget with a node cap; an unfinished iteration is discarded. It runs ~3 M nodes/s on a
  laptop, reaching depth 15–22 within the budget and solving the last ~20 plies exactly.

`useAITurn` waits the chosen delay, then runs the search inside the timeout callback — off the render path and outside the
(pure) reducer — and dispatches the column; any state change, pause, dialog or unmount cancels it.

### 🎬 Demo

`ConnectFourDemo` lets two fast AIs (depth 3, random opening, a little slack and a 6 % blunder rate) play the real engine:
one disc every 360 ms, a new round 1.6 s after each result. It renders the mini board, has no keyboard listeners, no stats and
no storage writes, and freezes when `active` is false.

## 🧪 Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (logic + component tests) |
| `npm run check` | lint → typecheck → test → build (what CI runs) |

## 🏗️ Architecture

```
src/
  arcade/                 vendored Zoltan's Arcade kit — do not edit here (see its README)
  logic/                  pure game rules, no React
    types.ts constants.ts
    board.ts              drop / landing row / win lines / replay on the 42-cell array
    game.ts               advanceGame reducer, createInitialState, roundOutcome, scoring
    bitboard.ts           two-int bitboard Position with make / unmake + incremental heuristic
    ai.ts                 negamax α-β + TT + iterative deepening, chooseMove per level
    autopilot.ts          AI-vs-AI demo driver + seeded RNG
    persist.ts            strict runtime validation of saved sessions (replays the moves)
  hooks/                  useAITurn, useConnectFourKeys, useAIDelay
  components/             GameBoard (full + mini), ModeSelect, AISpeedToggle
  demo/ConnectFourDemo.tsx  landing-page attract mode
  ConnectFourGame.tsx     the embeddable game (ArcadeGameProps)
  App.tsx                 standalone page: <ArcadeShell><ConnectFourGame/></ArcadeShell>
  main.tsx                entry; loads the shared arcade.css once
  index.ts                package entry used by Arcade-Game-Center
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md), the [Code of Conduct](./CODE_OF_CONDUCT.md) and [SECURITY.md](./SECURITY.md).
Contributors are listed in [CONTRIBUTORS.md](./CONTRIBUTORS.md); changes in [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ License

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Made with ❤️ by Zoltán Dul · part of <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
