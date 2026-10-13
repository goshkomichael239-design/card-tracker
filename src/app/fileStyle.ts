import { useSyncExternalStore } from 'react';

import { readValue, writeValue } from './storage/kv';

/**
 * How the card file (the deck tabs and the edges under them) is put together:
 * - current: as it was: bright tabs, a coloured strip, loose edges;
 * - box: the edges lie in a box of the deck's back (the same as the stack
 *   below), the tabs grow out of it;
 * - leather: the same box, but of dark leather for every deck, the tabs keep
 *   their colours;
 * - folder: the tab of the deck on the table is of the paper of the first
 *   card, as its ear;
 * - flat: no coloured tabs; names with a line under the chosen one.
 */
export type FileStyle = 'current' | 'box' | 'leather' | 'folder' | 'flat';

export const FILE_STYLES: FileStyle[] = [
  'current',
  'box',
  'leather',
  'folder',
  'flat',
];

const FILE_STYLE_KEY = 'card-tracker.file-style.v1';

const listeners = new Set<() => void>();

const isStyle = (value: unknown): value is FileStyle =>
  typeof value === 'string' && (FILE_STYLES as string[]).includes(value);

const read = (): FileStyle => {
  const stored = readValue<string>(FILE_STYLE_KEY);

  return isStyle(stored) ? stored : 'current';
};

let current: FileStyle | null = null;

const getSnapshot = (): FileStyle => (current ??= read());

export const setFileStyle = (style: FileStyle): void => {
  writeValue(FILE_STYLE_KEY, style);
  current = style;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useFileStyle = (): FileStyle =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
