import React, { useRef } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import type { CardPalette } from '../../app/cardTheme';
import { formatCompletedDate } from '../../app/dateTimeUtils';
import { getSeriesProgress } from '../../app/seriesUtils';
import type { SeriesData } from '../../app/cardTheme';

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
  height,
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
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[8px] border"
        style={{
          color: 'rgba(255,255,255,0.94)',
          backgroundColor: palette.accent,
          backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.16), rgba(0,0,0,0.12)), url(${cardboardTexture})`,
          backgroundSize: '100% 100%, cover',
          backgroundBlendMode: 'soft-light, multiply',
          borderColor: palette.accentDark,
          boxShadow: `
            inset 3px 4px 9px rgba(0,0,0,0.48),
            inset -1px -1px 2px rgba(255,255,255,0.12),
            0 1px 0 rgba(255,255,255,0.08)
          `,
        }}
      >
        {completedAt && series && (
          <div
            className="pointer-events-none absolute inset-0 origin-right"
            style={{
              transform: `scaleX(${1 - getSeriesProgress(series)})`,
              backgroundColor: paperTint,
              opacity: 0.5,
            }}
            aria-hidden="true"
          />
        )}
        {completedAt && (
          <span className="px-3 text-center font-mono text-[9px] font-bold uppercase tracking-[0.13em]">
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
                  backgroundColor: palette.accent,
                  opacity: 0.24,
                  transition: 'transform 180ms ease-out',
                  willChange: 'transform',
                }}
              />
            </div>
          )}
          <div
            className="pointer-events-none absolute rounded-[6px] border border-dashed"
            style={{
              inset: Math.max(1, height * 0.1),
              borderColor: 'rgba(70,59,46,0.44)',
            }}
          />
          <span
            className="absolute inset-0 flex select-none items-center justify-center font-mono text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: palette.accent }}
          >
            {actionLabel}
          </span>
        </button>
      )}
    </div>
  );
};
