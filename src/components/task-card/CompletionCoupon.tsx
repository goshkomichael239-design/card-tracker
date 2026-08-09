import React, { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
  type CardPalette,
} from '../../app/cardTheme';
import { formatCompletedDate } from '../../app/dateTimeUtils';

interface CompletionCouponProps {
  completedAt?: string;
  palette: CardPalette;
  onComplete: (couponBounds: DOMRect) => void;
}

export const CompletionCoupon: React.FC<CompletionCouponProps> = ({
  completedAt,
  palette,
  onComplete,
}) => {
  const dashPattern = `${COUPON_DASH_LENGTH} ${COUPON_DASH_GAP}`;
  const rectWidth = COUPON_WIDTH - COUPON_STROKE_INSET * 2;
  const rectHeight = COUPON_HEIGHT - COUPON_STROKE_INSET * 2;
  const rectRadius = Math.max(1, COUPON_RADIUS - COUPON_STROKE_INSET / 2);
  const couponRef = useRef<HTMLButtonElement | null>(null);

  const handleComplete = () => {
    const couponBounds = couponRef.current?.getBoundingClientRect();

    if (couponBounds) {
      onComplete(couponBounds);
    }
  };

  return (
    <div
      className="relative z-10 mb-6 h-[38px] w-full shrink-0"
      style={{ perspective: '900px' }}
    >
      <motion.div
        animate={{
          backgroundColor: completedAt
            ? palette.accent
            : 'rgba(32,28,25,0.14)',
          boxShadow: completedAt
            ? `
                inset 3px 4px 9px rgba(0,0,0,0.48),
                inset -1px -1px 2px rgba(255,255,255,0.12),
                0 1px 0 rgba(255,255,255,0.08)
              `
            : 'none',
        }}
        transition={{ duration: 0.24 }}
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{
          borderRadius: `${COUPON_RADIUS}px`,
          backgroundImage: `
            linear-gradient(
              180deg,
              rgba(255,255,255,0.06) 0%,
              rgba(0,0,0,0.12) 100%
            ),
            url(${cardboardTexture})
          `,
          backgroundPosition: 'center, center',
          backgroundSize: '100% 100%, cover',
          backgroundBlendMode: 'soft-light, multiply',
        }}
      >
        <AnimatePresence>
          {completedAt && (
            <motion.span
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.16, duration: 0.24 }}
              className="px-3 text-center font-mono text-[8px] font-semibold uppercase tracking-[0.08em]"
              style={{
                color: 'rgba(255,255,255,0.94)',
                textShadow: '0 1px 1px rgba(0,0,0,0.28)',
              }}
            >
              Выполнено · {formatCompletedDate(completedAt)}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {!completedAt && (
          <button
            type="button"
            ref={couponRef}
            onClick={handleComplete}
            className="absolute inset-0 cursor-pointer border-0 bg-transparent p-0"
            style={{
              transformOrigin: 'center bottom',
              borderRadius: `${COUPON_RADIUS}px`,
              boxShadow: 'none',
            }}
            aria-label="Завершить задачу"
          >
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                borderRadius: `${COUPON_RADIUS}px`,
                backgroundColor: palette.paper,
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
              Завершить
            </span>
          </button>
        )}
      </AnimatePresence>
    </div>
  );
};
