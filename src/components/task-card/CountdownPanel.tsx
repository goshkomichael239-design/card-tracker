import React, { useEffect, useState } from 'react';
import { PALETTES, type CardPalette, type TimeMode } from '../../app/cardTheme';
import {
  formatOverdueTime,
  formatRemainingTime,
} from '../../app/dateTimeUtils';

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

  useEffect(() => {
    if (completedAt || isStatic) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [completedAt, isStatic]);

  const remaining = new Date(targetAt).getTime() - now;
  const isPast = !completedAt && Number.isFinite(remaining) && remaining <= 0;
  // A passed deadline or reminder switches to the warm "alert" paper tone.
  const tone = isPast ? PALETTES.none : palette;

  const label = completedAt
    ? 'Выполнено'
    : isPast
      ? mode === 'deadline'
        ? `Просрочено · ${formatOverdueTime(-remaining)}`
        : `Пора · ${formatOverdueTime(-remaining)} назад`
      : formatRemainingTime(remaining);

  return (
    <div
      className="relative flex min-h-[42px] items-center rounded-[10px] border px-4 py-2.5"
      aria-label={
        completedAt
          ? 'Задача завершена'
          : isPast
            ? mode === 'deadline'
              ? 'Срок вышел'
              : 'Время напоминания наступило'
            : mode === 'deadline'
              ? 'Осталось для выполнения'
              : 'Осталось до напоминания'
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
