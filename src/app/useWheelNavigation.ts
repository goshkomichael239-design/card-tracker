import { useEffect, useRef, type RefObject } from 'react';

const WHEEL_INTENT_THRESHOLD = 6;
const WHEEL_GESTURE_END_MS = 90;

interface WheelNavigationOptions {
  onNext: () => void;
  onPrevious: () => void;
  /** False while there is nothing to turn to (one card or none). */
  isEnabled?: boolean;
  /**
   * Wheel over a scrolling area inside (a long list on the card) keeps its own
   * scrolling: events starting inside such an element are left alone.
   */
  ignoreWithin?: string;
}

/**
 * The mouse wheel turns the cards: one notch (or one trackpad gesture), one
 * card. Used by the list, the stack and the dots, so all of them feel alike.
 */
export const useWheelNavigation = (
  ref: RefObject<HTMLElement | null>,
  { onNext, onPrevious, isEnabled = true, ignoreWithin }: WheelNavigationOptions,
): void => {
  const nextRef = useRef(onNext);
  const previousRef = useRef(onPrevious);
  const enabledRef = useRef(isEnabled);
  const accumulatorRef = useRef(0);
  const gestureActiveRef = useRef(false);
  const lastEventAtRef = useRef(0);

  useEffect(() => {
    nextRef.current = onNext;
    previousRef.current = onPrevious;
    enabledRef.current = isEnabled;
  });

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (
        ignoreWithin &&
        event.target instanceof Element &&
        event.target.closest(ignoreWithin)
      ) {
        return;
      }

      event.preventDefault();

      if (!enabledRef.current) {
        return;
      }

      const delta =
        event.deltaMode === 1
          ? event.deltaY * 16
          : event.deltaMode === 2
            ? event.deltaY * window.innerHeight
            : event.deltaY;

      if (delta === 0) {
        return;
      }

      const now = performance.now();

      if (now - lastEventAtRef.current > WHEEL_GESTURE_END_MS) {
        gestureActiveRef.current = false;
        accumulatorRef.current = 0;
      }

      lastEventAtRef.current = now;

      if (gestureActiveRef.current) {
        return;
      }

      if (
        accumulatorRef.current !== 0 &&
        Math.sign(accumulatorRef.current) !== Math.sign(delta)
      ) {
        accumulatorRef.current = 0;
      }

      accumulatorRef.current += delta;

      if (Math.abs(accumulatorRef.current) < WHEEL_INTENT_THRESHOLD) {
        return;
      }

      const direction = accumulatorRef.current > 0 ? 1 : -1;

      accumulatorRef.current = 0;
      gestureActiveRef.current = true;

      if (direction > 0) {
        nextRef.current();
      } else {
        previousRef.current();
      }
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [ref, ignoreWithin]);
};
