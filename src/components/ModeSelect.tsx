import { useMessages } from '../arcade';
import { MESSAGES, type MessageKey } from '../i18n';
import type { Mode } from '../logic/types';

export type ModeSelectProps = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

const MODES: ReadonlyArray<{ id: Mode; label: MessageKey; hint: MessageKey }> = [
  { id: 'pvp', label: 'modePvp', hint: 'hintPvp' },
  { id: 'easy', label: 'modeEasy', hint: 'hintEasy' },
  { id: 'medium', label: 'modeMedium', hint: 'hintMedium' },
  { id: 'hard', label: 'modeHard', hint: 'hintHard' },
];

export const ModeSelect = ({ mode, onChange }: ModeSelectProps) => {
  const t = useMessages(MESSAGES);
  return (
    <div className="arc-segmented arc-segmented--full" role="group" aria-label={t('modeGroup')}>
      {MODES.map(({ id, label, hint }) => (
        <button type="button" key={id} aria-pressed={id === mode} title={t(hint)} onClick={() => onChange(id)}>
          {t(label)}
        </button>
      ))}
    </div>
  );
};

export default ModeSelect;
