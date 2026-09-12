import React, { useEffect, useState } from 'react';
import type { CardPalette, TimeMode } from '../../app/cardTheme';
import { formatRemainingTime } from '../../app/dateTimeUtils';

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
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (completedAt || isStatic) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [completedAt, isStatic]);

  const remaining = new Date(targetAt).getTime() - now;

  return (
    <div
      className="relative flex min-h-[42px] items-center rounded-[10px] border px-4 py-2.5"
      aria-label={
        completedAt
          ? 'Задача завершена'
          : mode === 'deadline'
            ? 'Осталось для выполнения'
            : 'Осталось до напоминания'
      }
      style={{
        color: palette.accentDark,
        backgroundColor: `${palette.accent}16`,
        borderColor: `${palette.accent}38`,
        boxShadow: 'inset 0 1px rgba(255,255,255,0.7)',
      }}
    >
      <div className="font-mono text-[15px] font-semibold tracking-[-0.02em]">
        {completedAt ? 'Выполнено' : formatRemainingTime(remaining)}
      </div>
    </div>
  );
};
