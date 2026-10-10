import React, { useRef } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import {
  COUPON_CORE_THICKNESS,
  COUPON_DASH_GAP,
  COUPON_DASH_LENGTH,
  COUPON_RADIUS,
  COUPON_SHOULDER_OPACITY,
  COUPON_SHOULDER_THICKNESS,
  COUPON_STROKE_INSET,
  type CardPalette,
} from '../../app/cardTheme';
import { formatCompletedDate } from '../../app/dateTimeUtils';
import { getSeriesProgress } from '../../app/seriesUtils';
import type { SeriesData } from '../../app/cardTheme';

/**
 * Dashed cut line running along the coupon's own edge. It uses the same dash
 * pattern and strokes as DetachedCompletionCoupon so the coupon looks identical
 * before and after it tears off.
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

interface CompletionCouponProps {
  completedAt?: string;
  palette: CardPalette;
  onComplete: (couponBounds: DOMRect) => void;
  height: number;
  paperTint: string;
  actionLabel?: string;
  series?: SeriesData;
  progress?: number;
  isReady?: boolean;
  completedLabel?: string;
}

export const CompletionCoupon: React.FC<CompletionCouponProps> = ({
  completedAt,
  palette,
  onComplete,
  paperTint,
  actionLabel = 'Завершить',
  series,
  progress,
  isReady = true,
  completedLabel,
}) => {
  const couponRef = useRef<HTMLButtonElement | null>(null);

  const handleComplete = () => {
    const couponBounds = couponRef.current?.getBoundingClientRect();

    if (couponBounds) {
      onComplete(couponBounds);
    }
  };

  return (
    <div className="relative h-full w-full shrink-0">
      {/* The slot left behind when the coupon tears off. It is filled with the
          card's accent exactly as far as the work got (5 of 10 = half), and
          the rest stays the card's own paper. */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[8px] border"
        style={{
          color: palette.accentDark,
          backgroundColor: paperTint,
          backgroundImage: `url(${cardboardTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'multiply',
          borderColor: 'rgba(70,59,46,0.3)',
          boxShadow: `
            inset 3px 4px 9px rgba(40,28,16,0.34),
            inset -1px -1px 2px rgba(255,255,255,0.5),
            0 1px 0 rgba(255,255,255,0.5)
          `,
        }}
      >
        {completedAt && (
          <div
            className="pointer-events-none absolute bottom-0 left-0 top-0"
            style={{
              width: `${(series ? getSeriesProgress(series) : 1) * 100}%`,
              backgroundColor: palette.glow,
              // Crisp light edge where the done share ends.
              boxShadow: 'inset -2px 0 0 rgba(255,255,255,0.6)',
            }}
            aria-hidden="true"
          />
        )}
        {completedAt && (
          <span className="relative px-3 text-center font-mono text-[9px] font-bold uppercase tracking-[0.13em]">
            {series
              ? `${series.entries.length} / ${series.targetCount}`
              : completedLabel ?? `Завершено · ${formatCompletedDate(completedAt)}`}
          </span>
        )}
      </div>

      {!completedAt && (
        <button
          type="button"
          ref={couponRef}
          data-series-coupon={series ? 'true' : undefined}
          onClick={handleComplete}
          disabled={!isReady}
          className="absolute inset-0 cursor-pointer border-0 bg-transparent p-0"
          style={{ borderRadius: '8px' }}
          aria-label="Завершить задачу"
        >
          <div
            className="absolute inset-0 overflow-hidden rounded-[8px]"
            style={{
              backgroundColor: paperTint,
              backgroundImage: `url(${cardboardTexture})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundBlendMode: 'multiply',
              boxShadow: 'inset 0 1px rgba(255,255,255,0.78)',
            }}
          />
          {(series || progress !== undefined) && (
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-[8px]"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 origin-left"
                style={{
                  transform: `scaleX(${progress ?? getSeriesProgress(series!)})`,
                  backgroundColor: palette.glow,
                  opacity: 0.7,
                  transition: 'transform 180ms ease-out',
                  willChange: 'transform',
                }}
              />
            </div>
          )}
          <CouponPerforation />
          <span
            className="absolute inset-0 flex select-none items-center justify-center font-mono text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: palette.accentDark }}
          >
            {actionLabel}
          </span>
        </button>
      )}
    </div>
  );
};
