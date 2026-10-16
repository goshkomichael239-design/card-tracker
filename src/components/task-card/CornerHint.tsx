import React from 'react';

import type { CardPalette } from '../../app/cardTheme';
import { t } from '../../app/i18n';

interface CornerHintProps {
  palette: CardPalette;
  /** Closes the hint for good (it also closes by itself on first corner use). */
  onDismiss: () => void;
}

/**
 * First-run note. It sits in the otherwise empty strip of the header row,
 * between the kind badge and the folded corner, and points straight at the
 * corner with a short dashed arrow, so it never lies over the card's content.
 * Only the cross is clickable; everything else lets pointer events through.
 */
export const CornerHint: React.FC<CornerHintProps> = ({
  palette,
  onDismiss,
}) => (
  <div
    className="pointer-events-none absolute z-20 flex items-center gap-1"
    // Vertically centred on the badge row; ends just left of the folded corner.
    style={{ top: 28, right: 46, height: 30 }}
    role="note"
  >
    <button
      type="button"
      onClick={onDismiss}
      onTouchStart={() => undefined}
      aria-label={t('Закрыть подсказку')}
      className="pointer-events-auto flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full border-0 font-mono text-[12px] leading-none"
      style={{
        color: palette.accentDark,
        backgroundColor: `${palette.accent}22`,
      }}
    >
      ✕
    </button>

    <span
      className="whitespace-nowrap text-[12.5px] font-semibold tracking-[0.01em]"
      style={{ color: palette.accentDark }}
    >{t('Править / удалить')}</span>

    <svg
      className="shrink-0"
      width="26"
      height="24"
      viewBox="0 0 30 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="corner-hint-dash"
        d="M 2 19 C 10 20, 18 14, 25 5"
        stroke={palette.accentDark}
        strokeOpacity="0.8"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <path
        d="M 18.5 5.5 L 26 3 L 25.5 11"
        stroke={palette.accentDark}
        strokeOpacity="0.9"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);
