import { Capacitor } from '@capacitor/core';
import { Haptics } from '@capacitor/haptics';

import { readValue, writeValue } from './storage/kv';

const HAPTICS_KEY = 'card-tracker.haptics';

/** On unless the person switched it off. */
export const isHapticsEnabled = (): boolean =>
  readValue<boolean>(HAPTICS_KEY) !== false;

export const setHapticsEnabled = (enabled: boolean): void =>
  writeValue(HAPTICS_KEY, enabled);

/** Inside the Android app (the Capacitor shell) the browser's own vibrate call does nothing: the motor is asked through the shell. */
const isNativeApp = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/** Whether this device can vibrate at all (the app and Android browsers can, iPhones cannot). */
export const canVibrate = (): boolean =>
  isNativeApp() ||
  (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function');

/**
 * A pattern is on / off / on / off ... in milliseconds. The shell vibrates for
 * one length at a time, so a pattern is played as separate pulses.
 */
const vibrateNative = (pattern: number | number[]): void => {
  const steps = typeof pattern === 'number' ? [pattern] : pattern;
  let elapsed = 0;

  steps.forEach((length, index) => {
    if (index % 2 === 0 && length > 0) {
      // Under ~15 ms a motor does not move at all.
      const duration = Math.max(18, Math.round(length));

      window.setTimeout(() => {
        void Haptics.vibrate({ duration }).catch(() => undefined);
      }, elapsed);
    }

    elapsed += length;
  });
};

/** A short tactile "click" for a physical-feeling action; silent where unsupported. */
export const haptic = (pattern: number | number[] = 8): void => {
  if (!canVibrate() || !isHapticsEnabled()) {
    return;
  }

  try {
    if (isNativeApp()) {
      vibrateNative(pattern);
      return;
    }

    navigator.vibrate(pattern);
  } catch {
    // Vibration is a nicety, never a requirement.
  }
};
