/**
 * Thin promise layer over IndexedDB: one key-value store for the app's data
 * and one store of backup snapshots. Every function resolves (never throws)
 * with a safe fallback when the database is unavailable, so the app keeps
 * running from memory in private windows or with storage blocked.
 */

const DB_NAME = 'card-tracker';
const DB_VERSION = 1;
const KV_STORE = 'kv';
const SNAPSHOT_STORE = 'snapshots';

export interface SnapshotRecord {
  /** ISO moment the snapshot was taken; also its key. */
  id: string;
  reason: 'start' | 'auto' | 'before-import';
  active: number;
  archived: number;
  trash: number;
  /** Hash of the payload, to skip a snapshot identical to the last one. */
  hash: string;
  /** The backup file text (see backupUtils). */
  payload: string;
}

export type SnapshotMeta = Omit<SnapshotRecord, 'payload'>;

export const openDatabase = (): Promise<IDBDatabase | null> =>
  new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(KV_STORE)) {
          db.createObjectStore(KV_STORE);
        }

        if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
          db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

const transactionDone = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

const requestResult = <T,>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

/** Everything in the key-value store. */
export const readAllKeyValues = async (
  db: IDBDatabase,
): Promise<Map<string, unknown>> => {
  const result = new Map<string, unknown>();

  try {
    const store = db.transaction(KV_STORE, 'readonly').objectStore(KV_STORE);
    const keys = await requestResult(store.getAllKeys());
    const values = await requestResult(store.getAll());

    keys.forEach((key, index) => result.set(String(key), values[index]));
  } catch {
    // An unreadable store behaves like an empty one.
  }

  return result;
};

/** Writes and removes in one transaction: all of it lands, or none of it. */
export const writeKeyValues = async (
  db: IDBDatabase,
  entries: Array<[string, unknown]>,
  removals: string[] = [],
): Promise<void> => {
  const transaction = db.transaction(KV_STORE, 'readwrite');
  const store = transaction.objectStore(KV_STORE);

  for (const [key, value] of entries) {
    store.put(value, key);
  }

  for (const key of removals) {
    store.delete(key);
  }

  await transactionDone(transaction);
};

export const putSnapshot = async (
  db: IDBDatabase,
  snapshot: SnapshotRecord,
): Promise<void> => {
  const transaction = db.transaction(SNAPSHOT_STORE, 'readwrite');
  transaction.objectStore(SNAPSHOT_STORE).put(snapshot);
  await transactionDone(transaction);
};

export const readSnapshots = async (
  db: IDBDatabase,
): Promise<SnapshotRecord[]> => {
  try {
    const store = db
      .transaction(SNAPSHOT_STORE, 'readonly')
      .objectStore(SNAPSHOT_STORE);

    return (await requestResult(store.getAll())) as SnapshotRecord[];
  } catch {
    return [];
  }
};

export const readSnapshot = async (
  db: IDBDatabase,
  id: string,
): Promise<SnapshotRecord | null> => {
  try {
    const store = db
      .transaction(SNAPSHOT_STORE, 'readonly')
      .objectStore(SNAPSHOT_STORE);

    return ((await requestResult(store.get(id))) as SnapshotRecord) ?? null;
  } catch {
    return null;
  }
};

export const deleteSnapshots = async (
  db: IDBDatabase,
  ids: string[],
): Promise<void> => {
  if (ids.length === 0) {
    return;
  }

  const transaction = db.transaction(SNAPSHOT_STORE, 'readwrite');
  const store = transaction.objectStore(SNAPSHOT_STORE);

  for (const id of ids) {
    store.delete(id);
  }

  await transactionDone(transaction);
};
