import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import cardboardTexture from '../../assets/cardboard.avif';
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
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-10 flex min-h-[76px] items-center justify-center overflow-hidden rounded-[16px] px-4 py-4 text-center"
      aria-label={
        completedAt
          ? 'Задача завершена'
          : mode === 'deadline'
            ? 'Осталось для выполнения'
            : 'Осталось до напоминания'
      }
      style={{
        color: 'rgba(255,255,255,0.94)',
        backgroundColor: palette.accent,
        backgroundImage:
          'radial-gradient(circle at 20% 10%, rgba(255,255,255,0.12) 0%, transparent 48%), linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.09) 100%), url(' +
          cardboardTexture +
          ')',
        backgroundSize: '100% 100%, 100% 100%, cover',
        backgroundBlendMode: 'soft-light, soft-light, multiply',
        border: '1px solid rgba(42,34,27,0.2)',
        boxShadow:
          'inset 2px 3px 7px rgba(0,0,0,0.3), inset -1px -1px 2px rgba(255,255,255,0.16), 0 3px 0 rgba(54,43,34,0.24), 0 6px 10px rgba(0,0,0,0.16)',
      }}
    >
      <div className="font-mono text-[17px] font-semibold tracking-[-0.02em]">
        {completedAt ? 'Выполнено' : formatRemainingTime(remaining)}
      </div>
    </motion.div>
  );
};
