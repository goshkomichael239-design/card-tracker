import React, { useEffect, useRef } from 'react';

import type { VisualCard } from '../../app/cardTheme';
import { TaskCard } from './TaskCard';

type TransientCardKind = 'switch' | 'completion' | 'discard';

interface TransientTaskCardOverlayProps {
  card: VisualCard;
  kind: TransientCardKind;
  onFinish: (kind: TransientCardKind) => void;
}

export const TransientTaskCardOverlay: React.FC<
  TransientTaskCardOverlayProps
> = ({ card, kind, onFinish }) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const overlay = overlayRef.current;

    if (!overlay) {
      return;
    }

    let animation: Animation | null = null;
    const frameId = window.requestAnimationFrame(() => {
      const exitDuration =
        kind === 'completion' ? 320 : kind === 'discard' ? 300 : 200;
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
          : kind === 'discard'
            ? {
                transform:
                  'translate3d(-46px, 84px, 0) rotate(-9deg) scale(0.9)',
                opacity: 0,
              }
            : {
                transform:
                  'translate3d(-10px, -2px, 0) rotate(-0.45deg) scale(0.995)',
                opacity: 0,
              };

      animation = overlay.animate(
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
              : kind === 'discard'
                ? 'cubic-bezier(0.4, 0, 1, 1)'
                : 'ease-out',
          fill: 'forwards',
        },
      );

      animation.finished
        .then(() => onFinish(kind))
        .catch(() => undefined);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      animation?.cancel();
    };
  }, [kind, onFinish]);

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
