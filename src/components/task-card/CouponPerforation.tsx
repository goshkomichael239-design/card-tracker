import React from 'react';

import {
  COUPON_CORE_THICKNESS,
  COUPON_DASH_GAP,
  COUPON_DASH_LENGTH,
  COUPON_RADIUS,
  COUPON_SHOULDER_OPACITY,
  COUPON_SHOULDER_THICKNESS,
  COUPON_STROKE_INSET,
} from '../../app/cardTheme';

/**
 * Dashed cut line running along the coupon's own edge. Shared by the coupon on
 * the card, the one that flies away and the buttons that reuse the coupon.
 */
export const CouponPerforation: React.FC = () => {
  const dashPattern = `${COUPON_DASH_LENGTH} ${COUPON_DASH_GAP}`;
  const geometry = {
    x: COUPON_STROKE_INSET,
    y: COUPON_STROKE_INSET,
    width: `calc(100% - ${COUPON_STROKE_INSET * 2}px)`,
    height: `calc(100% - ${COUPON_STROKE_INSET * 2}px)`,
    rx: COUPON_RADIUS,
  } as React.CSSProperties;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      <rect
        style={geometry}
        fill="none"
        stroke={`rgba(104,104,104,${COUPON_SHOULDER_OPACITY})`}
        strokeWidth={COUPON_SHOULDER_THICKNESS}
        strokeDasharray={dashPattern}
        strokeLinecap="butt"
      />
      <rect
        style={geometry}
        fill="none"
        stroke="rgba(30,24,18,0.72)"
        strokeWidth={COUPON_CORE_THICKNESS}
        strokeDasharray={dashPattern}
        strokeLinecap="butt"
      />
    </svg>
  );
};
