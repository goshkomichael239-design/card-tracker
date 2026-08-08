import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CardType = 'SINGLE' | 'BATCH' | 'CHECKLIST' | 'TIMER';
export type CardStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface CheckItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskCard {
  id: string;
  title: string;
  type: CardType;
  status: CardStatus;
  createdAt: number;
  completedAt: number | null;
  accumulatedTime: number;
  startedAtTimestamp: number | null;
  batchTotal?: number;
  batchCompleted?: number;
  batchLapAccumulated?: number;
  batchLapStartedAt?: number | null;
  targetTime?: number;
  checklist?: CheckItem[];
}

export const getElapsedTime = (card: TaskCard): number => {
  if (card.status === 'running' && card.startedAtTimestamp) {
    return card.accumulatedTime + (Date.now() - card.startedAtTimestamp);
  }
  return card.accumulatedTime;
};

export const getBatchLapTime = (card: TaskCard): number => {
  if (card.type !== 'BATCH') return 0;
  if (card.status === 'running' && card.batchLapStartedAt) {
    return (card.batchLapAccumulated || 0) + (Date.now() - card.batchLapStartedAt);
  }
  return card.batchLapAccumulated || 0;
};

const getTodayString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export interface DeckState {
  deck: TaskCard[];
  currentCard: TaskCard | null;
  incubator: TaskCard[];
  museumToday: TaskCard[];
  history: Record<string, TaskCard[]>;
  addCardToDeck: (card: TaskCard) => void;
  drawCard: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  tick: () => void;
  shelveCard: () => void;
  unshelveCard: (id: string) => void;
  completeCard: () => void;
  toggleCheckItem: (itemId: string) => void;
  completeBatchLap: () => void;
  getTodayString: () => string;
}

export const useDeckStore = create<DeckState>()(
  persist(
    (set) => ({
      deck: [],
      currentCard: null,
      incubator: [],
      museumToday: [],
      history: {},

      addCardToDeck: (card) =>
        set((state) => {
          if (!state.currentCard) {
            return { currentCard: card };
          }
          return { deck: [...state.deck, card] };
        }),

      drawCard: () =>
        set((state) => {
          if (state.deck.length === 0) return state;
          const [nextCard, ...remainingDeck] = state.deck;
          const updatedDeck = state.currentCard
            ? [
                ...remainingDeck,
                {
                  ...state.currentCard,
                  status: 'idle' as CardStatus,
                  accumulatedTime: 0,
                  startedAtTimestamp: null,
                  batchLapAccumulated: 0,
                  batchLapStartedAt: null,
                },
              ]
            : remainingDeck;
          return {
            currentCard: nextCard,
            deck: updatedDeck,
          };
        }),

      startTimer: () =>
        set((state) => {
          if (!state.currentCard) return state;
          const card = state.currentCard;
          const now = Date.now();
          if (
            card.type === 'BATCH' &&
            card.batchLapStartedAt === null &&
            (card.batchLapAccumulated === undefined || card.batchLapAccumulated === 0)
          ) {
            return {
              currentCard: {
                ...card,
                status: 'running',
                startedAtTimestamp: now,
                batchLapStartedAt: now,
              },
            };
          }
          return {
            currentCard: {
              ...card,
              status: 'running',
              startedAtTimestamp: now,
            },
          };
        }),

      pauseTimer: () =>
        set((state) => {
          if (!state.currentCard || state.currentCard.status !== 'running') return state;
          const card = state.currentCard;
          const now = Date.now();
          const additionalTime = card.startedAtTimestamp ? now - card.startedAtTimestamp : 0;
          const updates: Partial<TaskCard> = {
            status: 'paused',
            accumulatedTime: card.accumulatedTime + additionalTime,
            startedAtTimestamp: null,
          };
          if (card.type === 'BATCH' && card.batchLapStartedAt) {
            updates.batchLapAccumulated = (card.batchLapAccumulated || 0) + (now - card.batchLapStartedAt);
            updates.batchLapStartedAt = null;
          }
          return { currentCard: { ...card, ...updates } as TaskCard };
        }),

      tick: () =>
        set((state) => {
          if (!state.currentCard || state.currentCard.status !== 'running') return state;
          return { currentCard: { ...state.currentCard } };
        }),

      shelveCard: () =>
        set((state) => {
          if (!state.currentCard) return state;
          const shelvedCard: TaskCard = {
            ...state.currentCard,
            status: 'idle',
            accumulatedTime: 0,
            startedAtTimestamp: null,
            batchLapAccumulated: 0,
            batchLapStartedAt: null,
          };
          return {
            currentCard: null,
            incubator: [...state.incubator, shelvedCard],
          };
        }),

      unshelveCard: (id) =>
        set((state) => {
          const cardIndex = state.incubator.findIndex((c) => c.id === id);
          if (cardIndex === -1) return state;
          const card = state.incubator[cardIndex];
          const newIncubator = [...state.incubator];
          newIncubator.splice(cardIndex, 1);
          if (!state.currentCard) {
            return { currentCard: card, incubator: newIncubator };
          }
          return { deck: [...state.deck, card], incubator: newIncubator };
        }),

      completeCard: () =>
        set((state) => {
          if (!state.currentCard) return state;
          const today = getTodayString();
          const finalElapsed = getElapsedTime(state.currentCard);
          const completedCard: TaskCard = {
            ...state.currentCard,
            status: 'completed',
            accumulatedTime: finalElapsed,
            startedAtTimestamp: null,
            batchLapStartedAt: null,
            completedAt: Date.now(),
          };
          return {
            currentCard: null,
            museumToday: [...state.museumToday, completedCard],
            history: {
              ...state.history,
              [today]: [...(state.history[today] || []), completedCard],
            },
          };
        }),

      toggleCheckItem: (itemId) =>
        set((state) => {
          if (!state.currentCard?.checklist) return state;
          return {
            currentCard: {
              ...state.currentCard,
              checklist: state.currentCard.checklist.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item
              ),
            },
          };
        }),

      completeBatchLap: () =>
        set((state) => {
          if (!state.currentCard || state.currentCard.type !== 'BATCH') return state;
          const card = state.currentCard;
          const now = Date.now();
          return {
            currentCard: {
              ...card,
              batchCompleted: (card.batchCompleted || 0) + 1,
              batchLapAccumulated: 0,
              batchLapStartedAt: card.status === 'running' ? now : null,
            },
          };
        }),

      getTodayString,
    }),
    {
      name: 'task-deck-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        deck: state.deck,
        currentCard: state.currentCard,
        incubator: state.incubator,
        museumToday: state.museumToday,
        history: state.history,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Ошибка гидратации стора:', error);
            return;
          }
          if (state) {
            if (state.currentCard && state.currentCard.status === 'running') {
              state.currentCard.status = 'paused';
              if (state.currentCard.startedAtTimestamp) {
                const elapsed = Date.now() - state.currentCard.startedAtTimestamp;
                state.currentCard.accumulatedTime += elapsed;
              }
              state.currentCard.startedAtTimestamp = null;
              if (state.currentCard.batchLapStartedAt) {
                const lapElapsed = Date.now() - state.currentCard.batchLapStartedAt;
                state.currentCard.batchLapAccumulated = (state.currentCard.batchLapAccumulated || 0) + lapElapsed;
                state.currentCard.batchLapStartedAt = null;
              }
              useDeckStore.setState({
                currentCard: state.currentCard,
              });
            }
          }
        };
      },
    }
  )
);