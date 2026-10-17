import React, { useId, useRef } from 'react';

import cardboardTexture from '../../assets/cardboard.svg';
import type { CardPalette } from '../../app/cardTheme';
import { formatCompletedDate } from '../../app/dateTimeUtils';
import { getSeriesProgress } from '../../app/seriesUtils';
import type { SeriesData } from '../../app/cardTheme';
import { slotPath, tearLinesPath } from '../../app/couponEdge';
import { useCouponTearProgress } from '../../app/couponTear';
import { CouponFace } from './CouponFace';
import { getCouponEdge } from './couponGeometry';
import { t } from '../../app/i18n';

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
  /** What this coupon's tear is drawn from (see getCouponSeed). */
  seed: string;
}

export const CompletionCoupon: React.FC<CompletionCouponProps> = ({
  completedAt,
  palette,
  onComplete,
  paperTint,
  actionLabel = t('Завершить'),
  series,
  progress,
  isReady = true,
  completedLabel,
  seed,
}) => {
  const edge = getCouponEdge(seed);
  const tearProgress = useCouponTearProgress(seed);
  const filterId = useId();
  // The hole the piece leaves (its other half), and a frame round it for the
  // inner shadows (frame minus slot, even-odd).
  const slotD = slotPath(edge, tearProgress);
  const wallFrame = `M-30 -30H${edge.spec.width + 30}V${edge.spec.height + 30}H-30Z`;
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
          card, in the shape of the torn piece (its other half: a notch where
          the piece kept a tooth, a tooth where the piece has a notch). Its
          floor is darker than the paper, it is walled by inner shadows (light
          from the top-left) with a lit lip along the bottom and right. It is
          filled with the card's accent exactly as far as the work got (5 of 10
          = half); the rest stays the card's own paper. */}
      {completedAt && (
        <div className="absolute inset-0" style={{ color: palette.accentDark }}>
          {/* The lip of the sheet catching the light just below the slot, and
              the paper's core showing along the torn necks. */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            viewBox={`0 0 ${edge.spec.width} ${edge.spec.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d={slotD}
              transform="translate(0.5 1)"
              fill="none"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <path
              d={tearLinesPath(edge, tearProgress)}
              fill="none"
              stroke="rgba(255,251,238,0.9)"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
          </svg>

          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            style={{ clipPath: `path('${slotD}')` }}
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

            {/* The fill is always there: a plain task is done in full, so its
                slot is filled with the accent right away. Only cards that count
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

            {/* Walls of the slot, above the fill so the depth survives it:
                the sheet's edge throws a shadow in from the top-left and the
                lower right wall is lit. */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              viewBox={`0 0 ${edge.spec.width} ${edge.spec.height}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <filter id={`${filterId}-dark`} x="-20%" y="-60%" width="140%" height="220%">
                  <feGaussianBlur stdDeviation="1.7" />
                </filter>
                <filter id={`${filterId}-lit`} x="-20%" y="-60%" width="140%" height="220%">
                  <feGaussianBlur stdDeviation="1.1" />
                </filter>
              </defs>
              <path
                d={`${wallFrame}${slotD}`}
                fillRule="evenodd"
                transform="translate(2.2 3)"
                fill="rgba(30,20,10,0.62)"
                filter={`url(#${filterId}-dark)`}
              />
              <path
                d={`${wallFrame}${slotD}`}
                fillRule="evenodd"
                transform="translate(-1.4 -1.8)"
                fill="rgba(255,255,255,0.55)"
                filter={`url(#${filterId}-lit)`}
              />
              <path
                d={slotD}
                fill="none"
                stroke="rgba(40,28,16,0.34)"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
            </svg>

            {/* Lettering on the slot: dark ink (it sits across both the accent
                fill and the paper), larger for a short counter than for the
                date. */}
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
                : completedLabel ?? t('Завершено · {v}', { v: formatCompletedDate(completedAt) })}
            </span>
          </div>
        </div>
      )}

      {!completedAt && (
        <button
          type="button"
          ref={couponRef}
          data-coupon="true"
          data-series-coupon={series ? 'true' : undefined}
          onClick={handleComplete}
          disabled={!isReady}
          className="coupon-press absolute inset-0 cursor-pointer border-0 bg-transparent p-0"
          style={{ borderRadius: '8px' }}
          aria-label={t('Завершить задачу')}
        >
          {/* On a press (or the mouse over it) the corner it would be torn
              from lifts a little and throws a shadow under itself. */}
          <span
            className="coupon-press__shade"
            data-corner={edge.startCorner}
            aria-hidden="true"
          />
          <span
            className="coupon-press__lift absolute inset-0"
            data-corner={edge.startCorner}
          >
            <CouponFace
              edge={edge}
              mode="sheet"
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
          </span>
        </button>
      )}
    </div>
  );
};
