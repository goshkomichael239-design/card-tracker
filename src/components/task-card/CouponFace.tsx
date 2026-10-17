import React from 'react';

import cardboardTexture from '../../assets/cardboard.svg';
import type { CouponEdge } from '../../app/couponEdge';
import { PerforationHoles } from './CouponPerforation';

interface CouponFaceProps {
  /** The coupon's perforation (its size and where it is torn). */
  edge: CouponEdge;
  /**
   * `sheet`: still part of the card, with no ground of its own, only the holes
   * round it. `piece`: torn off; it brings its own paper and the parent clips it
   * to the torn rim.
   */
  mode: 'sheet' | 'piece';
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
 * Everything printed on a completion coupon: the share done, the holes (while
 * it is still part of the sheet) and the pressed-in lettering. The coupon on
 * the card and the piece that tears off both render exactly this, so they
 * cannot drift apart. The parent supplies the box (absolute, inset 0).
 */
export const CouponFace: React.FC<CouponFaceProps> = ({
  edge,
  mode,
  paper,
  glow,
  progress,
  label,
  animateProgress = false,
}) => {
  const { inset } = edge;
  const radius = edge.contour.r;

  return (
    <>
      {mode === 'piece' && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: paper,
            backgroundImage: `url(${cardboardTexture})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'multiply',
          }}
        />
      )}

      {progress !== undefined && (
        <div
          className="pointer-events-none absolute overflow-hidden"
          style={{ inset, borderRadius: radius }}
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 origin-left"
            style={{
              transform: `scaleX(${Math.min(1, Math.max(0, progress))})`,
              backgroundColor: glow,
              opacity: 0.7,
              transition: animateProgress ? 'transform 240ms ease-out' : undefined,
              willChange: animateProgress ? 'transform' : undefined,
            }}
          />
        </div>
      )}

      {mode === 'sheet' && <PerforationHoles edge={edge} />}

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
};
