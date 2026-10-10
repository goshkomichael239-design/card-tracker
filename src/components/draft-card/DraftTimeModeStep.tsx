import { CARD_COLOR_SCHEMES, PALETTES, type TimeMode } from '../../app/cardTheme';
import { TimeOption } from '../shared/TimeOption';

export interface DraftTimeModeStepProps {
  timeMode: TimeMode | null;
  /** True once "Регулярно" was chosen (a repeating card is a reminder). */
  isRepeating: boolean;
  onSelectTimeMode: (mode: TimeMode) => void;
  onSelectRepeat: () => void;
}

// "Регулярно" gets its own colour so it is not mistaken for a reminder.
const REPEAT_PALETTE =
  CARD_COLOR_SCHEMES.find((scheme) => scheme.id === 'lavender') ?? PALETTES.reminder;

export function DraftTimeModeStep({
  timeMode,
  isRepeating,
  onSelectTimeMode,
  onSelectRepeat,
}: DraftTimeModeStepProps) {
  return (
    <div>
      <span
        className="font-mono text-[15px] font-bold uppercase tracking-[0.17em]"
        style={{
          color: 'rgba(30,28,26,0.72)',
          textShadow: '0 1px 0 rgba(255,255,255,0.28)',
        }}
      >
        Когда?
      </span>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <TimeOption index={0} lines={['Без', 'времени']} selected={timeMode === 'none'} palette={PALETTES.none} onClick={() => onSelectTimeMode('none')} />
        <TimeOption index={1} lines={['Выполнить', 'до:']} selected={timeMode === 'deadline'} palette={PALETTES.deadline} onClick={() => onSelectTimeMode('deadline')} />
        <TimeOption index={2} lines={['Напоминание', '']} selected={timeMode === 'reminder' && !isRepeating} palette={PALETTES.reminder} onClick={() => onSelectTimeMode('reminder')} />
        <TimeOption index={3} lines={['Регулярно', '']} selected={isRepeating} palette={REPEAT_PALETTE} onClick={onSelectRepeat} />
      </div>
    </div>
  );
}
