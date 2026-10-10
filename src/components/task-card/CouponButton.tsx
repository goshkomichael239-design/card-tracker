import React from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { CouponPerforation } from './CouponPerforation';

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
 * A cardboard pad with a perforated edge: the same object as the completion
 * coupon, reused for the card's other primary actions.
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
    className="relative block w-full cursor-pointer overflow-hidden rounded-[8px] border-0 p-0 disabled:cursor-default disabled:opacity-45"
    style={{
      height,
      backgroundColor: paperTint,
      backgroundImage: `url(${cardboardTexture})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundBlendMode: 'multiply',
      boxShadow:
        'inset 0 1px rgba(255,255,255,0.78), 0 1px 0 rgba(20,17,14,0.12)',
    }}
  >
    <span
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundColor: color,
        opacity: filled ? 0.22 : 0,
        transition: 'opacity 160ms ease-out',
      }}
      aria-hidden="true"
    />
    <CouponPerforation />
    <span
      className="absolute inset-0 flex select-none items-center justify-center px-3 text-center font-mono font-bold uppercase tracking-[0.16em]"
      style={{ color, fontSize }}
    >
      {label}
    </span>
  </button>
);
