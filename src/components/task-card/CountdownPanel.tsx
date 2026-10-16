import React, { useEffect, useState } from 'react';
import { PALETTES, type CardPalette, type TimeMode } from '../../app/cardTheme';
import {
  formatOverdueTime,
  formatRemainingTime,
} from '../../app/dateTimeUtils';
import { t } from '../../app/i18n';

interface CountdownPanelProps {
  targetAt: string;
  mode: Exclude<TimeMode, 'none'>;
  completedAt?: string;
  palette: CardPalette;
  isStatic?: boolean;
}

export const CountdownPanel: React.FC<CountdownPanelProps> = ({
  targetAt,
  mode,
  completedAt,
  palette,
  isStatic = false,
}) => {
  const [now, setNow] = useState(() => Date.now());

  // Seconds are only on screen inside the last day, so the clock ticks every
  // second only then; it also rests while the page is hidden.
  useEffect(() => {
    if (completedAt || isStatic) {
      return;
    }

    const target = new Date(targetAt).getTime();
    let timer: number | null = null;

    const schedule = () => {
      const remaining = target - Date.now();
      const isFine = remaining > 0 && remaining < 24 * 60 * 60 * 1000;

      timer = window.setTimeout(tick, isFine ? 1_000 : 30_000);
    };
    const tick = () => {
      if (document.visibilityState !== 'hidden') {
        setNow(Date.now());
      }

      schedule();
    };
    const refreshWhenShown = () => {
      if (document.visibilityState === 'visible') {
        setNow(Date.now());
      }
    };

    schedule();
    document.addEventListener('visibilitychange', refreshWhenShown);

    return () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }

      document.removeEventListener('visibilitychange', refreshWhenShown);
    };
  }, [completedAt, isStatic, targetAt]);

  const remaining = new Date(targetAt).getTime() - now;
  const isPast = !completedAt && Number.isFinite(remaining) && remaining <= 0;
  // A passed deadline or reminder switches to the warm "alert" paper tone.
  const tone = isPast ? PALETTES.none : palette;

  const label = completedAt
    ? t('Выполнено')
    : isPast
      ? mode === 'deadline'
        ? t('Просрочено · {v}', { v: formatOverdueTime(-remaining) })
        : t('Пора · {v} назад', { v: formatOverdueTime(-remaining) })
      : formatRemainingTime(remaining);

  return (
    <div
      className="relative flex min-h-[42px] items-center rounded-[10px] border px-4 py-2.5"
      aria-label={
        completedAt
          ? t('Задача завершена')
          : isPast
            ? mode === 'deadline'
              ? t('Срок вышел')
              : t('Время напоминания наступило')
            : mode === 'deadline'
              ? t('Осталось для выполнения')
              : t('Осталось до напоминания')
      }
      style={{
        color: tone.accentDark,
        backgroundColor: `${tone.accent}${isPast ? '24' : '16'}`,
        borderColor: `${tone.accent}${isPast ? '5c' : '38'}`,
        boxShadow: 'inset 0 1px rgba(255,255,255,0.7)',
      }}
    >
      <div className="font-mono text-[17px] font-semibold tracking-[-0.02em]">
        {label}
      </div>
    </div>
  );
};
