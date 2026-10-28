import type { Mode } from '../logic/types';

export type ModeSelectProps = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

const MODES: ReadonlyArray<{ id: Mode; label: string; hint: string }> = [
  { id: 'pvp', label: 'PvP', hint: 'Two players on one device (N cycles modes)' },
  { id: 'easy', label: 'Easy', hint: 'Shallow search that often drifts (N cycles modes)' },
  { id: 'medium', label: 'Medium', hint: 'Looks four plies ahead (N cycles modes)' },
  { id: 'hard', label: 'Hard', hint: 'Deep α-β search — solves endgames (N cycles modes)' },
];

export const ModeSelect = ({ mode, onChange }: ModeSelectProps) => (
  <div className="arc-segmented arc-segmented--full" role="group" aria-label="Game mode">
    {MODES.map(({ id, label, hint }) => (
      <button type="button" key={id} aria-pressed={id === mode} title={hint} onClick={() => onChange(id)}>
        {label}
      </button>
    ))}
  </div>
);

export default ModeSelect;
