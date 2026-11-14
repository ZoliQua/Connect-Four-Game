import type { ReactNode } from 'react';
import {
  formatNumber,
  Molar,
  Tooth,
  useDental,
  useIsTouch,
  useKitMessages,
  useLang,
  useMessages,
  type RulesSection,
} from './arcade';
import { MESSAGES, type MessageKey } from './i18n';
import { drawScore, winScoreRange } from './logic/game';
import type { Mode } from './logic/types';

const CELL = 30;
const GAP = 6;
const X0 = 10;
const Y0 = 10;
const ROWS = 4;
const at = (col: number) => X0 + col * (CELL + GAP);
const atRow = (rowFromBottom: number) => Y0 + (ROWS - 1 - rowFromBottom) * (CELL + GAP);

/** Columns bottom-up: 1 = red, 2 = yellow. The red discs make a rising diagonal four. */
const COLUMNS: number[][] = [[1], [2, 1], [2, 2, 1], [1, 2, 2, 1], []];

function Disc({ player, col, row, dental }: { player: 1 | 2; col: number; row: number; dental: boolean }) {
  const x = at(col);
  const y = atRow(row);
  if (dental) {
    return (
      <g transform={`translate(${x} ${y})`}>
        {player === 1 ? <Tooth size={CELL} /> : <Molar size={CELL} />}
      </g>
    );
  }
  const cx = x + CELL / 2;
  const cy = y + CELL / 2;
  return player === 1 ? (
    <circle cx={cx} cy={cy} r={13} fill="#e5383b" stroke="var(--text)" strokeWidth={1.5} />
  ) : (
    <g>
      <circle cx={cx} cy={cy} r={13} fill="#f5c518" stroke="var(--text)" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={5} fill="none" stroke="#000" strokeWidth={2} />
    </g>
  );
}

/** Rules diagram: four red discs in a diagonal line, struck through and ticked (✓). */
export function FourDiagram() {
  const m = useMessages(MESSAGES);
  const [dental] = useDental();
  const holes = [];
  for (let c = 0; c < 5; c += 1) {
    for (let r = 0; r < ROWS; r += 1) {
      holes.push(
        <rect key={`${c}${r}`} x={at(c)} y={atRow(r)} width={CELL} height={CELL} rx={CELL / 2} fill="none" stroke="var(--text-mute)" strokeWidth={1.5} />,
      );
    }
  }
  const discs = COLUMNS.flatMap((column, c) =>
    column.map((p, r) => <Disc key={`d${c}${r}`} player={p as 1 | 2} col={c} row={r} dental={dental} />),
  );
  return (
    <svg viewBox="0 0 230 176" role="img" aria-label={m('rulesDiagramLabel')} style={{ width: '100%', maxWidth: 300, height: 'auto', display: 'block', margin: '8px auto' }}>
      {holes}
      {discs}
      <path
        d={`M${at(0) + 4} ${atRow(0) + CELL - 4}L${at(3) + CELL - 4} ${atRow(3) + 4}`}
        stroke="var(--text)"
        strokeWidth={3}
        strokeDasharray="7 4"
        strokeLinecap="round"
      />
      <path d="M192 52l10 10 20-24" fill="none" stroke="var(--text)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <text x={97} y={170} fontSize="12" fontWeight="700" fill="var(--text)" textAnchor="middle">
        {m('rulesDiagramRow')}
      </text>
    </svg>
  );
}

const MODE_KEY: Record<Exclude<Mode, 'pvp'>, MessageKey> = { easy: 'modeEasy', medium: 'modeMedium', hard: 'modeHard' };

// eslint-disable-next-line react-refresh/only-export-components -- the diagram and its hook belong together
export function useRulesSections(): RulesSection[] {
  const m = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const touch = useIsTouch();
  const num = (n: number) => formatNumber(n, lang);
  const ios = typeof navigator !== 'undefined' && /iP(hone|od)/.test(navigator.userAgent);
  const mobile: ReactNode = (
    <ul>
      <li>{m('rulesMobileTap')}</li>
      <li>{m('rulesMobileFs')}</li>
      {ios && <li>{k('iosHomeScreenTip')}</li>}
    </ul>
  );
  return [
    {
      id: 'goal',
      body: (
        <>
          <p>{m('rulesGoal')}</p>
          <FourDiagram />
        </>
      ),
    },
    { id: 'play', body: <p>{touch ? m('rulesPlayTouch') : m('rulesPlayKeys')}</p> },
    {
      id: 'rules',
      body: (
        <ul>
          <li>{m('rulesRulesWin')}</li>
          <li>{m('rulesRulesTurn')}</li>
          <li>{m('rulesRulesSave')}</li>
        </ul>
      ),
    },
    {
      id: 'scoring',
      body: (
        <>
          <p>{m('rulesScoringIntro')}</p>
          <ul>
            {(['easy', 'medium', 'hard'] as const).map((mode) => (
              <li key={mode}>
                {m('rulesScoringMode', {
                  mode: m(MODE_KEY[mode]),
                  min: num(winScoreRange(mode).min),
                  max: num(winScoreRange(mode).max),
                  draw: num(drawScore(mode)),
                })}
              </li>
            ))}
          </ul>
          <p>{m('rulesScoringPvp', { zero: num(0) })}</p>
          <p>{m('rulesScoringFinish', { zero: num(0) })}</p>
        </>
      ),
    },
    { id: 'dental', body: <p>{m('rulesDentalText')}</p> },
    { id: 'mobile', body: mobile },
  ];
}
