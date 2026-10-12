import { useEffect, useState } from 'react';

import { getMotionLevel } from './motion';

/** How long the perforation takes to give way, from the first corner to the last. */
export const COUPON_TEAR_MS = 150;

interface TearClock {
  /** When the coupon was marked as being torn. */
  marked: number;
  /** When the piece first appeared on screen; the wave counts from here. */
  start: number | null;
}

// A tear that was marked but whose piece never appeared (it should not
// happen) is treated as finished after this long.
const PENDING_LIMIT_MS = 600;

const clocks = new Map<string, TearClock>();

/**
 * The coupon with this seed is about to be torn off (called in the press's
 * handler). The wave does not run until the piece is first drawn: the work the
 * handler still has to do must not eat it.
 */
export const markCouponTear = (seed: string): void => {
  clocks.set(seed, { marked: performance.now(), start: null });

  if (clocks.size > 20) {
    const oldest = clocks.keys().next().value;

    if (oldest !== undefined) {
      clocks.delete(oldest);
    }
  }
};

/** The piece is on screen: the wave starts (once). */
export const beginCouponTear = (seed: string): void => {
  const clock = clocks.get(seed);

  if (clock && clock.start === null) {
    clock.start = performance.now();
  }
};

/** The coupon is whole again (a completion was undone). */
export const clearCouponTear = (seed: string): void => {
  clocks.delete(seed);
};

/** 0..1: how far the tear has gone; 1 for a coupon torn earlier or with animations off. */
export const getCouponTearProgress = (
  seed: string,
  now: number = performance.now(),
): number => {
  const clock = clocks.get(seed);

  if (!clock || getMotionLevel() === 'off') {
    return 1;
  }

  if (clock.start === null) {
    return now - clock.marked > PENDING_LIMIT_MS ? 1 : 0;
  }

  return Math.min(1, Math.max(0, (now - clock.start) / COUPON_TEAR_MS));
};

/**
 * The tear's progress for a component that shows a torn coupon: it re-renders
 * every frame while the wave runs and settles at 1.
 */
export const useCouponTearProgress = (seed: string): number => {
  const [progress, setProgress] = useState(() => getCouponTearProgress(seed));

  useEffect(() => {
    let frame = 0;

    const step = () => {
      const next = getCouponTearProgress(seed);

      setProgress(next);

      if (next < 1) {
        frame = window.requestAnimationFrame(step);
      }
    };

    step();

    return () => window.cancelAnimationFrame(frame);
  }, [seed]);

  return progress;
};
