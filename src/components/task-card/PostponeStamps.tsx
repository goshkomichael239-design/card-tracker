import React from 'react';

import type { Postponement } from '../../app/cardTheme';
import { formatStampDay } from '../../app/timeOps';

interface PostponeStampsProps {
  postponements: Postponement[];
}

const MAX_STAMPS = 3;
// Each new stamp lands a little off from the previous one, like a real one.
const PLACEMENTS = [
  { rotate: -8, x: 0, y: 0 },
  { rotate: 5, x: -16, y: -12 },
  { rotate: -3, x: 10, y: -24 },
];

/**
 * Ink stamps "ОТЛОЖЕНО до …" pressed onto the card, the most recent on top.
 * Up to three are drawn; older ones are summed up in a small "×N" mark.
 */
export const PostponeStamps: React.FC<PostponeStampsProps> = ({
  postponements,
}) => {
  if (postponements.length === 0) {
    return null;
  }

  const shown = postponements.slice(-MAX_STAMPS);
  const hidden = postponements.length - shown.length;

  return (
    <div
      className="pointer-events-none absolute right-0"
      style={{ bottom: 92, width: 150, height: 70 }}
      aria-label={`Отложено ${postponements.length} раз`}
    >
      {shown.map((stamp, index) => {
        const placement = PLACEMENTS[index]!;
        const isLatest = index === shown.length - 1;

        return (
          <div
            key={`${stamp.at}-${index}`}
            className="absolute bottom-0 right-0 flex flex-col items-center justify-center rounded-[6px] px-3 py-1.5"
            style={{
              transform: `translate(${placement.x}px, ${placement.y}px) rotate(${placement.rotate}deg)`,
              border: '2px solid currentColor',
              outline: '1px solid currentColor',
              outlineOffset: -5,
              color: '#8F3025',
              opacity: isLatest ? 0.62 : 0.3,
              mixBlendMode: 'multiply',
              textShadow: 'none',
            }}
          >
            <span className="font-mono text-[12px] font-bold uppercase leading-none tracking-[0.2em]">
              Отложено
            </span>
            <span className="mt-1 font-mono text-[11px] font-bold uppercase leading-none tracking-[0.08em]">
              до {formatStampDay(stamp.until)}
            </span>
          </div>
        );
      })}
      {hidden > 0 && (
        <span
          className="absolute -top-3 right-1 font-mono text-[11px] font-bold"
          style={{ color: '#8F3025', opacity: 0.55 }}
        >
          ×{postponements.length}
        </span>
      )}
    </div>
  );
};
