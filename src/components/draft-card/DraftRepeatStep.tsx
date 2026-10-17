import React from 'react';
import { motion } from 'framer-motion';

import cardboardTexture from '../../assets/cardboard.svg';
import type { CardPalette, RecurrenceKind, RecurrenceRule } from '../../app/cardTheme';
import { describeRecurrence, WEEKDAY_LABELS } from '../../app/recurrence';
import { t } from '../../app/i18n';

export interface DraftRepeatStepProps {
  rule: RecurrenceRule;
  palette: CardPalette;
  onChange: (rule: RecurrenceRule) => void;
}

const OPTIONS: Array<{ kind: RecurrenceKind; label: string }> = [
  { kind: 'daily', label: t('Каждый день') },
  { kind: 'weekdays', label: t('По будням') },
  { kind: 'weekly', label: t('По дням недели') },
  { kind: 'interval', label: t('Раз в N дней') },
];

const pressStyle = (selected: boolean, palette: CardPalette): React.CSSProperties => ({
  color: selected ? palette.ink : 'rgba(30,28,26,0.7)',
  backgroundColor: selected ? palette.paper : 'rgba(245,236,218,0.16)',
  backgroundImage: `url(${cardboardTexture})`,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  backgroundBlendMode: 'multiply',
  border: selected
    ? `1.5px solid ${palette.accentDark}99`
    : '1px solid rgba(70,52,38,0.3)',
  boxShadow: selected
    ? 'inset 1px 2px 4px rgba(51,36,25,0.2), 0 1px 0 rgba(72,52,37,0.22)'
    : '0 3px 0 rgba(83,61,43,0.28), 0 5px 7px rgba(0,0,0,0.12), inset 1px 1px 1px rgba(255,255,255,0.24)',
});

const tap = {
  y: 2,
  boxShadow: 'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
  transition: { duration: 0.15 },
};

/**
 * "How often?" for a repeating card: four kinds of schedule, the days of the
 * week for a weekly one, the number of days for an interval one.
 */
export function DraftRepeatStep({ rule, palette, onChange }: DraftRepeatStepProps) {
  const selectKind = (kind: RecurrenceKind) => {
    if (kind === 'weekly') {
      onChange({ kind, weekdays: rule.weekdays?.length ? rule.weekdays : [0, 2, 4] });
    } else if (kind === 'interval') {
      onChange({ kind, intervalDays: rule.intervalDays ?? 2 });
    } else {
      onChange({ kind });
    }
  };

  const toggleDay = (day: number) => {
    const days = rule.weekdays ?? [];
    onChange({
      kind: 'weekly',
      weekdays: days.includes(day)
        ? days.filter((current) => current !== day)
        : [...days, day].sort((a, b) => a - b),
    });
  };

  const interval = rule.intervalDays ?? 2;

  return (
    <div className="min-h-0 flex-1">
      <span
        className="font-mono text-[15px] font-bold uppercase tracking-[0.17em]"
        style={{ color: 'rgba(30,28,26,0.72)', textShadow: '0 1px 0 rgba(255,255,255,0.28)' }}
      >{t('Как часто?')}</span>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {OPTIONS.map((option, index) => (
          <motion.button
            key={option.kind}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035, duration: 0.18, ease: 'easeOut' }}
            whileTap={tap}
            onClick={() => selectKind(option.kind)}
            aria-pressed={rule.kind === option.kind}
            className="min-h-[52px] rounded-[12px] px-2 text-center text-[14px] font-semibold leading-[1.15]"
            style={pressStyle(rule.kind === option.kind, palette)}
          >
            {option.label}
          </motion.button>
        ))}
      </div>

      {rule.kind === 'weekly' && (
        <div className="mt-3 grid grid-cols-7 gap-1" role="group" aria-label={t('Дни недели')}>
          {WEEKDAY_LABELS.map((label, day) => {
            const selected = (rule.weekdays ?? []).includes(day);

            return (
              <motion.button
                key={label}
                type="button"
                whileTap={tap}
                onClick={() => toggleDay(day)}
                aria-pressed={selected}
                className="min-h-[40px] rounded-[9px] font-mono text-[12.5px] font-bold uppercase"
                style={pressStyle(selected, palette)}
              >
                {label}
              </motion.button>
            );
          })}
        </div>
      )}

      {rule.kind === 'interval' && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <motion.button
            type="button"
            whileTap={tap}
            onClick={() => onChange({ kind: 'interval', intervalDays: Math.max(2, interval - 1) })}
            disabled={interval <= 2}
            aria-label={t('Реже на день')}
            className="h-[40px] w-[48px] rounded-[10px] font-mono text-[20px] font-bold disabled:opacity-40"
            style={pressStyle(false, palette)}
          >
            −
          </motion.button>
          <span className="min-w-[120px] text-center text-[16px] font-semibold" style={{ color: palette.ink }}>
            {describeRecurrence({ kind: 'interval', intervalDays: interval })}
          </span>
          <motion.button
            type="button"
            whileTap={tap}
            onClick={() => onChange({ kind: 'interval', intervalDays: Math.min(60, interval + 1) })}
            disabled={interval >= 60}
            aria-label={t('Чаще на день')}
            className="h-[40px] w-[48px] rounded-[10px] font-mono text-[20px] font-bold disabled:opacity-40"
            style={pressStyle(false, palette)}
          >
            +
          </motion.button>
        </div>
      )}

      <p
        className="mt-3 text-center font-mono text-[11.5px] uppercase tracking-[0.1em]"
        style={{ color: 'rgba(30,28,26,0.5)' }}
      >{t('Время выберете на следующем шаге')}</p>
    </div>
  );
}
