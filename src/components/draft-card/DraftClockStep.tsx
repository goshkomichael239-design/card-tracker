import { motion } from 'framer-motion';

import cardboardTexture from '../../assets/cardboard.svg';
import type { CardPalette } from '../../app/cardTheme';
import { t } from '../../app/i18n';

export interface DraftClockStepProps {
  palette: CardPalette;
  draftHourInput: string;
  draftMinuteInput: string;
  isSelectedDateTimeValid: boolean;
  onTimeInputChange: (part: 'hour' | 'minute', value: string) => void;
  onCommitTimeInput: (part: 'hour' | 'minute') => void;
  onAdjustHour: (direction: -1 | 1) => void;
  onAdjustMinute: (direction: -5 | 5) => void;
}

export function DraftClockStep({
  palette,
  draftHourInput,
  draftMinuteInput,
  isSelectedDateTimeValid,
  onTimeInputChange,
  onCommitTimeInput,
  onAdjustHour,
  onAdjustMinute,
}: DraftClockStepProps) {
  const controls = [
    {
      label: t('Часы'),
      onIncrease: () => onAdjustHour(1),
      onDecrease: () => onAdjustHour(-1),
    },
    {
      label: t('Минуты'),
      onIncrease: () => onAdjustMinute(5),
      onDecrease: () => onAdjustMinute(-5),
    },
  ];

  return (
    <div className="min-h-0 flex-1">
      <span
        className="font-mono text-[15px] font-bold uppercase tracking-[0.17em]"
        style={{
          color: 'rgba(30,28,26,0.72)',
          textShadow: '0 1px 0 rgba(255,255,255,0.28)',
        }}
      >{t('Время')}</span>

      <div
        className="mt-3 flex items-center justify-center gap-2 font-mono text-[2rem] font-bold tracking-[0.08em]"
        style={{
          color: palette.ink,
          textShadow: '0 1px 0 rgba(255,255,255,0.28)',
        }}
      >
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={draftHourInput}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => onTimeInputChange('hour', event.target.value)}
          onBlur={() => onCommitTimeInput('hour')}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          }}
          className="h-[48px] w-[64px] rounded-[10px] border-0 bg-transparent p-0 text-center font-mono text-[2rem] font-bold outline-none focus:bg-black/[0.04]"
          style={{
            color: palette.ink,
            caretColor: palette.accentDark,
            boxShadow:
              'inset 0 1px 3px rgba(48,34,24,0.13), 0 1px 0 rgba(255,255,255,0.18)',
          }}
          aria-label={t('Часы')}
        />
        <span aria-hidden="true">:</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={draftMinuteInput}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => onTimeInputChange('minute', event.target.value)}
          onBlur={() => onCommitTimeInput('minute')}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          }}
          className="h-[48px] w-[64px] rounded-[10px] border-0 bg-transparent p-0 text-center font-mono text-[2rem] font-bold outline-none focus:bg-black/[0.04]"
          style={{
            color: palette.ink,
            caretColor: palette.accentDark,
            boxShadow:
              'inset 0 1px 3px rgba(48,34,24,0.13), 0 1px 0 rgba(255,255,255,0.18)',
          }}
          aria-label={t('Минуты')}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        {controls.map((control) => (
          <div key={control.label} className="flex flex-col items-center">
            <motion.button
              type="button"
              onClick={control.onIncrease}
              whileTap={{
                y: 2,
                boxShadow:
                  'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
                transition: { duration: 0.15 },
              }}
              className="min-h-[42px] w-full rounded-[10px] border-0 font-mono text-[20px] font-bold"
              style={{
                color: palette.ink,
                backgroundColor: 'rgba(245,236,218,0.16)',
                backgroundImage: 'url(' + cardboardTexture + ')',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundBlendMode: 'multiply',
                border: '1px solid rgba(70,52,38,0.28)',
                boxShadow:
                  '0 3px 0 rgba(83,61,43,0.3), 0 5px 7px rgba(0,0,0,0.1)',
              }}
            >
              +
            </motion.button>
            <span
              className="my-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.13em]"
              style={{ color: 'rgba(30,28,26,0.52)' }}
            >
              {control.label}
            </span>
            <motion.button
              type="button"
              onClick={control.onDecrease}
              whileTap={{
                y: 2,
                boxShadow:
                  'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
                transition: { duration: 0.15 },
              }}
              className="min-h-[42px] w-full rounded-[10px] border-0 font-mono text-[20px] font-bold"
              style={{
                color: palette.ink,
                backgroundColor: 'rgba(245,236,218,0.16)',
                backgroundImage: 'url(' + cardboardTexture + ')',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundBlendMode: 'multiply',
                border: '1px solid rgba(70,52,38,0.28)',
                boxShadow:
                  '0 3px 0 rgba(83,61,43,0.3), 0 5px 7px rgba(0,0,0,0.1)',
              }}
            >
              −
            </motion.button>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((slot) => (
          <div
            key={slot}
            className="flex min-h-[34px] items-center justify-center rounded-[9px] font-mono text-[8px] font-semibold uppercase tracking-[0.1em]"
            style={{
              color: 'rgba(30,28,26,0.28)',
              border: '1px dashed rgba(70,52,38,0.22)',
              backgroundColor: 'rgba(255,255,255,0.04)',
            }}
          >{t('Пресет')}</div>
        ))}
      </div>

      <div
        className="mt-2 min-h-[14px] text-center font-mono text-[9px] uppercase tracking-[0.08em]"
        style={{
          color: isSelectedDateTimeValid ? 'transparent' : palette.accentDark,
        }}
      >{t('Выберите будущее время')}</div>
    </div>
  );
}
