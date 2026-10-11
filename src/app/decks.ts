import { createId } from './cardOps';
import type { VisualCard } from './cardTheme';
import { readValue, writeValue } from './storage/kv';

/**
 * Decks. There is always the base one ("По умолчанию"), which is not made and
 * cannot be removed; the person can add up to four more. Every card lies in
 * one deck; a card that names no deck (or one that is gone) is in the base one.
 */
export interface Deck {
  id: string;
  name: string;
  /** Which back it has (see deckBacks.ts). */
  backId: string;
}

export interface DecksState {
  decks: Deck[];
  activeDeckId: string;
}

export const DEFAULT_DECK_ID = 'default';
export const DEFAULT_DECK_NAME = 'По умолчанию';
export const MAX_DECKS = 5;
export const MAX_DECK_NAME_LENGTH = 16;

const DECKS_KEY = 'card-tracker.decks.v1';

const baseDeck = (backId = 'plain'): Deck => ({
  id: DEFAULT_DECK_ID,
  name: DEFAULT_DECK_NAME,
  backId,
});

const isDeck = (value: unknown): value is Deck => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const deck = value as Record<string, unknown>;

  return (
    typeof deck.id === 'string' &&
    deck.id !== '' &&
    typeof deck.name === 'string' &&
    typeof deck.backId === 'string'
  );
};

/** The saved decks, always with the base one first and at most MAX_DECKS. */
export const normalizeDecks = (value: unknown): Deck[] => {
  const stored = Array.isArray(value) ? value.filter(isDeck) : [];
  const saved = stored.find((deck) => deck.id === DEFAULT_DECK_ID);
  const others = stored
    .filter((deck) => deck.id !== DEFAULT_DECK_ID)
    .map((deck) => ({
      ...deck,
      name: deck.name.trim().slice(0, MAX_DECK_NAME_LENGTH) || 'Колода',
    }));

  return [baseDeck(saved?.backId), ...others].slice(0, MAX_DECKS);
};

export const loadDecksState = (): DecksState => {
  const stored = readValue<unknown>(DECKS_KEY);
  const record =
    stored && typeof stored === 'object'
      ? (stored as Record<string, unknown>)
      : {};
  const decks = normalizeDecks(record.decks);
  const activeDeckId =
    typeof record.activeDeckId === 'string' &&
    decks.some((deck) => deck.id === record.activeDeckId)
      ? record.activeDeckId
      : DEFAULT_DECK_ID;

  return { decks, activeDeckId };
};

export const saveDecksState = (state: DecksState): void =>
  writeValue(DECKS_KEY, state);

export const createDeck = (name: string, backId: string): Deck => ({
  id: createId(),
  name: name.trim().slice(0, MAX_DECK_NAME_LENGTH) || 'Колода',
  backId,
});

/** The deck a card lies in (the base one when it names none that exists). */
export const getCardDeckId = (card: VisualCard, decks: Deck[]): string =>
  card.deckId && decks.some((deck) => deck.id === card.deckId)
    ? card.deckId
    : DEFAULT_DECK_ID;
