import React from 'react';

import type { Postponement } from '../../app/cardTheme';
import { STAMP_RED_DARK } from '../../app/stampRed';
import { formatStampDay } from '../../app/timeOps';

interface PostponeStampsProps {
  postponements: Postponement[];
}

/**
 * The ink stamp "ОТЛОЖЕНО до …" pressed onto the card: only the last one (the
 * ones under it were unreadable), with how many times the card has been put
 * off as "×N" in its corner. Older ones stay in the card's history.
 */
export const PostponeStamps: React.FC<PostponeStampsProps> = ({
  postponements,
}) => {
  const latest = postponements.at(-1);

  if (!latest) {
    return null;
  }

  const count = postponements.length;

  return (
    <div
      className="pointer-events-none absolute right-0"
      style={{ bottom: 92, width: 150, height: 70 }}
      aria-label={`Отложено ${count} раз`}
    >
      <div
        className="absolute bottom-0 right-0 flex flex-col items-center justify-center rounded-[6px] px-3 py-1.5"
        style={{
          transform: 'rotate(-6deg)',
          border: '2px solid currentColor',
          outline: '1px solid currentColor',
          outlineOffset: -5,
          color: STAMP_RED_DARK,
          opacity: 0.66,
          mixBlendMode: 'multiply',
          textShadow: 'none',
        }}
      >
        <span className="font-mono text-[12px] font-bold uppercase leading-none tracking-[0.2em]">
          Отложено
        </span>
        <span className="mt-1 font-mono text-[11px] font-bold uppercase leading-none tracking-[0.08em]">
          до {formatStampDay(latest.until)}
        </span>
        {count > 1 && (
          <span
            className="absolute -right-2 -top-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 font-mono text-[10.5px] font-bold leading-none"
            style={{
              color: STAMP_RED_DARK,
              border: '1.5px solid currentColor',
              background: 'rgba(255,250,240,0.7)',
            }}
          >
            ×{count}
          </span>
        )}
      </div>
    </div>
  );
};
