import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

import {
  buildCouponEdge,
  holesPath,
  type CouponEdge,
} from '../../app/couponEdge';

// What the holes look like: the floor seen through them is dark, the wall on
// the top-left throws a shadow into them, the paper's lip catches the light on
// the bottom-right (light comes from the top-left, as everywhere else).
const FLOOR = '#33261b';
const FLOOR_LIT = '#6d5a45';
const RIM = 'rgba(255,255,255,0.9)';
const WALL = 'rgba(30,20,10,0.42)';

interface PerforationHolesProps {
  edge: CouponEdge;
  className?: string;
}

/**
 * The perforation of a coupon that is still part of its sheet: a row of round
 * holes on the contour. Three paths for all of them (no node per hole).
 */
export const PerforationHoles: React.FC<PerforationHolesProps> = ({
  edge,
  className = 'pointer-events-none absolute inset-0 h-full w-full overflow-visible',
}) => {
  const clipId = useId();
  const paths = useMemo(
    () => ({
      holes: holesPath(edge),
      lit: holesPath(edge, 0.55, 0.65),
      rim: holesPath(edge, 0.35, 0.5),
      wall: holesPath(edge, -0.25, -0.3, 0.25),
    }),
    [edge],
  );

  return (
    <svg
      className={className}
      viewBox={`0 0 ${edge.spec.width} ${edge.spec.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={paths.holes} />
        </clipPath>
      </defs>
      {/* the lit lip on the lower right, outside the hole */}
      <path d={paths.rim} fill="none" stroke={RIM} strokeWidth="0.8" />
      {/* the dark wall's edge on the upper left */}
      <path d={paths.wall} fill={WALL} />
      <path d={paths.holes} fill={FLOOR} />
      {/* the floor lit on its lower right: leaves a crescent of shadow */}
      <g clipPath={`url(#${clipId})`}>
        <path d={paths.lit} fill={FLOOR_LIT} />
      </g>
    </svg>
  );
};

interface MeasuredPerforationProps {
  seed: string;
  hole: number;
  pitch: number;
  radius: number;
}

/**
 * The holes round a box whose size is only known once it is laid out (the
 * swipe coupon is a share of the card's width). It draws nothing while the box
 * has no size (it is hidden).
 */
export const MeasuredPerforation: React.FC<MeasuredPerforationProps> = ({
  seed,
  hole,
  pitch,
  radius,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    const element = ref.current;

    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.contentRect;

      setSize(
        box && box.width > 0 && box.height > 0
          ? { width: Math.round(box.width), height: Math.round(box.height) }
          : null,
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const edge = size
    ? buildCouponEdge({
        width: size.width,
        height: size.height,
        radius,
        hole,
        pitch,
        seed,
      })
    : null;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    >
      {edge && <PerforationHoles edge={edge} />}
    </div>
  );
};
