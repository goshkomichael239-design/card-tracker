import type { TaskListItem, VisualCard } from './cardTheme';

/**
 * Pure operations on cards: no React, no storage, no clock of their own (the
 * moment is always passed in). The app's components decide *when* something
 * happens; the rules of *what happens to the card* live here.
 */

export const createId = (): string => {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const insertAt = <T,>(items: T[], item: T, index: number): T[] => {
  const next = [...items];
  next.splice(Math.max(0, Math.min(index, next.length)), 0, item);
  return next;
};

const completionTime = (card: VisualCard): number =>
  new Date(card.completedAt ?? 0).getTime();

/** Newest completion first. */
export const sortArchive = (cards: VisualCard[]): VisualCard[] =>
  [...cards].sort((left, right) => completionTime(right) - completionTime(left));

/**
 * The card that comes forward after one leaves the deck at `fromIndex`: the
 * next one in order that is not done.
 */
export const pickNeighbourId = (
  list: VisualCard[],
  fromIndex: number,
  excludeId: string,
): string => {
  for (let offset = 1; offset <= list.length; offset += 1) {
    const candidate = list[(fromIndex + offset) % list.length];

    if (candidate && candidate.id !== excludeId && !candidate.completedAt) {
      return candidate.id;
    }
  }

  return '';
};

/**
 * The archive copy of a card that was just completed. A repeating card is a
 * tear-off pad: today's sheet becomes its own archive card (new id, no
 * repeat rule) and the pad itself stays on the table.
 */
export const buildCompletedCard = (
  card: VisualCard,
  completedAt: string,
  newId: string,
): VisualCard =>
  card.recurrence
    ? {
        ...card,
        id: newId,
        completedAt,
        recurrence: undefined,
        postponements: undefined,
      }
    : { ...card, completedAt };

export interface SeriesStepResult {
  card: VisualCard;
  /** The step was the last one: the series is complete. */
  isFinished: boolean;
}

/**
 * Counts one more step of a series. When every step is already counted (a
 * finished series put back on the table), the press just closes it again.
 * Null when the card is not a series.
 */
export const applySeriesStep = (
  card: VisualCard,
  now: Date,
): SeriesStepResult | null => {
  const series = card.kind === 'series' ? card.series : undefined;

  if (!series) {
    return null;
  }

  const nowIso = now.toISOString();

  if (series.entries.length >= series.targetCount) {
    return {
      card: {
        ...card,
        series: { ...series, finishedAt: nowIso, finishReason: 'completed' },
      },
      isFinished: true,
    };
  }

  const anchorTime = new Date(series.timingAnchorAt).getTime();
  const durationMs = Number.isFinite(anchorTime)
    ? Math.max(0, now.getTime() - anchorTime)
    : 0;
  const entries = [...series.entries, { completedAt: nowIso, durationMs }];
  const isFinished = entries.length >= series.targetCount;

  return {
    card: {
      ...card,
      series: {
        ...series,
        entries,
        timingAnchorAt: nowIso,
        ...(isFinished
          ? { finishedAt: nowIso, finishReason: 'completed' as const }
          : {}),
      },
    },
    isFinished,
  };
};

/** "Finish anyway": the series is closed with the steps it has. */
export const finishSeriesByHand = (
  card: VisualCard,
  now: Date,
): VisualCard | null => {
  const series = card.kind === 'series' ? card.series : undefined;

  return series
    ? {
        ...card,
        series: {
          ...series,
          finishedAt: now.toISOString(),
          finishReason: 'manual',
        },
      }
    : null;
};

/** Checks or unchecks one item; the card is returned unchanged otherwise. */
export const toggleListItem = (
  card: VisualCard,
  itemId: string,
  now: Date,
): VisualCard => {
  if (card.kind !== 'list' || !card.list || card.completedAt) {
    return card;
  }

  return {
    ...card,
    list: {
      ...card.list,
      items: card.list.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completedAt: item.completedAt ? undefined : now.toISOString(),
            }
          : item,
      ),
    },
  };
};

export const appendListItem = (
  card: VisualCard,
  item: TaskListItem,
): VisualCard => {
  if (card.kind !== 'list' || !card.list || card.completedAt) {
    return card;
  }

  return { ...card, list: { ...card.list, items: [...card.list.items, item] } };
};

/**
 * Applies an edit made on the card's edit face. Identity-defining fields and
 * completion state always come from the stored card, never from the edit.
 */
export const applyEdit = (
  stored: VisualCard,
  edited: VisualCard,
): VisualCard =>
  stored.completedAt
    ? stored
    : {
        ...edited,
        id: stored.id,
        kind: stored.kind,
        timeMode: stored.timeMode,
        createdAt: stored.createdAt,
        completedAt: undefined,
      };
