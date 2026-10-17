import { Capacitor } from '@capacitor/core';

import { flushNow } from './storage/kv';

/**
 * Two builds of the web version live side by side on GitHub Pages: the main one
 * ("stable") at the site's address and the experimental one ("next", the newer
 * look and features still being tried) in its `next/` folder. They share one
 * address, so the cards are the same in both. The build says which one it is
 * (vite.config.ts); the switch in the settings walks from one to the other.
 */
export type Channel = 'stable' | 'next';

export const CHANNEL: Channel =
  typeof __CHANNEL__ === 'string' && __CHANNEL__ === 'next' ? 'next' : 'stable';

/** Only on the published web version (not in development, not in the phone's app). */
export const canSwitchChannel = (): boolean => {
  try {
    return import.meta.env.PROD && !Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/** Goes to the other build: the data is written out first. */
export const switchChannel = async (): Promise<void> => {
  await flushNow();

  const target = new URL(
    CHANNEL === 'stable' ? 'next/' : '../',
    window.location.href,
  );

  // A language given in the address (?lang=en) goes along.
  target.search = window.location.search;
  window.location.assign(target);
};
