import type { VisualCard } from '../cardTheme';
import type { Deck } from '../decks';
import { serializeBackup } from '../backupUtils';
import type { TrashedCard } from '../trash';
import {
  deleteSnapshots,
  putSnapshot,
  readSnapshot,
  readSnapshots,
  type SnapshotMeta,
  type SnapshotRecord,
} from './idb';
import { getDatabase } from './kv';

/**
 * Automatic safety copies, kept inside the browser's own database (not
 * downloaded): a rolling set that always has the last few hours in fine
 * steps and one copy per day for two weeks. Restoring one only adds cards
 * that are missing now, like importing a file, so it can never make things
 * worse.
 */

const MIN_AUTO_INTERVAL_MS = 10 * 60_000;
const AUTO_DEBOUNCE_MS = 45_000;
const KEEP_RECENT = 8;
const RECENT_WINDOW_MS = 24 * 60 * 60_000;
const KEEP_DAYS = 14;
const KEEP_BEFORE_IMPORT = 2;

export interface SnapshotData {
  cards: VisualCard[];
  archive: VisualCard[];
  trash: TrashedCard[];
  decks?: Deck[];
}

/** FNV-1a: a small, fast fingerprint; it only has to tell "changed or not". */
export const fingerprint = (text: string): string => {
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `${(hash >>> 0).toString(16)}-${text.length}`;
};

const dayKey = (iso: string): string => {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

/**
 * Which snapshots to delete: keeps the newest few from the last day, the
 * newest of each of the last two weeks' days, and the last pre-import ones.
 * Pure, so it can be checked without a database.
 */
export const planPrune = (
  snapshots: SnapshotMeta[],
  now: number = Date.now(),
): string[] => {
  const newestFirst = [...snapshots].sort((left, right) =>
    right.id.localeCompare(left.id),
  );
  const keep = new Set<string>();
  const seenDays = new Set<string>();
  let recent = 0;
  let beforeImport = 0;

  for (const snapshot of newestFirst) {
    const age = now - new Date(snapshot.id).getTime();
    const day = dayKey(snapshot.id);

    if (age < RECENT_WINDOW_MS && recent < KEEP_RECENT) {
      keep.add(snapshot.id);
      recent += 1;
    }

    if (!seenDays.has(day)) {
      seenDays.add(day);

      if (age < KEEP_DAYS * 24 * 60 * 60_000) {
        keep.add(snapshot.id);
      }
    }

    if (snapshot.reason === 'before-import' && beforeImport < KEEP_BEFORE_IMPORT) {
      keep.add(snapshot.id);
      beforeImport += 1;
    }
  }

  return newestFirst
    .filter((snapshot) => !keep.has(snapshot.id))
    .map((snapshot) => snapshot.id);
};

const toMeta = (record: SnapshotRecord): SnapshotMeta => ({
  id: record.id,
  reason: record.reason,
  active: record.active,
  archived: record.archived,
  trash: record.trash,
  hash: record.hash,
});

/** Newest first; empty when the database is unavailable. */
export const listSnapshots = async (): Promise<SnapshotMeta[]> => {
  const db = getDatabase();

  if (!db) {
    return [];
  }

  return (await readSnapshots(db))
    .map(toMeta)
    .sort((left, right) => right.id.localeCompare(left.id));
};

export const loadSnapshotPayload = async (
  id: string,
): Promise<string | null> => {
  const db = getDatabase();
  return db ? ((await readSnapshot(db, id))?.payload ?? null) : null;
};

/**
 * Stores a snapshot unless nothing changed since the last one (or, for the
 * timed kind, the last one is too fresh). Returns whether one was stored.
 */
export const takeSnapshot = async (
  reason: SnapshotRecord['reason'],
  data: SnapshotData,
  now: Date = new Date(),
): Promise<boolean> => {
  const db = getDatabase();
  const active = data.cards.filter((card) => !card.completedAt);

  if (
    !db ||
    (active.length === 0 &&
      data.archive.length === 0 &&
      data.trash.length === 0)
  ) {
    return false;
  }

  try {
    const hash = fingerprint(
      JSON.stringify([active, data.archive, data.trash, data.decks]),
    );
    const existing = (await readSnapshots(db)).map(toMeta);
    const latest = existing.sort((left, right) =>
      right.id.localeCompare(left.id),
    )[0];

    if (latest?.hash === hash) {
      return false;
    }

    if (
      reason === 'auto' &&
      latest &&
      now.getTime() - new Date(latest.id).getTime() < MIN_AUTO_INTERVAL_MS
    ) {
      return false;
    }

    await putSnapshot(db, {
      id: now.toISOString(),
      reason,
      active: active.length,
      archived: data.archive.length,
      trash: data.trash.length,
      hash,
      payload: serializeBackup(data.cards, data.archive, data.trash, false, data.decks),
    });

    await deleteSnapshots(
      db,
      planPrune([...existing, { id: now.toISOString(), reason } as SnapshotMeta], now.getTime()),
    );

    return true;
  } catch {
    return false;
  }
};

/**
 * Watches for changes and takes a snapshot a little after the user stops
 * (never more often than every ten minutes), plus one at start and one when
 * the page is hidden.
 */
export const createAutoBackup = (readData: () => SnapshotData) => {
  let timer: number | null = null;
  let hasPendingChange = false;

  const run = (reason: SnapshotRecord['reason']) => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }

    hasPendingChange = false;
    void takeSnapshot(reason, readData());
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && hasPendingChange) {
      run('auto');
    }
  });

  return {
    start: () => run('start'),
    noteChange: () => {
      hasPendingChange = true;

      if (timer !== null) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(() => run('auto'), AUTO_DEBOUNCE_MS);
    },
    snapshotBefore: (reason: SnapshotRecord['reason']) => run(reason),
  };
};
