import type { CardKind, VisualCard } from './cardTheme';
import { MONTH_NAMES_RU } from './dateTimeUtils';

export type ArchiveKindFilter = 'all' | CardKind;

export interface ArchiveMonth {
  /** "2026-10" — stable key and anchor for the month divider. */
  key: string;
  label: string;
  cards: VisualCard[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** "в октябре", "в мае" … */
const MONTHS_PREPOSITIONAL = [
  'январе',
  'феврале',
  'марте',
  'апреле',
  'мае',
  'июне',
  'июле',
  'августе',
  'сентябре',
  'октябре',
  'ноябре',
  'декабре',
];

const completedTime = (card: VisualCard): number =>
  card.completedAt ? new Date(card.completedAt).getTime() : 0;

const monthKeyOf = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/** Newest first, one group per calendar month of completion. */
export const groupArchiveByMonth = (cards: VisualCard[]): ArchiveMonth[] => {
  const groups = new Map<string, ArchiveMonth>();

  for (const card of [...cards].sort((a, b) => completedTime(b) - completedTime(a))) {
    const date = new Date(completedTime(card));
    const key = monthKeyOf(date);
    let group = groups.get(key);

    if (!group) {
      group = {
        key,
        label: `${MONTH_NAMES_RU[date.getMonth()]} ${date.getFullYear()}`,
        cards: [],
      };
      groups.set(key, group);
    }

    group.cards.push(card);
  }

  return [...groups.values()];
};

/** The text a card is found by: its title, and the items of a list. */
const searchableText = (card: VisualCard): string =>
  [card.title, ...(card.list?.items.map((item) => item.text) ?? [])]
    .join(' ')
    .toLocaleLowerCase('ru-RU');

export const filterArchive = (
  cards: VisualCard[],
  query: string,
  kind: ArchiveKindFilter,
): VisualCard[] => {
  const needle = query.trim().toLocaleLowerCase('ru-RU');

  return cards.filter(
    (card) =>
      (kind === 'all' || card.kind === kind) &&
      (!needle || searchableText(card).includes(needle)),
  );
};

export interface ArchiveSummary {
  week: number;
  month: number;
  total: number;
  /** Consecutive active days up to today (see countCurrentStreak). */
  streak: number;
  /** Current month in the prepositional case: "октябре". */
  monthName: string;
}

/** Done in the last 7 days, in the current calendar month, and in total. */
export const summarizeArchive = (
  cards: VisualCard[],
  liveCards: VisualCard[],
  now: number = Date.now(),
): ArchiveSummary => {
  const today = new Date(now);
  const currentMonth = monthKeyOf(today);

  return {
    streak: countCurrentStreak(
      collectActivityDays([...cards, ...liveCards]),
      now,
    ),
    week: cards.filter((card) => now - completedTime(card) < 7 * DAY_MS).length,
    month: cards.filter(
      (card) => monthKeyOf(new Date(completedTime(card))) === currentMonth,
    ).length,
    total: cards.length,
    monthName: MONTHS_PREPOSITIONAL[today.getMonth()]!,
  };
};

const localDayKey = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const dayKeyOf = (iso?: string): string | null => {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? localDayKey(date) : null;
};

/**
 * Days on which something was done: a card completed, a series step counted
 * or a list item checked, on live and archived cards alike.
 */
export const collectActivityDays = (cards: VisualCard[]): Set<string> => {
  const days = new Set<string>();
  const add = (iso?: string) => {
    const key = dayKeyOf(iso);

    if (key) {
      days.add(key);
    }
  };

  for (const card of cards) {
    add(card.completedAt);
    card.series?.entries.forEach((entry) => add(entry.completedAt));
    card.list?.items.forEach((item) => add(item.completedAt));
  }

  return days;
};

/**
 * Consecutive days with activity up to today. A streak is still alive during
 * the day after its last active day, so it counts from yesterday if today is
 * still empty.
 */
export const countCurrentStreak = (
  days: Set<string>,
  now: number = Date.now(),
): number => {
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);

  if (!days.has(localDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;

  while (days.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

/** The longest run of consecutive days among the given dates. */
export const longestDailyStreak = (isoDates: string[]): number => {
  const days = [
    ...new Set(
      isoDates
        .map((iso) => new Date(iso))
        .filter((date) => Number.isFinite(date.getTime()))
        .map((date) =>
          new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(),
        ),
    ),
  ].sort((a, b) => a - b);

  let best = 0;
  let run = 0;
  let previous: number | null = null;

  for (const day of days) {
    // Round to whole days so daylight-saving shifts do not break a run.
    run =
      previous !== null && Math.round((day - previous) / DAY_MS) === 1
        ? run + 1
        : 1;
    best = Math.max(best, run);
    previous = day;
  }

  return best;
};

export const pluralDays = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return 'день';
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'дня';
  }

  return 'дней';
};

/** "8 окт, 14:20" */
export const formatArchiveMoment = (iso: string): string => {
  const date = new Date(iso);
  const day = formatArchiveDay(iso);
  const time = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return `${day}, ${time}`;
};

/**
 * A completed card made live again (to go back on the table or into the bin):
 * the completion mark goes, and a series loses its "finished" mark.
 */
export const reviveCard = (card: VisualCard): VisualCard => {
  const revived: VisualCard = { ...card, completedAt: undefined };

  if (revived.series) {
    revived.series = {
      ...revived.series,
      finishedAt: undefined,
      finishReason: undefined,
    };
  }

  return revived;
};

/** "12 окт" */
export const formatArchiveDay = (iso?: string): string => {
  if (!iso) {
    return '';
  }

  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
    .format(new Date(iso))
    .replace('.', '');
};

export const pluralCards = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return 'карточка';
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'карточки';
  }

  return 'карточек';
};
