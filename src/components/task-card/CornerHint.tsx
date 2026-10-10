import React from 'react';

import type { CardPalette } from '../../app/cardTheme';
import { INITIAL_TASK_CARD_V2_CONFIG } from './taskCardV2Config';

interface CornerHintProps {
  palette: CardPalette;
}

/**
 * First-run note: a dashed arrow running up the right edge of the card to the
 * folded corner, with a short instruction. It is purely decorative and never
 * intercepts clicks; it disappears for good after the corner is first used.
 */
export const CornerHint: React.FC<CornerHintProps> = ({ palette }) => {
  const { width, height } = INITIAL_TASK_CARD_V2_CONFIG;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
      >
        <path
          className="corner-hint-dash"
          d="M 352 316 C 386 288, 380 150, 359 70"
          stroke={palette.accentDark}
          strokeOpacity="0.78"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeDasharray="5 5"
        />
        <path
          d="M 368.5 79 L 359 66 L 351.5 81"
          stroke={palette.accentDark}
          strokeOpacity="0.85"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <p
        className="absolute text-right font-mono text-[11px] font-semibold leading-[1.35] tracking-[0.02em]"
        style={{
          right: width - 342,
          top: 296,
          width: 190,
          color: palette.accentDark,
        }}
      >
        Править или удалить —
        <br />
        нажмите на уголок
      </p>
    </div>
  );
};
