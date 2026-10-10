import type { VisualCard } from './cardTheme';
import { isStoredVisualCard, sanitizeStoredCard } from './cardValidation';

/**
 * Version of what is kept in browser storage.
 * 1 — cards, archive, bin (no version mark was written).
 * 2 — cards may carry postponements and a repeat rule.
 * Every load passes through `migrate`, so older data keeps working.
 */
export const SCHEMA_VERSION = 2;

const SCHEMA_VERSION_KEY = 'card-tracker.schema-version';
const ACTIVE_CARDS_KEY = 'card-tracker.active-cards.v1';
const ARCHIVE_KEY = 'card-tracker.archive.v1';

const readStoredVersion = (): number => {
  try {
    const stored = Number(window.localStorage.getItem(SCHEMA_VERSION_KEY));
    return Number.isInteger(stored) && stored >= 1 ? stored : 1;
  } catch {
    return 1;
  }
};

/**
 * Brings stored cards from any older version to the current one. Version 1
 * cards need no change (the new fields are optional), but every card is
 * sanitised so malformed new fields are dropped rather than trusted.
 */
const migrate = (cards: VisualCard[], fromVersion: number): VisualCard[] => {
  void fromVersion;
  return cards.map(sanitizeStoredCard);
};

const readCards = (key: string): VisualCard[] | null => {
  try {
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      return null;
    }

    const parsed: unknown = JSON.parse(stored);

    return Array.isArray(parsed)
      ? migrate(parsed.filter(isStoredVisualCard), readStoredVersion())
      : null;
  } catch {
    return null;
  }
};

const writeCards = (key: string, cards: VisualCard[]): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(cards));
    window.localStorage.setItem(SCHEMA_VERSION_KEY, String(SCHEMA_VERSION));
  } catch {
    // The scene must stay usable when browser storage is unavailable.
  }
};

/** Cards on the table; null when nothing was ever stored (first run). */
export const loadActiveCards = (): VisualCard[] | null => {
  const cards = readCards(ACTIVE_CARDS_KEY);
  return cards ? cards.filter((card) => !card.completedAt) : null;
};

export const saveActiveCards = (cards: VisualCard[]): void =>
  writeCards(
    ACTIVE_CARDS_KEY,
    cards.filter((card) => !card.completedAt),
  );

/** Completed cards, newest first. */
export const loadArchivedCards = (): VisualCard[] =>
  (readCards(ARCHIVE_KEY) ?? []).sort(
    (left, right) =>
      new Date(right.completedAt ?? 0).getTime() -
      new Date(left.completedAt ?? 0).getTime(),
  );

export const saveArchivedCards = (cards: VisualCard[]): void =>
  writeCards(ARCHIVE_KEY, cards);
