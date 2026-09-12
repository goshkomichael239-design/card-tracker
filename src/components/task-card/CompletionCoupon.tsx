import React, { useRef } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import type { CardPalette } from '../../app/cardTheme';
import { formatCompletedDate } from '../../app/dateTimeUtils';

interface CompletionCouponProps {
  completedAt?: string;
  palette: CardPalette;
  onComplete: (couponBounds: DOMRect) => void;
  height: number;
  paperTint: string;
}

export const CompletionCoupon: React.FC<CompletionCouponProps> = ({
  completedAt,
  palette,
  onComplete,
  height,
  paperTint,
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
        {completedAt && (
          <span className="px-3 text-center font-mono text-[9px] font-bold uppercase tracking-[0.13em]">
            Завершено · {formatCompletedDate(completedAt)}
          </span>
        )}
      </div>

      {!completedAt && (
        <button
          type="button"
          ref={couponRef}
          onClick={handleComplete}
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
            Завершить
          </span>
        </button>
      )}
    </div>
  );
};
