import React from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { CouponPerforation } from './CouponPerforation';

interface CouponFaceProps {
  /** Paper colour of the card the coupon belongs to. */
  paper: string;
  /** The card's second accent, used for the progress fill. */
  glow: string;
  /** 0..1; omit for a coupon that has no progress (a plain task). */
  progress?: number;
  label: string;
  /** Smooth the fill when `progress` changes (only the on-card coupon needs it). */
  animateProgress?: boolean;
}

const COUNTER_PATTERN = /^\d+\s*\/\s*\d+$/;

/**
 * Everything printed on a completion coupon: cardboard, the done share, the
 * perforation and the pressed-in lettering. The coupon on the card and the one
 * that tears off both render exactly this, so they cannot drift apart.
 * The parent supplies the box (absolute, rounded, overflow hidden).
 */
export const CouponFace: React.FC<CouponFaceProps> = ({
  paper,
  glow,
  progress,
  label,
  animateProgress = false,
}) => (
  <>
    <div
      className="absolute inset-0 overflow-hidden rounded-[8px]"
      style={{
        backgroundColor: paper,
        backgroundImage: `url(${cardboardTexture})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'multiply',
        boxShadow: 'inset 0 1px rgba(255,255,255,0.78)',
      }}
    />

    {progress !== undefined && (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[8px]"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 origin-left"
          style={{
            transform: `scaleX(${Math.min(1, Math.max(0, progress))})`,
            backgroundColor: glow,
            opacity: 0.7,
            transition: animateProgress ? 'transform 180ms ease-out' : undefined,
            willChange: animateProgress ? 'transform' : undefined,
          }}
        />
      </div>
    )}

    <CouponPerforation />

    {/* Lettering pressed into the cardboard: muted ink, light edge below the
        glyph, dark edge above it. */}
    <span
      className="coupon-label absolute inset-0 flex select-none items-center justify-center px-3"
      style={{ fontSize: COUNTER_PATTERN.test(label) ? 18 : 16 }}
    >
      {label}
    </span>
  </>
);
