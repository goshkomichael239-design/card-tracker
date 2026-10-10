import React, { useRef } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import type { CardPalette } from '../../app/cardTheme';
import { formatCompletedDate } from '../../app/dateTimeUtils';
import { getSeriesProgress } from '../../app/seriesUtils';
import type { SeriesData } from '../../app/cardTheme';
import { CouponFace } from './CouponFace';
import { CouponPerforation } from './CouponPerforation';

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
      {/* The slot left behind when the coupon tears off: a lower layer of the
          card. Its floor is darker than the paper, it is walled by deep inner
          shadows (light from the top-left) with a lit lip along the bottom and
          right, and what remains of the perforation shows at its edge. It is
          filled with the card's accent exactly as far as the work got (5 of 10
          = half); the rest stays the card's own paper. */}
      {completedAt && (
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[8px]"
          style={{
            color: palette.accentDark,
            // The lip of the upper sheet catching the light, just below the slot.
            boxShadow: '0 1px 0 rgba(255,255,255,0.7)',
          }}
        >
          {/* Floor of the slot: the paper, but noticeably deeper in tone. */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: paperTint,
              backgroundImage: `linear-gradient(180deg, rgba(48,34,20,0.24), rgba(48,34,20,0.12)), url(${cardboardTexture})`,
              backgroundSize: '100% 100%, cover',
              backgroundPosition: 'center',
              backgroundBlendMode: 'normal, multiply',
            }}
            aria-hidden="true"
          />

          {/* The fill is always there: a plain task is done in full, so its slot
              is filled with the accent right away. Only cards that count
              something (series, lists) pour their share in from the left; a
              plain task just appears in its final state with no animation. */}
          <div
            className={`pointer-events-none absolute bottom-0 left-0 top-0${
              series || completedLabel !== undefined ? ' slot-fill' : ''
            }`}
            style={{
              width: `${(series ? getSeriesProgress(series) : 1) * 100}%`,
              backgroundColor: palette.glow,
              // The wall of the slot throws its shadow onto the fill too.
              backgroundImage:
                'linear-gradient(180deg, rgba(40,28,16,0.2), rgba(40,28,16,0) 60%)',
              // Crisp light edge where the done share ends.
              boxShadow: 'inset -2px 0 0 rgba(255,255,255,0.6)',
            }}
            aria-hidden="true"
          />

          {/* Walls of the slot, above the fill so the depth survives it. */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[8px]"
            style={{
              boxShadow: `
                inset 5px 7px 12px -2px rgba(30,20,10,0.62),
                inset -3px -4px 8px -3px rgba(255,255,255,0.55),
                inset 0 0 0 1px rgba(40,28,16,0.3)
              `,
            }}
            aria-hidden="true"
          />

          {/* Remains of the perforation along the torn edge. */}
          <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
            <CouponPerforation />
          </div>

          {/* Lettering on the slot: dark ink (it sits across both the accent fill
              and the paper), larger for a short counter than for the date. */}
          <span
            className="relative px-3 text-center font-mono font-bold uppercase"
            style={{
              color: palette.ink,
              fontSize: series || completedLabel !== undefined ? 20 : 12.5,
              letterSpacing:
                series || completedLabel !== undefined ? '0.08em' : '0.1em',
              lineHeight: 1.1,
              fontVariantNumeric: 'lining-nums tabular-nums',
            }}
          >
            {series
              ? `${series.entries.length} / ${series.targetCount}`
              : completedLabel ?? `Завершено · ${formatCompletedDate(completedAt)}`}
          </span>
        </div>
      )}

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
          {/* The same face the coupon wears while flying away. */}
          <CouponFace
            paper={paperTint}
            glow={palette.glow}
            progress={
              series || progress !== undefined
                ? (progress ?? getSeriesProgress(series!))
                : undefined
            }
            label={actionLabel}
            animateProgress
          />
        </button>
      )}
    </div>
  );
};
