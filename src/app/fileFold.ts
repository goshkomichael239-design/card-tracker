import { useSyncExternalStore } from 'react';

import { readValue, writeValue } from './storage/kv';

/**
 * Folding of the card file at the top (see CardSwitcher): when the card on the
 * table is being worked with, the file is pushed back into its box and shows
 * only the tabs and one edge; a tap or a pull down brings it out again.
 *
 * - auto: it folds by itself (while a card is edited or created, and after the
 *   cards have been paged a couple of times);
 * - never: the file stays as it was.
 */
export type FileFoldMode = 'auto' | 'never';

export const FILE_FOLD_MODES: FileFoldMode[] = ['auto', 'never'];

const FILE_FOLD_KEY = 'card-tracker.file-fold.v1';

const listeners = new Set<() => void>();

const isMode = (value: unknown): value is FileFoldMode =>
  value === 'auto' || value === 'never';

const read = (): FileFoldMode => {
  const stored = readValue<string>(FILE_FOLD_KEY);

  return isMode(stored) ? stored : 'auto';
};

let current: FileFoldMode | null = null;

const getSnapshot = (): FileFoldMode => (current ??= read());

export const setFileFoldMode = (mode: FileFoldMode): void => {
  writeValue(FILE_FOLD_KEY, mode);
  current = mode;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useFileFoldMode = (): FileFoldMode =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

// ---- Is the card on the table being edited right now? --------------------------------
// The card keeps its faces to itself; this tells the table (so that it can fold
// the file and give the card more room) without passing a callback through the stack.

let isEditing = false;
const editingListeners = new Set<() => void>();

export const setIsEditingCard = (value: boolean): void => {
  if (isEditing === value) {
    return;
  }

  isEditing = value;
  editingListeners.forEach((listener) => listener());
};

const subscribeEditing = (listener: () => void) => {
  editingListeners.add(listener);
  return () => editingListeners.delete(listener);
};

export const useIsEditingCard = (): boolean =>
  useSyncExternalStore(
    subscribeEditing,
    () => isEditing,
    () => isEditing,
  );
