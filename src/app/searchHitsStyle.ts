import { useSyncExternalStore } from 'react';

import { readValue, writeValue } from './storage/kv';

/**
 * Where a search shows what it found in the other decks:
 * - buttons: "Найдено в «Работа» · 2" under the card file (as before);
 * - tabs: a number on each deck's tab, the decks with nothing dimmed.
 */
export type SearchHitsStyle = 'buttons' | 'tabs';

export const SEARCH_HITS_STYLES: SearchHitsStyle[] = ['buttons', 'tabs'];

const SEARCH_HITS_KEY = 'card-tracker.search-hits-style.v1';

const listeners = new Set<() => void>();

const isStyle = (value: unknown): value is SearchHitsStyle =>
  value === 'buttons' || value === 'tabs';

const read = (): SearchHitsStyle => {
  const stored = readValue<string>(SEARCH_HITS_KEY);

  return isStyle(stored) ? stored : 'buttons';
};

let current: SearchHitsStyle | null = null;

const getSnapshot = (): SearchHitsStyle => (current ??= read());

export const setSearchHitsStyle = (style: SearchHitsStyle): void => {
  writeValue(SEARCH_HITS_KEY, style);
  current = style;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useSearchHitsStyle = (): SearchHitsStyle =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
