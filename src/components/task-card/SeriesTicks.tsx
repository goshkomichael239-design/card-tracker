import React from 'react';

import type { CardPalette } from '../../app/cardTheme';

interface SeriesTicksProps {
  done: number;
  target: number;
  palette: CardPalette;
}

/** Past this many steps the ticks would be crumbs: a thin bar says the same. */
const MAX_TICKS = 40;

/**
 * The progress of a series as a row of punched holes, like the perforation of
 * the coupon below: the done ones are filled, the rest are empty rings.
 */
export const SeriesTicks: React.FC<SeriesTicksProps> = ({
  done,
  target,
  palette,
}) => {
  const safeTarget = Math.max(1, target);

  if (safeTarget > MAX_TICKS) {
    const share = Math.min(1, done / safeTarget);

    return (
      <div
        aria-hidden="true"
        className="h-[7px] w-full overflow-hidden rounded-full"
        style={{
          boxShadow: 'inset 0 0 0 1.5px rgba(69,57,44,0.24)',
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${share * 100}%`,
            backgroundColor: palette.accentDark,
            opacity: 0.85,
          }}
        />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="flex w-full items-center gap-[5px]">
      {Array.from({ length: safeTarget }, (_, index) => {
        const isDone = index < done;

        return (
          <span
            key={index}
            className="block min-w-0 flex-1 rounded-full"
            style={{
              maxWidth: 16,
              height: 9,
              backgroundColor: isDone ? palette.accentDark : 'transparent',
              opacity: isDone ? 0.88 : 1,
              boxShadow: isDone
                ? 'inset 0 1px 1px rgba(0,0,0,0.28), 0 1px 0 rgba(255,255,255,0.65)'
                : 'inset 0 1.5px 2px rgba(69,57,44,0.34), 0 1px 0 rgba(255,255,255,0.7)',
            }}
          />
        );
      })}
    </div>
  );
};
