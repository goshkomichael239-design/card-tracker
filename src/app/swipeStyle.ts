import { useSyncExternalStore } from 'react';

import { readValue, writeValue } from './storage/kv';

/**
 * How a card looks while it is pulled sideways (a trial: two ways to feel):
 * - stamp: a rubber stamp is pressed on the card, "Готово" or "Убрать";
 * - coupon: a coupon strip fills up as it is pulled, and tears at the end.
 */
export type SwipeStyle = 'stamp' | 'coupon';

export const SWIPE_STYLES: SwipeStyle[] = ['stamp', 'coupon'];

const SWIPE_STYLE_KEY = 'card-tracker.swipe-style.v1';

const listeners = new Set<() => void>();
let current: SwipeStyle = 'stamp';

const isSwipeStyle = (value: unknown): value is SwipeStyle =>
  value === 'stamp' || value === 'coupon';

const apply = (style: SwipeStyle) => {
  current = style;

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.swipeStyle = style;
  }
};

/** Call once before the app renders. */
export const initSwipeStyle = (): void => {
  const stored = readValue<string>(SWIPE_STYLE_KEY);

  apply(isSwipeStyle(stored) ? stored : 'stamp');
};

export const setSwipeStyle = (style: SwipeStyle): void => {
  writeValue(SWIPE_STYLE_KEY, style);
  apply(style);
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useSwipeStyle = (): SwipeStyle =>
  useSyncExternalStore(subscribe, () => current, () => current);
