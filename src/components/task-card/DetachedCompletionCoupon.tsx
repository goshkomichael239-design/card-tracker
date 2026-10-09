import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

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
  type DetachedCoupon,
} from '../../app/cardTheme';
import { INITIAL_TASK_CARD_V2_CONFIG } from './taskCardV2Config';

interface DetachedCompletionCouponProps {
  onFlightComplete: () => void;
}

export interface DetachedCompletionCouponHandle {
  launch: (coupon: DetachedCoupon) => void;
}

export const DetachedCompletionCoupon = forwardRef<
  DetachedCompletionCouponHandle,
  DetachedCompletionCouponProps
>(({ onFlightComplete }, ref) => {
  const dashPattern = `${COUPON_DASH_LENGTH} ${COUPON_DASH_GAP}`;
  const rectWidth = COUPON_WIDTH - COUPON_STROKE_INSET * 2;
  const rectHeight = COUPON_HEIGHT - COUPON_STROKE_INSET * 2;
  const rectRadius = Math.max(1, COUPON_RADIUS - COUPON_STROKE_INSET / 2);
  const couponRef = useRef<HTMLDivElement | null>(null);
  const paperRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const onFlightCompleteRef = useRef(onFlightComplete);

  useEffect(() => {
    onFlightCompleteRef.current = onFlightComplete;
  }, [onFlightComplete]);

  useImperativeHandle(ref, () => ({
    launch: (coupon) => {
      const couponElement = couponRef.current;
      const paperElement = paperRef.current;

      if (!couponElement || !paperElement) {
        return;
      }

      animationRef.current?.cancel();

      const driftDirection = Math.random() < 0.5 ? -1 : 1;
      const rotationDirection = Math.random() < 0.5 ? -1 : 1;
      const originX = 25 + Math.random() * 50;
      const originY = 25 + Math.random() * 50;
      const driftX = driftDirection * (18 + Math.random() * 27);
      const finalRotation = rotationDirection * (35 + Math.random() * 50);
      const fallDistance = window.innerHeight - coupon.top + coupon.height + 80;

      couponElement.style.left = `${coupon.left}px`;
      couponElement.style.top = `${coupon.top}px`;
      couponElement.style.width = `${coupon.width}px`;
      couponElement.style.height = `${coupon.height}px`;
      couponElement.style.transformOrigin = `${originX}% ${originY}%`;
      couponElement.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';
      couponElement.style.visibility = 'visible';
      paperElement.style.backgroundColor = INITIAL_TASK_CARD_V2_CONFIG.paperTint;
      if (labelRef.current) {
        labelRef.current.textContent = coupon.label ?? 'Завершить';
      }

      const animation = couponElement.animate(
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

      animationRef.current = animation;
      animation.finished
        .then(() => {
          if (animationRef.current !== animation) {
            return;
          }

          couponElement.style.visibility = 'hidden';
          animationRef.current = null;
          onFlightCompleteRef.current();
        })
        .catch(() => undefined);
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
        className="pointer-events-none absolute"
        style={{
          inset: '5px -3px -6px 3px',
          borderRadius: `${COUPON_RADIUS}px`,
          backgroundColor: 'rgba(0,0,0,0.32)',
          boxShadow: '0 5px 9px rgba(0,0,0,0.32)',
        }}
      />
      <div
        ref={paperRef}
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: `${COUPON_RADIUS}px`,
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
          boxShadow: '0 2px 3px rgba(0,0,0,0.22)',
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
        ref={labelRef}
        className="absolute inset-0 flex select-none items-center justify-center pt-[1px] font-mono text-[9px] font-semibold uppercase tracking-[0.18em]"
        style={{
          color: 'rgba(36,30,26,0.55)',
          textShadow: `
            -1px -1px 1px rgba(0,0,0,0.2),
            1px 1px 1px rgba(255,255,255,0.48)
          `,
        }}
      >
        {'\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044c'}
      </span>
    </div>
  );
});
