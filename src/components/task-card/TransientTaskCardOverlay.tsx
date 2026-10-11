import React, { useEffect, useRef } from 'react';

import type { VisualCard } from '../../app/cardTheme';
import { TaskCard } from './TaskCard';

type TransientCardKind =
  | 'switch'
  | 'completion'
  | 'discard'
  | 'trash'
  | 'postpone';

// Silhouettes of the card being crumpled into a ball. All three have the same
// twelve points so the browser can morph one into the next.
const SHEET_PATH =
  'polygon(0% 0%, 33% 0%, 66% 0%, 100% 0%, 100% 33%, 100% 66%, 100% 100%, 66% 100%, 33% 100%, 0% 100%, 0% 66%, 0% 33%)';
const CRUMPLING_PATH =
  'polygon(6% 4%, 30% 9%, 64% 2%, 95% 8%, 90% 36%, 98% 70%, 92% 95%, 62% 90%, 35% 98%, 4% 92%, 10% 62%, 2% 30%)';
const BALL_PATH =
  'polygon(20% 14%, 38% 22%, 60% 10%, 82% 22%, 76% 42%, 88% 64%, 74% 86%, 56% 78%, 36% 90%, 16% 78%, 24% 56%, 12% 34%)';

interface TransientTaskCardOverlayProps {
  card: VisualCard;
  kind: TransientCardKind;
  /** For a "switch": which way the deck turned, and where a finger left the card. */
  turn?: { direction: 1 | -1; fromY?: number };
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
> = ({ card, kind, turn, onFinish }) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const topHalfRef = useRef<HTMLDivElement | null>(null);
  const bottomHalfRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const animations: Animation[] = [];
    const frameId = window.requestAnimationFrame(() => {
      if (kind === 'trash') {
        const overlay = overlayRef.current;

        if (!overlay) {
          return;
        }

        // Aim at the basket on the table. The overlay lives inside the scaled
        // scene, so screen distances are divided by the scene's scale.
        const box = overlay.getBoundingClientRect();
        const scale = box.width / overlay.offsetWidth || 1;
        const bin = document
          .querySelector('[data-trash-bin]')
          ?.getBoundingClientRect();
        const dx = bin
          ? (bin.left + bin.width / 2 - (box.left + box.width / 2)) / scale
          : -overlay.offsetWidth * 0.8;
        const dy = bin
          ? (bin.top + bin.height * 0.3 - (box.top + box.height / 2)) / scale
          : overlay.offsetHeight * 0.9;

        const animation = overlay.animate(
          [
            {
              transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
              clipPath: SHEET_PATH,
              opacity: 1,
              offset: 0,
            },
            {
              transform: 'translate3d(0, -8px, 0) rotate(-3deg) scale(0.9, 0.84)',
              clipPath: CRUMPLING_PATH,
              opacity: 1,
              offset: 0.26,
            },
            {
              // Thrown in an arc: up first, then down into the basket.
              transform: `translate3d(${dx * 0.55}px, ${dy * 0.3 - 46}px, 0) rotate(-14deg) scale(0.4)`,
              clipPath: BALL_PATH,
              opacity: 1,
              offset: 0.62,
            },
            {
              transform: `translate3d(${dx}px, ${dy}px, 0) rotate(-30deg) scale(0.1)`,
              clipPath: BALL_PATH,
              opacity: 0.8,
              offset: 1,
            },
          ],
          {
            duration: 640,
            easing: 'cubic-bezier(0.45, 0, 0.55, 1)',
            fill: 'forwards',
          },
        );

        animations.push(animation);
        animation.finished
          .then(() => onFinish(kind))
          .catch(() => undefined);
        return;
      }

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

      if (kind === 'switch' && turn) {
        const startY = turn.fromY ?? 0;
        // Carried by a finger the card goes on in the finger's direction;
        // otherwise forward tucks it back under the stack, back sinks it.
        const end =
          turn.fromY !== undefined
            ? `translate3d(0, ${startY - turn.direction * 70}px, 0) rotate(${-turn.direction * 2}deg) scale(0.97)`
            : turn.direction === 1
              ? 'translate3d(26px, 30px, 0) rotate(2.4deg) scale(0.95)'
              : 'translate3d(0, 10px, 0) scale(0.965)';
        const turnAnimation = overlay.animate(
          [
            {
              transform: `translate3d(0, ${startY}px, 0) rotate(${(startY / 84) * 1.4}deg)`,
              opacity: 1,
            },
            { transform: end, opacity: 0 },
          ],
          {
            duration: turn.fromY !== undefined ? 220 : 280,
            easing: 'cubic-bezier(0.3, 0.6, 0.4, 1)',
            fill: 'forwards',
          },
        );

        animations.push(turnAnimation);
        turnAnimation.finished
          .then(() => onFinish(kind))
          .catch(() => undefined);
        return;
      }

      const exitDuration =
        kind === 'completion' ? 320 : kind === 'postpone' ? 420 : 200;
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
          : kind === 'postpone'
            ? {
                // Slipped to the back: down and to the right, under the stack.
                transform: 'translate3d(22px, 34px, 0) rotate(2.4deg) scale(0.94)',
                opacity: 0,
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
  }, [kind, onFinish, turn]);

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
        // Tucked back it goes under the stack's lower cards; otherwise it
        // stays just below the card that took its place.
        zIndex:
          kind === 'switch' && turn
            ? turn.direction === 1 && turn.fromY === undefined
              ? 13
              : 19
            : 20,
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
