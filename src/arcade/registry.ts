import type { ArcadeGameId } from './types';

export type ArcadeGameInfo = {
  id: ArcadeGameId;
  name: string;
  /** GitHub repository of the standalone game. */
  repo: string;
  /** Short genre tag shown on cards. */
  tag: string;
  /** One-line pitch. */
  tagline: string;
  /** CSS custom property holding the game's accent colour. */
  colorVar: string;
  /** Pre-kit localStorage key of the best score, migrated into stats. */
  legacyBestKey?: string;
};

export const ARCADE_PORTAL_URL = 'https://drdul.hu/arcade/';
export const ARCADE_REPO_URL = 'https://github.com/ZoliQua/Arcade-Game-Center';
export const ARCADE_AUTHOR = 'Zoltán Dul';

export const ARCADE_GAMES: readonly ArcadeGameInfo[] = [
  {
    id: 'tetris',
    name: 'Tetris',
    repo: 'https://github.com/ZoliQua/Tetris-Game',
    tag: 'Arcade',
    tagline: 'Stack falling blocks, clear lines, chase a Tetris. SRS rotation, 7-bag, hold.',
    colorVar: '--game-tetris',
    legacyBestKey: 'tetris.highScore',
  },
  {
    id: 'snake',
    name: 'Snake',
    repo: 'https://github.com/ZoliQua/Snake-Game',
    tag: 'Reflex',
    tagline: "Eat, grow, don't bite yourself. Adjustable speed, optional wall wrap.",
    colorVar: '--game-snake',
    legacyBestKey: 'snake.highScore',
  },
  {
    id: '2048',
    name: '2048',
    repo: 'https://github.com/ZoliQua/2048-Game',
    tag: 'Puzzle',
    tagline: 'Slide tiles, merge equal numbers. Get to 2048 — and beyond.',
    colorVar: '--game-2048',
    legacyBestKey: '2048.highScore',
  },
  {
    id: 'pacman',
    name: 'Pac-Man',
    repo: 'https://github.com/ZoliQua/Pac-Man-Game',
    tag: 'Maze',
    tagline: 'Gobble dots and power pellets while four ghosts scatter, chase and flee.',
    colorVar: '--game-pacman',
    legacyBestKey: 'pacman.highScore',
  },
  {
    id: 'gomoku',
    name: 'Gomoku',
    repo: 'https://github.com/ZoliQua/Gomoku-Game',
    tag: 'Strategy',
    tagline: 'Five in a row on a 15×15 goban against an α-β minimax AI — or a friend.',
    colorVar: '--game-gomoku',
  },
  {
    id: 'tictactoe',
    name: 'Tic-Tac-Toe',
    repo: 'https://github.com/ZoliQua/Tic-Tac-Toe-Game',
    tag: 'Duel',
    tagline: 'Three in a row with tooth or X/O marks. The hard AI never loses.',
    colorVar: '--game-tictactoe',
  },
  {
    id: 'breakout',
    name: 'Breakout',
    repo: 'https://github.com/ZoliQua/Breakout-Game',
    tag: 'Paddle',
    tagline: 'Bounce the ball, smash every brick. Power-ups, multiball, faster each level.',
    colorVar: '--game-breakout',
  },
  {
    id: 'invaders',
    name: 'Space Invaders',
    repo: 'https://github.com/ZoliQua/Space-Invaders-Game',
    tag: 'Shooter',
    tagline: 'Hold the line against marching alien waves. Crumbling bunkers, mystery UFO.',
    colorVar: '--game-invaders',
  },
  {
    id: 'connect4',
    name: 'Connect Four',
    repo: 'https://github.com/ZoliQua/Connect-Four-Game',
    tag: 'Duel',
    tagline: 'Drop discs, line up four. A 7×6 classic against an α-β minimax AI — or a friend.',
    colorVar: '--game-connect4',
  },
  {
    id: 'nutsort',
    name: 'Nut Sort',
    repo: 'https://github.com/ZoliQua/Nut-Sort-Game',
    tag: 'Sorting',
    tagline: 'Sort the nuts onto bolts in as few moves as you can — shaped for colour-blind players.',
    colorVar: '--game-nutsort',
  },
];

export function gameInfo(id: ArcadeGameId): ArcadeGameInfo {
  const info = ARCADE_GAMES.find((g) => g.id === id);
  if (!info) throw new Error(`Unknown arcade game: ${id}`);
  return info;
}
