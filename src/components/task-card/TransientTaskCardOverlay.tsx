import React, { useEffect, useRef } from 'react';

import type { VisualCard } from '../../app/cardTheme';
import { TaskCard } from './TaskCard';

type TransientCardKind = 'switch' | 'completion' | 'discard';

interface TransientTaskCardOverlayProps {
  card: VisualCard;
  kind: TransientCardKind;
  onFinish: (kind: TransientCardKind) => void;
}

// A jagged tear across the card: both halves share the same zig-zag so they
// fit together before they come apart.
const TEAR_TOP_PATH =
  'polygon(0 0, 100% 0, 100% 56%, 92% 53%, 83% 58%, 74% 53%, 65% 59%, 56% 54%, 47% 58%, 38% 53%, 29% 59%, 20% 54%, 11% 58%, 0 55%)';
const TEAR_BOTTOM_PATH =
  'polygon(0 55%, 11% 58%, 20% 54%, 29% 59%, 38% 53%, 47% 58%, 56% 54%, 65% 59%, 74% 53%, 83% 58%, 92% 53%, 100% 56%, 100% 100%, 0 100%)';

export const TransientTaskCardOverlay: React.FC<
  TransientTaskCardOverlayProps
> = ({ card, kind, onFinish }) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const topHalfRef = useRef<HTMLDivElement | null>(null);
  const bottomHalfRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const animations: Animation[] = [];
    const frameId = window.requestAnimationFrame(() => {
      if (kind === 'discard') {
        const topHalf = topHalfRef.current;
        const bottomHalf = bottomHalfRef.current;

        if (!topHalf || !bottomHalf) {
          return;
        }

        const options: KeyframeAnimationOptions = {
          duration: 440,
          easing: 'cubic-bezier(0.5, 0, 0.9, 0.6)',
          fill: 'forwards',
        };
        const topAnimation = topHalf.animate(
          [
            { transform: 'translate3d(0, 0, 0) rotate(0deg)', opacity: 1 },
            {
              transform: 'translate3d(-36px, -52px, 0) rotate(-7deg)',
              opacity: 0,
            },
          ],
          options,
        );
        const bottomAnimation = bottomHalf.animate(
          [
            { transform: 'translate3d(0, 0, 0) rotate(0deg)', opacity: 1 },
            {
              transform: 'translate3d(32px, 84px, 0) rotate(5deg)',
              opacity: 0,
            },
          ],
          options,
        );

        animations.push(topAnimation, bottomAnimation);
        Promise.all([topAnimation.finished, bottomAnimation.finished])
          .then(() => onFinish(kind))
          .catch(() => undefined);
        return;
      }

      const overlay = overlayRef.current;

      if (!overlay) {
        return;
      }

      const exitDuration = kind === 'completion' ? 320 : 200;
      const archiveDirectionY = Math.max(
        96,
        Math.min(180, window.innerHeight * 0.18),
      );

      const exitFrame =
        kind === 'completion'
          ? {
              transform: `translate3d(0, ${archiveDirectionY}px, 0) rotate(0.6deg) scale(0.97)`,
              opacity: 0,
              offset: 1,
            }
          : {
              transform:
                'translate3d(-10px, -2px, 0) rotate(-0.45deg) scale(0.995)',
              opacity: 0,
            };

      const animation = overlay.animate(
        [
          {
            transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
            opacity: 1,
          },
          exitFrame,
        ],
        {
          duration: exitDuration,
          easing:
            kind === 'completion'
              ? 'cubic-bezier(0.32, 0.72, 0, 1)'
              : 'ease-out',
          fill: 'forwards',
        },
      );

      animations.push(animation);
      animation.finished
        .then(() => onFinish(kind))
        .catch(() => undefined);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      animations.forEach((animation) => animation.cancel());
    };
  }, [kind, onFinish]);

  if (kind === 'discard') {
    return (
      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 20 }}
        aria-hidden="true"
      >
        {[
          { ref: topHalfRef, clipPath: TEAR_TOP_PATH },
          { ref: bottomHalfRef, clipPath: TEAR_BOTTOM_PATH },
        ].map((half) => (
          <div
            key={half.clipPath}
            ref={half.ref}
            className="absolute inset-0"
            style={{
              clipPath: half.clipPath,
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
            }}
          >
            <TaskCard card={card} onComplete={() => undefined} isStatic />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute inset-0"
      style={{
        zIndex: 20,
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
      }}
      aria-hidden="true"
    >
      <TaskCard
        card={card}
        onComplete={() => undefined}
        isStatic
        hideCoupon={kind === 'completion'}
      />
    </div>
  );
};
