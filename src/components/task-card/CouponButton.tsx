import React from 'react';

import cardboardTexture from '../../assets/cardboard.avif';

interface CouponButtonProps {
  label: string;
  onClick: () => void;
  /** Ink colour of the lettering. */
  color: string;
  paperTint: string;
  disabled?: boolean;
  /** Fills the pad with a wash of the ink colour, for a confirmed state. */
  filled?: boolean;
  height?: number;
  fontSize?: number;
  ariaLabel?: string;
}

/**
 * A card's primary action as a pressed-in pad of the card's own paper: a
 * shallow rounded recess with the lettering embossed in it, in the family of
 * the card's other actions. It is a plain button; the perforation belongs only
 * to things that tear off.
 */
export const CouponButton: React.FC<CouponButtonProps> = ({
  label,
  onClick,
  color,
  paperTint,
  disabled = false,
  filled = false,
  height = 49,
  fontSize = 11,
  ariaLabel,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel ?? label}
    className="pad-button relative block w-full cursor-pointer overflow-hidden border-0 p-0 disabled:cursor-default disabled:opacity-45"
    style={{
      height,
      backgroundColor: paperTint,
      backgroundImage: `url(${cardboardTexture})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundBlendMode: 'multiply',
    }}
  >
    <span
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundColor: color,
        opacity: filled ? 0.22 : 0,
        transition: 'opacity 240ms ease-out',
      }}
      aria-hidden="true"
    />
    <span
      className="pad-button__label absolute inset-0 flex select-none items-center justify-center px-3 text-center font-mono font-bold uppercase tracking-[0.16em]"
      style={{ color, fontSize }}
    >
      {label}
    </span>
  </button>
);
