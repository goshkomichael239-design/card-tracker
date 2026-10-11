import { useSyncExternalStore } from 'react';
import { MotionGlobalConfig } from 'framer-motion';

import { readValue, writeValue } from './storage/kv';

/**
 * How much the interface moves:
 * - full: as designed;
 * - calm: shorter, and without the decorative extras (glints, sweeps,
 *   bumps, breathing);
 * - off: everything happens at once, for people in a hurry.
 */
export type MotionLevel = 'full' | 'calm' | 'off';

export const MOTION_LEVELS: MotionLevel[] = ['full', 'calm', 'off'];

const MOTION_KEY = 'card-tracker.motion.v1';

/** Time scale for every Web Animation while a level is in force. */
const DURATION_FACTOR: Record<MotionLevel, number> = {
  full: 1,
  calm: 0.6,
  off: 0,
};

const listeners = new Set<() => void>();

const isMotionLevel = (value: unknown): value is MotionLevel =>
  value === 'full' || value === 'calm' || value === 'off';

/** The saved choice; without one, "calm" for people whose system asks for it. */
export const getMotionLevel = (): MotionLevel => {
  const stored = readValue<string>(MOTION_KEY);

  if (isMotionLevel(stored)) {
    return stored;
  }

  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return prefersReduced ? 'calm' : 'full';
};

let currentLevel: MotionLevel = 'full';
let isPatched = false;

// Every card, coupon and basket movement here is a Web Animation, and so are
// the ones framer-motion starts: one place scales them all.
const patchAnimate = () => {
  if (isPatched || typeof Element === 'undefined') {
    return;
  }

  isPatched = true;

  const original = Element.prototype.animate;

  Element.prototype.animate = function (
    this: Element,
    keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
    options?: number | KeyframeAnimationOptions,
  ): Animation {
    const factor = DURATION_FACTOR[currentLevel];

    if (factor === 1) {
      return original.call(this, keyframes, options);
    }

    const scaled: KeyframeAnimationOptions =
      typeof options === 'number' ? { duration: options } : { ...(options ?? {}) };

    if (typeof scaled.duration === 'number') {
      scaled.duration *= factor;
    }

    if (typeof scaled.delay === 'number') {
      scaled.delay *= factor;
    }

    if (typeof scaled.endDelay === 'number') {
      scaled.endDelay *= factor;
    }

    return original.call(this, keyframes, scaled);
  };
};

const apply = (level: MotionLevel) => {
  currentLevel = level;
  MotionGlobalConfig.skipAnimations = level === 'off';

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.motion = level;
  }
};

/** Call once before the app renders. */
export const initMotion = (): void => {
  patchAnimate();
  apply(getMotionLevel());
};

export const setMotionLevel = (level: MotionLevel): void => {
  writeValue(MOTION_KEY, level);
  apply(level);
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useMotionLevel = (): MotionLevel =>
  useSyncExternalStore(subscribe, () => currentLevel, () => currentLevel);
