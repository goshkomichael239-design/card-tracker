import { PALETTES, type TimeMode } from '../../app/cardTheme';
import { TimeOption } from '../shared/TimeOption';

export interface DraftTimeModeStepProps {
  timeMode: TimeMode | null;
  onSelectTimeMode: (mode: TimeMode) => void;
}

export function DraftTimeModeStep({ timeMode, onSelectTimeMode }: DraftTimeModeStepProps) {
  return (
    <div>
      <span
        className="font-mono text-[13px] font-bold uppercase tracking-[0.17em]"
        style={{
          color: 'rgba(30,28,26,0.72)',
          textShadow: '0 1px 0 rgba(255,255,255,0.28)',
        }}
      >
        Когда?
      </span>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <TimeOption index={0} lines={['Без', 'времени']} selected={timeMode === 'none'} palette={PALETTES.none} onClick={() => onSelectTimeMode('none')} />
        <TimeOption index={1} lines={['Выполнить', 'до:']} selected={timeMode === 'deadline'} palette={PALETTES.deadline} onClick={() => onSelectTimeMode('deadline')} />
        <TimeOption index={2} lines={['Напоминание', '']} selected={timeMode === 'reminder'} palette={PALETTES.reminder} onClick={() => onSelectTimeMode('reminder')} />
      </div>
    </div>
  );
}
