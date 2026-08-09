import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

import cardboardTexture from '../../assets/cardboard.avif';
import {
  COUPON_CORE_THICKNESS,
  COUPON_DASH_GAP,
  COUPON_DASH_LENGTH,
  COUPON_HEIGHT,
  COUPON_RADIUS,
  COUPON_SHOULDER_OPACITY,
  COUPON_SHOULDER_THICKNESS,
  COUPON_STROKE_INSET,
  COUPON_WIDTH,
  type DetachedCoupon,
} from '../../app/cardTheme';

interface DetachedCompletionCouponProps {
  coupon: DetachedCoupon;
  onFlightComplete: () => void;
}

export const DetachedCompletionCoupon: React.FC<
  DetachedCompletionCouponProps
> = ({ coupon, onFlightComplete }) => {
  const dashPattern = `${COUPON_DASH_LENGTH} ${COUPON_DASH_GAP}`;
  const rectWidth = COUPON_WIDTH - COUPON_STROKE_INSET * 2;
  const rectHeight = COUPON_HEIGHT - COUPON_STROKE_INSET * 2;
  const rectRadius = Math.max(1, COUPON_RADIUS - COUPON_STROKE_INSET / 2);
  const flight = useMemo(() => {
    const driftDirection = Math.random() < 0.5 ? -1 : 1;
    const rotationDirection = Math.random() < 0.5 ? -1 : 1;

    return {
      originX: 25 + Math.random() * 50,
      originY: 25 + Math.random() * 50,
      driftX: driftDirection * (18 + Math.random() * 27),
      finalRotation: rotationDirection * (35 + Math.random() * 50),
      duration: 1.15 + Math.random() * 0.2,
    };
  }, [coupon.id]);
  const fallDistance =
    window.innerHeight - coupon.top + coupon.height + 80;

  return (
    <motion.div
      initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
      animate={{
        x: flight.driftX,
        y: fallDistance,
        rotate: flight.finalRotation,
        opacity: 1,
      }}
      transition={{
        x: {
          duration: flight.duration,
          ease: 'linear',
        },
        y: {
          duration: flight.duration,
          ease: [0.4, 0, 1, 1],
        },
        rotate: {
          duration: flight.duration,
          ease: 'linear',
        },
      }}
      onAnimationComplete={onFlightComplete}
      className="pointer-events-none fixed"
      style={{
        zIndex: 100,
        left: coupon.left,
        top: coupon.top,
        width: coupon.width,
        height: coupon.height,
        transformOrigin: `${flight.originX}% ${flight.originY}%`,
        filter:
          'drop-shadow(0 18px 14px rgba(0,0,0,0.62)) drop-shadow(0 6px 5px rgba(0,0,0,0.46))',
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: `${COUPON_RADIUS}px`,
          backgroundColor: coupon.palette.paper,
          backgroundImage: `
            linear-gradient(
              180deg,
              rgba(255,255,255,0.08) 0%,
              rgba(255,255,255,0.01) 48%,
              rgba(0,0,0,0.018) 100%
            ),
            url(${cardboardTexture})
          `,
          backgroundPosition: 'center, center',
          backgroundSize: '100% 100%, cover',
          backgroundBlendMode: 'soft-light, multiply',
          boxShadow: 'none',
        }}
      />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${COUPON_WIDTH} ${COUPON_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        shapeRendering="geometricPrecision"
      >
        <rect
          x={COUPON_STROKE_INSET}
          y={COUPON_STROKE_INSET}
          width={rectWidth}
          height={rectHeight}
          rx={rectRadius}
          fill="none"
          stroke={`rgba(104,104,104,${COUPON_SHOULDER_OPACITY})`}
          strokeWidth={COUPON_SHOULDER_THICKNESS}
          strokeDasharray={dashPattern}
          strokeLinecap="butt"
          vectorEffect="non-scaling-stroke"
        />

        <rect
          x={COUPON_STROKE_INSET}
          y={COUPON_STROKE_INSET}
          width={rectWidth}
          height={rectHeight}
          rx={rectRadius}
          fill="none"
          stroke="rgba(8,8,8,0.94)"
          strokeWidth={COUPON_CORE_THICKNESS}
          strokeDasharray={dashPattern}
          strokeLinecap="butt"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <span
        className="absolute inset-0 flex select-none items-center justify-center pt-[1px] font-mono text-[9px] font-semibold uppercase tracking-[0.18em]"
        style={{
          color: 'rgba(36,30,26,0.55)',
          textShadow: `
            -1px -1px 1px rgba(0,0,0,0.2),
            1px 1px 1px rgba(255,255,255,0.48)
          `,
        }}
      >
        {'\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044c'}
      </span>
    </motion.div>
  );
};
