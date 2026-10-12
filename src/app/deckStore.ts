import { create } from 'zustand';

import { createAutoBackup } from './storage/autoBackup';
import type { TimeMode, VisualCard } from './cardTheme';
import { createId, pinnedFirst } from './cardOps';
import { createDemoSet } from './demoCards';

/**
 * A first run starts with the test set: three decks and a hundred varied
 * cards (set false for a single card).
 */
const SHOW_DEMO_DECK = true;
import {
  loadActiveCards,
  loadArchivedCards,
  saveActiveCards,
  saveArchivedCards,
} from './persistence';
import { loadTrash, saveTrash, type TrashedCard } from './trash';
import {
  DEFAULT_DECK_ID,
  loadDecksState,
  MAX_DECKS,
  saveDecksState,
  type Deck,
} from './decks';

/**
 * The data layer: the cards on the table, the archive and the bin.
 *
 * It lives outside React, so any code can read the *current* state with
 * `getDeckState()` (no stale copies in refs), and saving is a subscription
 * here instead of an effect in a component. Importing this module reads the
 * storage, so `initStorage()` must have finished before it is first imported.
 */

type Updater<T> = T | ((previous: T) => T);

export interface DeckState {
  cards: VisualCard[];
  archivedCards: VisualCard[];
  trash: TrashedCard[];
  /** The decks (the base one first) and which of them lies on the table. */
  decks: Deck[];
  activeDeckId: string;
  setDecks: (next: Updater<Deck[]>) => void;
  setActiveDeckId: (id: string) => void;
  setCards: (next: Updater<VisualCard[]>) => void;
  setArchivedCards: (next: Updater<VisualCard[]>) => void;
  setTrash: (next: Updater<TrashedCard[]>) => void;
}

const resolve = <T,>(next: Updater<T>, previous: T): T =>
  typeof next === 'function' ? (next as (value: T) => T)(previous) : next;

const DAY_MS = 24 * 60 * 60 * 1000;

/** What a first run (nothing stored) starts with, besides the demo set. */
const createFirstRunCards = (): VisualCard[] => {
  if (!import.meta.env.DEV) {
    return [
      {
        id: createId(),
        title: 'Моя первая карточка',
        kind: 'single',
        timeMode: 'none',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  const now = Date.now();
  const seeds: Array<{ title: string; timeMode: TimeMode }> = [
    { title: 'Хлеб', timeMode: 'none' },
    { title: 'Абсолютное безумие', timeMode: 'none' },
    { title: 'Мама мыла раму', timeMode: 'deadline' },
    { title: 'Рыба в воде', timeMode: 'reminder' },
    { title: 'Кленовый сироп', timeMode: 'deadline' },
    { title: 'Продумать движение новой карточки', timeMode: 'reminder' },
    {
      title:
        'Очень длинное название карточки для проверки обрезания текста в переключателе',
      timeMode: 'none',
    },
  ];

  return seeds.map((seed, index) => {
    const targetAt = new Date(now + (index + 1) * DAY_MS).toISOString();

    return {
      id: createId(),
      title: seed.title,
      kind: 'single',
      timeMode: seed.timeMode,
      deadlineAt: seed.timeMode === 'deadline' ? targetAt : undefined,
      reminderAt: seed.timeMode === 'reminder' ? targetAt : undefined,
      createdAt: new Date(now - index * 60 * 1000).toISOString(),
    };
  });
};

const storedCards = loadActiveCards();
// A first run (no cards stored) gets the whole test set: its decks and cards.
const demoSet =
  storedCards === null && SHOW_DEMO_DECK ? createDemoSet() : null;
const storedDecks = loadDecksState();
const initialDecks = demoSet
  ? {
      decks: [...storedDecks.decks, ...demoSet.decks].slice(0, MAX_DECKS),
      activeDeckId: DEFAULT_DECK_ID,
    }
  : storedDecks;

export const useDeckStore = create<DeckState>((set) => ({
  decks: initialDecks.decks,
  activeDeckId: initialDecks.activeDeckId,
  setDecks: (next) =>
    set((state) => {
      const decks = resolve(next, state.decks);
      return decks === state.decks ? state : { decks };
    }),
  setActiveDeckId: (activeDeckId) =>
    set((state) =>
      activeDeckId === state.activeDeckId ? state : { activeDeckId },
    ),
  cards: storedCards ?? demoSet?.cards ?? createFirstRunCards(),
  archivedCards: loadArchivedCards(),
  trash: loadTrash(),
  // Whatever changes the deck, pinned cards stay at its head.
  setCards: (next) =>
    set((state) => {
      const cards = pinnedFirst(resolve(next, state.cards));
      return cards === state.cards ? state : { cards };
    }),
  setArchivedCards: (next) =>
    set((state) => {
      const archivedCards = resolve(next, state.archivedCards);
      return archivedCards === state.archivedCards ? state : { archivedCards };
    }),
  setTrash: (next) =>
    set((state) => {
      const trash = resolve(next, state.trash);
      return trash === state.trash ? state : { trash };
    }),
}));

export const getDeckState = (): DeckState => useDeckStore.getState();

/** Stable setters (they never change), usable straight from any code. */
export const {
  setCards,
  setArchivedCards,
  setTrash,
  setDecks,
  setActiveDeckId,
} = useDeckStore.getState();

// Saving and safety copies follow the data, wherever it is changed from.
const autoBackup = createAutoBackup(() => {
  const { cards, archivedCards, trash, decks } = getDeckState();
  return { cards, archive: archivedCards, trash, decks };
});

export const snapshotBeforeImport = (): void =>
  autoBackup.snapshotBefore('before-import');

useDeckStore.subscribe((state, previous) => {
  let changed = false;

  if (state.cards !== previous.cards) {
    saveActiveCards(state.cards);
    changed = true;
  }

  if (state.archivedCards !== previous.archivedCards) {
    saveArchivedCards(state.archivedCards);
    changed = true;
  }

  if (state.trash !== previous.trash) {
    saveTrash(state.trash);
    changed = true;
  }

  if (
    state.decks !== previous.decks ||
    state.activeDeckId !== previous.activeDeckId
  ) {
    saveDecksState({ decks: state.decks, activeDeckId: state.activeDeckId });
    changed = state.decks !== previous.decks || changed;
  }

  if (changed) {
    autoBackup.noteChange();
  }
});

// A first run stores its starting cards at once, and every start leaves one
// snapshot of what was loaded (before anything is changed).
{
  const { cards, archivedCards, trash, decks, activeDeckId } = getDeckState();

  if (demoSet) {
    saveDecksState({ decks, activeDeckId });
  }

  saveActiveCards(cards);
  saveArchivedCards(archivedCards);
  saveTrash(trash);
  autoBackup.start();
}
