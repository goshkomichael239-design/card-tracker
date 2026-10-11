import { readValue, writeValue } from './storage/kv';

const HAPTICS_KEY = 'card-tracker.haptics';

/** On unless the person switched it off. */
export const isHapticsEnabled = (): boolean =>
  readValue<boolean>(HAPTICS_KEY) !== false;

export const setHapticsEnabled = (enabled: boolean): void =>
  writeValue(HAPTICS_KEY, enabled);

/** Whether this device can vibrate at all (Android browsers can, iPhones cannot). */
export const canVibrate = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

/** A short tactile "click" for a physical-feeling action; silent where unsupported. */
export const haptic = (pattern: number | number[] = 8): void => {
  if (!canVibrate() || !isHapticsEnabled()) {
    return;
  }

  try {
    navigator.vibrate(pattern);
  } catch {
    // Vibration is a nicety, never a requirement.
  }
};
