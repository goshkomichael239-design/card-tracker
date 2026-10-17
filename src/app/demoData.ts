import { useSyncExternalStore } from 'react';

import { createDemoSet, isDemoId } from './demoCards';
import {
  getDeckState,
  setActiveDeckId,
  setArchivedCards,
  setCards,
  setDecks,
  setTrash,
  useDeckStore,
} from './deckStore';
import { DEFAULT_DECK_ID, MAX_DECKS } from './decks';

/**
 * The test set (two decks and neutral cards of every kind) can be added from
 * the settings and removed again: everything it makes has an id with a
 * "demo-" start, so removing never touches the user's own cards.
 */

const hasDemo = (): boolean => {
  const { cards, archivedCards, trash, decks } = getDeckState();

  return (
    cards.some((card) => isDemoId(card.id)) ||
    archivedCards.some((card) => isDemoId(card.id)) ||
    trash.some((entry) => isDemoId(entry.card.id)) ||
    decks.some((deck) => isDemoId(deck.id))
  );
};

export const useHasDemoData = (): boolean =>
  useSyncExternalStore(
    (listener) => useDeckStore.subscribe(listener),
    hasDemo,
    hasDemo,
  );

/** Adds the test set (in the language of the app); the decks that fit. */
export const addDemoData = (): void => {
  if (hasDemo()) {
    return;
  }

  const set = createDemoSet();
  const { decks } = getDeckState();
  const newDecks = set.decks.slice(0, Math.max(0, MAX_DECKS - decks.length));
  const deckIds = new Set(newDecks.map((deck) => deck.id));
  // The cards of the base deck have no deck; the others go with their decks.
  const newCards = set.cards.filter(
    (card) => !card.deckId || deckIds.has(card.deckId),
  );

  setDecks((previous) => [...previous, ...newDecks]);
  setCards((previous) => [...previous, ...newCards]);
};

/** Removes the test set: its cards (on the table, archived, in the bin) and decks. */
export const removeDemoData = (): void => {
  setCards((previous) => previous.filter((card) => !isDemoId(card.id)));
  setArchivedCards((previous) =>
    previous.filter((card) => !isDemoId(card.id)),
  );
  setTrash((previous) =>
    previous.filter((entry) => !isDemoId(entry.card.id)),
  );

  if (isDemoId(getDeckState().activeDeckId)) {
    setActiveDeckId(DEFAULT_DECK_ID);
  }

  setDecks((previous) => previous.filter((deck) => !isDemoId(deck.id)));
};
