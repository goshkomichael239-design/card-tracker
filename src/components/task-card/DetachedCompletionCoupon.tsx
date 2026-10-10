import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';

import type { DetachedCoupon } from '../../app/cardTheme';
import { CouponFace } from './CouponFace';
import { INITIAL_TASK_CARD_V2_CONFIG } from './taskCardV2Config';

interface DetachedCompletionCouponProps {
  /** `landed` is true when the coupon ended up speared on the spike. */
  onFlightComplete: (landed: boolean) => void;
}

/** Where a torn coupon flies to: the receipt spike on the table, if visible. */
const findSpikeTarget = (): DOMRect | null => {
  const rect = document
    .querySelector('[data-coupon-spike]')
    ?.getBoundingClientRect();

  return rect && rect.width > 0 && rect.height > 0 ? rect : null;
};

export interface DetachedCompletionCouponHandle {
  launch: (coupon: DetachedCoupon) => void;
  /** Takes the coupon out of the air at once (used when a completion is undone). */
  cancel: () => void;
}

// The coupon is laid out at its natural size inside the card and then scaled
// with the whole scene. The flying copy is drawn at that natural size too and
// scaled by the same factor, so its lettering, strokes, texture and shadows are
// exactly those of the coupon it came from, at any screen size.
const COUPON_BASE_WIDTH =
  INITIAL_TASK_CARD_V2_CONFIG.width -
  INITIAL_TASK_CARD_V2_CONFIG.contentPadding * 2;
const COUPON_BASE_HEIGHT = INITIAL_TASK_CARD_V2_CONFIG.couponHeight;

interface FaceState {
  paper: string;
  glow: string;
  progress?: number;
  label: string;
}

export const DetachedCompletionCoupon = forwardRef<
  DetachedCompletionCouponHandle,
  DetachedCompletionCouponProps
>(({ onFlightComplete }, ref) => {
  const couponRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const onFlightCompleteRef = useRef(onFlightComplete);
  const [face, setFace] = useState<FaceState>({
    paper: '#F7F2E8',
    glow: '#FFD9C2',
    label: 'Завершить',
  });

  useEffect(() => {
    onFlightCompleteRef.current = onFlightComplete;
  }, [onFlightComplete]);

  useImperativeHandle(ref, () => ({
    launch: (coupon) => {
      const couponElement = couponRef.current;
      const bodyElement = bodyRef.current;

      if (!couponElement || !bodyElement) {
        return;
      }

      animationRef.current?.cancel();

      // Paint the face first, so the first frame of the flight is complete.
      flushSync(() =>
        setFace({
          paper: coupon.palette.paper,
          glow: coupon.palette.glow,
          progress: coupon.progress,
          label: coupon.label ?? 'Завершить',
        }),
      );

      const driftDirection = Math.random() < 0.5 ? -1 : 1;
      const rotationDirection = Math.random() < 0.5 ? -1 : 1;
      const originX = 25 + Math.random() * 50;
      const originY = 25 + Math.random() * 50;
      const driftX = driftDirection * (18 + Math.random() * 27);
      const finalRotation = rotationDirection * (35 + Math.random() * 50);
      const fallDistance = window.innerHeight - coupon.top + coupon.height + 80;
      const scale = coupon.width / COUPON_BASE_WIDTH;

      const spike = findSpikeTarget();

      couponElement.style.left = `${coupon.left}px`;
      couponElement.style.top = `${coupon.top}px`;
      couponElement.style.width = `${coupon.width}px`;
      couponElement.style.height = `${coupon.height}px`;
      couponElement.style.transformOrigin = spike
        ? '50% 50%'
        : `${originX}% ${originY}%`;
      couponElement.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';
      couponElement.style.visibility = 'visible';
      bodyElement.style.transform = `scale(${scale})`;

      let animation: Animation;

      if (spike) {
        // Thrown in an arc onto the spike, shrinking to a slip on the needle.
        const dx = spike.left + spike.width / 2 - (coupon.left + coupon.width / 2);
        const dy = spike.top + spike.height * 0.4 - (coupon.top + coupon.height / 2);
        const endScale = Math.min(0.25, (spike.width * 0.62) / coupon.width);
        const tilt = rotationDirection * (8 + Math.random() * 10);

        animation = couponElement.animate(
          [
            { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)' },
            {
              transform: `translate3d(${dx * 0.4}px, ${Math.min(-50, dy * 0.15 - 70)}px, 0) rotate(${tilt * 0.6}deg) scale(0.6)`,
              offset: 0.45,
            },
            {
              transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${tilt}deg) scale(${endScale})`,
            },
          ],
          {
            duration: 900,
            easing: 'cubic-bezier(0.45, 0, 0.3, 1)',
            fill: 'forwards',
          },
        );
      } else {
        animation = couponElement.animate(
          [
            { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
            {
              transform: `translate3d(${driftX}px, ${fallDistance}px, 0) rotate(${finalRotation}deg)`,
            },
          ],
          {
            duration: 1.15 * 1000,
            easing: 'linear',
            fill: 'forwards',
          },
        );
      }

      animationRef.current = animation;

      // However the flight ends — it finishes, the browser drops it, or it
      // never reports back — the app must hear about it once, or it would
      // refuse every further completion.
      const finish = () => {
        if (animationRef.current !== animation) {
          return;
        }

        window.clearTimeout(guard);
        couponElement.style.visibility = 'hidden';
        animationRef.current = null;
        onFlightCompleteRef.current(Boolean(spike));
      };

      const guard = window.setTimeout(
        finish,
        (spike ? 900 : 1_150) + 1_500,
      );

      animation.finished.then(finish).catch(finish);
    },
    cancel: () => {
      const couponElement = couponRef.current;

      if (!animationRef.current) {
        return;
      }

      animationRef.current.cancel();
      animationRef.current = null;

      if (couponElement) {
        couponElement.style.visibility = 'hidden';
      }

      onFlightCompleteRef.current(false);
    },
  }), []);

  useEffect(() => {
    return () => {
      animationRef.current?.cancel();
    };
  }, []);

  return (
    <div
      ref={couponRef}
      className="pointer-events-none fixed"
      style={{
        zIndex: 100,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        visibility: 'hidden',
      }}
      aria-hidden="true"
    >
      <div
        ref={bodyRef}
        className="absolute left-0 top-0"
        style={{
          width: COUPON_BASE_WIDTH,
          height: COUPON_BASE_HEIGHT,
          transformOrigin: '0 0',
        }}
      >
        {/* Shadow cast by the loose piece on whatever is below it. */}
        <div
          className="pointer-events-none absolute rounded-[8px]"
          style={{
            inset: '5px -3px -6px 3px',
            backgroundColor: 'rgba(0,0,0,0.32)',
            boxShadow: '0 5px 9px rgba(0,0,0,0.32)',
          }}
        />

        <CouponFace
          paper={face.paper}
          glow={face.glow}
          progress={face.progress}
          label={face.label}
        />
      </div>
    </div>
  );
});
