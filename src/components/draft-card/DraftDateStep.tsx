import { motion } from 'framer-motion';

import cardboardTexture from '../../assets/cardboard.avif';
import type { CardPalette } from '../../app/cardTheme';
import {
  formatDraftDate,
  isSameLocalDay,
  MONTH_NAMES_RU,
  WEEKDAYS_RU,
} from '../../app/dateTimeUtils';

export interface DraftDateStepProps {
  palette: CardPalette;
  selectedDateLabel: string;
  selectedDraftDate: Date;
  isManualCalendarOpen: boolean;
  datePresets: Array<{ label: string; date: Date }>;
  calendarView: Date;
  calendarCells: Array<number | null>;
  currentDraftDay: Date;
  canGoToPreviousYear: boolean;
  canGoToPreviousMonth: boolean;
  onSelectDate: (date: Date) => void;
  onOpenManualCalendar: () => void;
  onChangeYear: (direction: -1 | 1) => void;
  onChangeMonth: (direction: -1 | 1) => void;
}

export function DraftDateStep({
  palette,
  selectedDateLabel,
  selectedDraftDate,
  isManualCalendarOpen,
  datePresets,
  calendarView,
  calendarCells,
  currentDraftDay,
  canGoToPreviousYear,
  canGoToPreviousMonth,
  onSelectDate,
  onOpenManualCalendar,
  onChangeYear,
  onChangeMonth,
}: DraftDateStepProps) {
  return (
    <div className="min-h-0 flex-1">
      <span
        className="font-mono text-[15px] font-bold uppercase tracking-[0.17em]"
        style={{
          color: 'rgba(30,28,26,0.72)',
          textShadow: '0 1px 0 rgba(255,255,255,0.28)',
        }}
      >
        Дата
      </span>

      <div
        className="mt-3 rounded-[10px] px-3 py-2.5 text-center"
        style={{
          backgroundColor: 'rgba(255,255,255,0.08)',
          boxShadow:
            'inset 0 1px 3px rgba(43,31,23,0.12), 0 1px 0 rgba(255,255,255,0.18)',
        }}
      >
        <span
          className="font-mono text-[12.5px] font-bold uppercase tracking-[0.1em]"
          style={{ color: palette.ink }}
        >
          {selectedDateLabel} · {formatDraftDate(selectedDraftDate)}
        </span>
      </div>

      {!isManualCalendarOpen ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {datePresets.map((preset) => (
            <motion.button
              key={preset.label}
              type="button"
              onClick={() => onSelectDate(preset.date)}
              whileHover={{ y: -1, filter: 'brightness(1.025)' }}
              whileTap={{
                y: 2,
                boxShadow:
                  'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
                transition: { duration: 0.07, ease: 'easeOut' },
              }}
              className="min-h-[43px] rounded-[10px] border-0 px-2 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.09em]"
              style={{
                color: 'rgba(30,28,26,0.68)',
                backgroundColor: 'rgba(245,236,218,0.16)',
                backgroundImage: 'url(' + cardboardTexture + ')',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundBlendMode: 'multiply',
                border: '1px solid rgba(70,52,38,0.28)',
                boxShadow:
                  '0 2px 0 rgba(83,61,43,0.28), 0 4px 6px rgba(0,0,0,0.1), inset 1px 1px 1px rgba(255,255,255,0.22)',
              }}
            >
              {preset.label}
            </motion.button>
          ))}

          <motion.button
            type="button"
            onClick={onOpenManualCalendar}
            whileHover={{ y: -1, filter: 'brightness(1.025)' }}
            whileTap={{
              y: 2,
              boxShadow:
                'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
              transition: { duration: 0.07, ease: 'easeOut' },
            }}
            className="min-h-[43px] rounded-[10px] border-0 px-2 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.09em]"
            style={{
              color: 'rgba(30,28,26,0.68)',
              backgroundColor: 'rgba(245,236,218,0.16)',
              backgroundImage: 'url(' + cardboardTexture + ')',
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundBlendMode: 'multiply',
              border: '1px solid rgba(70,52,38,0.28)',
              boxShadow:
                '0 2px 0 rgba(83,61,43,0.28), 0 4px 6px rgba(0,0,0,0.1), inset 1px 1px 1px rgba(255,255,255,0.22)',
            }}
          >
            Вручную
          </motion.button>
        </div>
      ) : (
        <div
          className="mt-2 rounded-[12px] px-2 py-2"
          style={{
            backgroundColor: 'rgba(255,255,255,0.07)',
            boxShadow:
              'inset 0 2px 5px rgba(48,34,24,0.11), 0 1px 0 rgba(255,255,255,0.16)',
          }}
        >
          <div className="grid grid-cols-[30px_1fr_30px] items-center">
            <button
              type="button"
              onClick={() => onChangeYear(-1)}
              disabled={!canGoToPreviousYear}
              className="h-[28px] rounded-[8px] border-0 bg-transparent font-mono text-[16px] disabled:opacity-0"
              style={{ color: palette.accentDark }}
              aria-label="Предыдущий год"
            >
              ←
            </button>
            <span
              className="text-center font-mono text-[12.5px] font-bold tracking-[0.14em]"
              style={{ color: palette.ink }}
            >
              {calendarView.getFullYear()}
            </span>
            <motion.button
              type="button"
              onClick={() => onChangeYear(1)}
              whileTap={{ y: 1, transition: { duration: 0.07 } }}
              className="h-[28px] rounded-[8px] border-0 bg-transparent font-mono text-[16px]"
              style={{ color: palette.accentDark }}
              aria-label="Следующий год"
            >
              →
            </motion.button>
          </div>

          <div className="grid grid-cols-[30px_1fr_30px] items-center">
            <button
              type="button"
              onClick={() => onChangeMonth(-1)}
              disabled={!canGoToPreviousMonth}
              className="h-[28px] rounded-[8px] border-0 bg-transparent font-mono text-[16px] disabled:opacity-0"
              style={{ color: palette.accentDark }}
              aria-label="Предыдущий месяц"
            >
              ←
            </button>
            <span
              className="text-center font-mono text-[11.5px] font-bold uppercase tracking-[0.13em]"
              style={{ color: palette.ink }}
            >
              {MONTH_NAMES_RU[calendarView.getMonth()]}
            </span>
            <motion.button
              type="button"
              onClick={() => onChangeMonth(1)}
              whileTap={{ y: 1, transition: { duration: 0.07 } }}
              className="h-[28px] rounded-[8px] border-0 bg-transparent font-mono text-[16px]"
              style={{ color: palette.accentDark }}
              aria-label="Следующий месяц"
            >
              →
            </motion.button>
          </div>

          <div className="mt-1 grid grid-cols-7 gap-[2px]">
            {WEEKDAYS_RU.map((weekday) => (
              <span
                key={weekday}
                className="text-center font-mono text-[8px] font-semibold uppercase"
                style={{ color: 'rgba(30,28,26,0.42)' }}
              >
                {weekday}
              </span>
            ))}

            {calendarCells.map((day, index) => {
              if (day === null) {
                return <span key={'blank-' + index} className="h-[24px]" />;
              }

              const dayValue = new Date(
                calendarView.getFullYear(),
                calendarView.getMonth(),
                day,
              );
              const isPast = dayValue.getTime() < currentDraftDay.getTime();
              const isToday = isSameLocalDay(dayValue, currentDraftDay);
              const isSelected = isSameLocalDay(dayValue, selectedDraftDate);

              return (
                <motion.button
                  key={day}
                  type="button"
                  disabled={isPast}
                  onClick={() => onSelectDate(dayValue)}
                  whileTap={
                    isPast
                      ? undefined
                      : { y: 1, transition: { duration: 0.06 } }
                  }
                  className="h-[24px] rounded-[7px] border-0 p-0 text-center font-mono text-[10.5px] font-semibold disabled:cursor-default"
                  style={{
                    color: isSelected
                      ? '#FFFFFF'
                      : isPast
                        ? 'rgba(30,28,26,0.22)'
                        : palette.ink,
                    backgroundColor: isSelected ? palette.accent : 'transparent',
                    border: isToday
                      ? '1px solid ' + palette.accent + '99'
                      : '1px solid transparent',
                    boxShadow: isSelected
                      ? 'inset 1px 1px 2px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)'
                      : 'none',
                  }}
                >
                  {day}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
