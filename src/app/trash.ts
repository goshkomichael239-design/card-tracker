import type { VisualCard } from './cardTheme';
import { isStoredVisualCard, sanitizeStoredCard } from './cardValidation';
import { quarantine } from './persistence';
import { readValue, writeValue } from './storage/kv';

/** A card thrown into the bin: it keeps its place in the deck for a restore. */
export interface TrashedCard {
  card: VisualCard;
  trashedAt: string;
  /** Position the card had in the deck when it was thrown away. */
  index: number;
}

export const TRASH_STORAGE_KEY = 'card-tracker.trash.v1';
export const TRASH_RETENTION_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;
const RETENTION_MS = TRASH_RETENTION_DAYS * DAY_MS;

export const isTrashedCard = (value: unknown): value is TrashedCard => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    isStoredVisualCard(item.card) &&
    typeof item.trashedAt === 'string' &&
    Number.isFinite(new Date(item.trashedAt).getTime()) &&
    typeof item.index === 'number' &&
    Number.isFinite(item.index)
  );
};

/** Drops what has been in the bin for longer than the retention period. */
export const purgeExpiredTrash = (
  items: TrashedCard[],
  now: number = Date.now(),
): TrashedCard[] =>
  items.filter(
    (item) => now - new Date(item.trashedAt).getTime() < RETENTION_MS,
  );

export const loadTrash = (): TrashedCard[] => {
  const stored = readValue<unknown>(TRASH_STORAGE_KEY);

  if (stored === undefined) {
    return [];
  }

  if (!Array.isArray(stored)) {
    quarantine(TRASH_STORAGE_KEY, [stored]);
    return [];
  }

  const valid = stored.filter(isTrashedCard);

  if (valid.length !== stored.length) {
    quarantine(
      TRASH_STORAGE_KEY,
      stored.filter((item) => !isTrashedCard(item)),
    );
  }

  return purgeExpiredTrash(valid).map((item) => ({
    ...item,
    card: sanitizeStoredCard(item.card),
  }));
};

export const saveTrash = (items: TrashedCard[]): void =>
  writeValue(TRASH_STORAGE_KEY, items);

/** Whole days the card has left in the bin (at least 1 while it is there). */
export const getTrashDaysLeft = (
  item: TrashedCard,
  now: number = Date.now(),
): number =>
  Math.max(
    1,
    Math.ceil(
      (new Date(item.trashedAt).getTime() + RETENTION_MS - now) / DAY_MS,
    ),
  );

/** "сегодня", "вчера", "3 дн. назад" */
export const formatTrashedAgo = (
  item: TrashedCard,
  now: number = Date.now(),
): string => {
  const trashed = new Date(item.trashedAt);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor(
    (startOfToday.getTime() - new Date(trashed).setHours(0, 0, 0, 0)) / DAY_MS,
  );

  if (days <= 0) {
    return 'сегодня';
  }

  if (days === 1) {
    return 'вчера';
  }

  return `${days} дн. назад`;
};
