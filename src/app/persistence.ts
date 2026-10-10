import type { VisualCard } from './cardTheme';
import { isStoredVisualCard, sanitizeStoredCard } from './cardValidation';
import { readValue, writeValue } from './storage/kv';

/**
 * Version of what is kept in storage.
 * 1 — cards, archive, bin (no version mark was written).
 * 2 — cards may carry postponements and a repeat rule.
 * Every load passes through `migrate`, so older data keeps working.
 */
export const SCHEMA_VERSION = 2;

const SCHEMA_VERSION_KEY = 'card-tracker.schema-version';
const ACTIVE_CARDS_KEY = 'card-tracker.active-cards.v1';
const ARCHIVE_KEY = 'card-tracker.archive.v1';
const CORNER_HINT_KEY = 'card-tracker.corner-hint-dismissed.v1';
const QUARANTINE_KEY = 'card-tracker.quarantine.v1';
const QUARANTINE_LIMIT = 50;

interface QuarantineEntry {
  at: string;
  source: string;
  items: unknown[];
}

/**
 * Stored items that failed validation are not simply thrown away (the next
 * save would erase them for good): they are set aside here, so a bug in the
 * validator or a future format never costs the user a card.
 */
export const quarantine = (source: string, items: unknown[]): void => {
  if (items.length === 0) {
    return;
  }

  const previous = readValue<QuarantineEntry[]>(QUARANTINE_KEY) ?? [];

  writeValue(
    QUARANTINE_KEY,
    [...previous, { at: new Date().toISOString(), source, items }].slice(
      -QUARANTINE_LIMIT,
    ),
  );
};

const readStoredVersion = (): number => {
  const stored = Number(readValue<number>(SCHEMA_VERSION_KEY));
  return Number.isInteger(stored) && stored >= 1 ? stored : 1;
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
  const stored = readValue<unknown>(key);

  if (stored === undefined) {
    return null;
  }

  if (!Array.isArray(stored)) {
    quarantine(key, [stored]);
    return null;
  }

  const valid = stored.filter(isStoredVisualCard);

  if (valid.length !== stored.length) {
    quarantine(
      key,
      stored.filter((item) => !isStoredVisualCard(item)),
    );
  }

  return migrate(valid, readStoredVersion());
};

const writeCards = (key: string, cards: VisualCard[]): void => {
  writeValue(key, cards);
  writeValue(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
};

const byCompletionNewestFirst = (left: VisualCard, right: VisualCard) =>
  new Date(right.completedAt ?? 0).getTime() -
  new Date(left.completedAt ?? 0).getTime();

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
  (readCards(ARCHIVE_KEY) ?? []).sort(byCompletionNewestFirst);

export const saveArchivedCards = (cards: VisualCard[]): void =>
  writeCards(ARCHIVE_KEY, cards);

export const loadCornerHintDismissed = (): boolean => {
  const stored = readValue<unknown>(CORNER_HINT_KEY);
  return stored === true || stored === 1 || stored === '1';
};

export const saveCornerHintDismissed = (): void =>
  writeValue(CORNER_HINT_KEY, true);
