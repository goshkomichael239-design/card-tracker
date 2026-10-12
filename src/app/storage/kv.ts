import { openDatabase, readAllKeyValues, writeKeyValues } from './idb';

/**
 * The app's durable key-value storage.
 *
 * Everything is read once at start (`initStorage`) into memory, so the rest of
 * the app reads synchronously; writes go to memory at once and are flushed to
 * IndexedDB in one transaction shortly after (and whenever the page is hidden).
 * When IndexedDB is unavailable the same keys live in localStorage.
 *
 * The state is kept on globalThis so a hot reload of this module in
 * development does not drop what was loaded.
 */

const META_KEY = 'card-tracker.meta';
const CHANNEL_NAME = 'card-tracker-storage';
/** What older versions kept in localStorage; moved to IndexedDB once. */
const LEGACY_KEYS = [
  'card-tracker.active-cards.v1',
  'card-tracker.archive.v1',
  'card-tracker.trash.v1',
  'card-tracker.schema-version',
  'card-tracker.corner-hint-dismissed.v1',
];

const FLUSH_DELAY_MS = 300;
const FLUSH_MAX_WAIT_MS = 2_000;

export type StorageMode = 'idb' | 'local' | 'memory';

export interface StorageStatus {
  mode: StorageMode;
  /** Another tab changed the data: this tab stopped writing to protect it. */
  isStale: boolean;
  /** The last write failed; the data is only in memory right now. */
  hasWriteError: boolean;
  /** The database did not answer at start: nothing is saved this time. */
  isUnavailable: boolean;
}

interface KvState {
  db: IDBDatabase | null;
  mode: StorageMode;
  memory: Map<string, unknown>;
  /** What was last stored per key, to skip writes that change nothing. */
  stored: Map<string, string>;
  dirty: Set<string>;
  flushTimer: number | null;
  firstDirtyAt: number | null;
  isFlushing: boolean;
  isStale: boolean;
  hasWriteError: boolean;
  isUnavailable: boolean;
  tabId: string;
  channel: BroadcastChannel | null;
  listeners: Set<() => void>;
  status: StorageStatus;
  initialised: boolean;
}

const globalScope = globalThis as unknown as {
  __cardTrackerKv?: KvState;
};

const state: KvState = (globalScope.__cardTrackerKv ??= {
  db: null,
  mode: 'memory',
  memory: new Map(),
  stored: new Map(),
  dirty: new Set(),
  flushTimer: null,
  firstDirtyAt: null,
  isFlushing: false,
  isStale: false,
  hasWriteError: false,
  isUnavailable: false,
  tabId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
  channel: null,
  listeners: new Set(),
  status: {
    mode: 'memory',
    isStale: false,
    hasWriteError: false,
    isUnavailable: false,
  },
  initialised: false,
});

const serialise = (value: unknown): string => {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '';
  }
};

const publishStatus = () => {
  state.status = {
    mode: state.mode,
    isStale: state.isStale,
    hasWriteError: state.hasWriteError,
    isUnavailable: state.isUnavailable,
  };
  state.listeners.forEach((listener) => listener());
};

export const subscribeStorageStatus = (listener: () => void): (() => void) => {
  state.listeners.add(listener);
  return () => state.listeners.delete(listener);
};

export const getStorageStatus = (): StorageStatus => state.status;

const readLegacyLocalStorage = (): Map<string, unknown> => {
  const result = new Map<string, unknown>();

  try {
    for (const key of LEGACY_KEYS) {
      const raw = window.localStorage.getItem(key);

      if (raw === null) {
        continue;
      }

      try {
        result.set(key, JSON.parse(raw));
      } catch {
        // Not valid JSON: keep the text aside rather than lose it.
        result.set(`${key}.unparsed`, raw);
      }
    }
  } catch {
    // localStorage itself is unavailable.
  }

  return result;
};

const handleExternalMessage = (event: MessageEvent) => {
  const message = event.data as { tab?: string } | null;

  if (!message || message.tab === state.tabId || state.isStale) {
    return;
  }

  // Another tab saved something different: from now on this tab only reads,
  // so the two can never overwrite each other with an old copy.
  state.isStale = true;
  publishStatus();
};

const openChannel = () => {
  if (typeof BroadcastChannel === 'undefined') {
    return;
  }

  try {
    state.channel = new BroadcastChannel(CHANNEL_NAME);
    state.channel.onmessage = handleExternalMessage;
  } catch {
    state.channel = null;
  }
};

/** Opens the database, moves old localStorage data over once, loads it all. */
export const initStorage = async (): Promise<void> => {
  if (state.initialised) {
    return;
  }

  const opened = await openDatabase();

  state.db = opened.db;

  if (opened.timedOut) {
    // The browser's database does not answer: start without it rather than
    // show an empty screen. What is shown is the old copy kept in
    // localStorage (if any), nothing is written anywhere until the next start,
    // and the person is told so: a late answer must never be overwritten by
    // a stale copy.
    state.mode = 'memory';
    state.isUnavailable = true;
    state.memory = readLegacyLocalStorage();
  } else if (state.db) {
    state.mode = 'idb';
    state.memory = await readAllKeyValues(state.db);

    if (!state.memory.has(META_KEY)) {
      // First run on IndexedDB: carry over what localStorage holds. The old
      // keys are left in place, as a copy that costs nothing to keep.
      const legacy = readLegacyLocalStorage();
      const entries: Array<[string, unknown]> = [];

      for (const [key, value] of legacy) {
        state.memory.set(key, value);
        entries.push([key, value]);
      }

      const meta = {
        migratedAt: new Date().toISOString(),
        migratedKeys: [...legacy.keys()],
      };

      state.memory.set(META_KEY, meta);
      entries.push([META_KEY, meta]);

      try {
        await writeKeyValues(state.db, entries);
      } catch {
        state.hasWriteError = true;
      }
    }

    try {
      // Ask the browser not to evict the data when disk space runs low.
      void navigator.storage?.persist?.();
    } catch {
      // Best effort only.
    }
  } else {
    state.mode = 'local';
    state.memory = readLegacyLocalStorage();
  }

  for (const [key, value] of state.memory) {
    state.stored.set(key, serialise(value));
  }

  openChannel();

  const flushWhenHidden = () => {
    if (document.visibilityState === 'hidden') {
      void flushNow();
    }
  };

  document.addEventListener('visibilitychange', flushWhenHidden);
  window.addEventListener('pagehide', () => void flushNow());

  state.initialised = true;
  publishStatus();
};

export const readValue = <T,>(key: string): T | undefined =>
  state.memory.get(key) as T | undefined;

const scheduleFlush = () => {
  const now = Date.now();

  if (state.firstDirtyAt === null) {
    state.firstDirtyAt = now;
  }

  if (state.flushTimer !== null) {
    window.clearTimeout(state.flushTimer);
  }

  const wait = Math.min(
    FLUSH_DELAY_MS,
    Math.max(0, state.firstDirtyAt + FLUSH_MAX_WAIT_MS - now),
  );

  state.flushTimer = window.setTimeout(() => void flushNow(), wait);
};

export const writeValue = (key: string, value: unknown): void => {
  if (state.isStale) {
    return;
  }

  // Whether anything really changed is worked out once per flush, not on
  // every write: a burst of edits costs one comparison, not one each.
  state.memory.set(key, value);
  state.dirty.add(key);
  scheduleFlush();
};

export const removeValue = (key: string): void => {
  if (state.isStale || !state.memory.has(key)) {
    return;
  }

  state.memory.delete(key);
  state.stored.delete(key);
  state.dirty.add(key);
  scheduleFlush();
};

/** Writes everything pending, now. Resolves when it has landed (or failed). */
export const flushNow = async (): Promise<void> => {
  if (state.flushTimer !== null) {
    window.clearTimeout(state.flushTimer);
    state.flushTimer = null;
  }

  if (state.isFlushing) {
    // A write is in flight; whatever is dirty goes out right after it.
    scheduleFlush();
    return;
  }

  if (state.dirty.size === 0 || state.isStale || state.isUnavailable) {
    return;
  }

  const keys = [...state.dirty];
  state.dirty.clear();
  state.firstDirtyAt = null;
  state.isFlushing = true;

  const entries: Array<[string, unknown]> = [];
  const removals: string[] = [];

  for (const key of keys) {
    if (state.memory.has(key)) {
      const value = state.memory.get(key);

      // The same bytes as already stored: nothing to write, nothing to announce.
      if (state.stored.get(key) !== serialise(value)) {
        entries.push([key, value]);
      }
    } else {
      removals.push(key);
    }
  }

  if (entries.length === 0 && removals.length === 0) {
    state.isFlushing = false;
    return;
  }

  try {
    if (state.mode === 'idb' && state.db) {
      await writeKeyValues(state.db, entries, removals);
    } else if (state.mode === 'local') {
      for (const [key, value] of entries) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }

      for (const key of removals) {
        window.localStorage.removeItem(key);
      }
    }

    for (const [key, value] of entries) {
      state.stored.set(key, serialise(value));
    }

    if (state.hasWriteError) {
      state.hasWriteError = false;
      publishStatus();
    }

    state.channel?.postMessage({ tab: state.tabId, keys });
  } catch {
    // Keep the keys dirty so the next write retries them.
    keys.forEach((key) => state.dirty.add(key));
    state.hasWriteError = true;
    publishStatus();
    // Try again in a few seconds even if nothing else changes.
    window.setTimeout(() => {
      state.hasWriteError = false;
      void flushNow();
    }, 5_000);
  } finally {
    state.isFlushing = false;
  }

  if (state.dirty.size > 0 && !state.hasWriteError) {
    scheduleFlush();
  }
};

/** The database handle, for the snapshot store (null without IndexedDB). */
export const getDatabase = (): IDBDatabase | null => state.db;
