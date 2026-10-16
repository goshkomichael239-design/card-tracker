import type { CardKind, VisualCard } from './cardTheme';
import { MONTH_NAMES_RU } from './dateTimeUtils';
import { getLanguage, getLocale, t } from './i18n';

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
  t('январе'),
  t('феврале'),
  t('марте'),
  t('апреле'),
  t('мае'),
  t('июне'),
  t('июле'),
  t('августе'),
  t('сентябре'),
  t('октябре'),
  t('ноябре'),
  t('декабре'),
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

// Heights of the catalogue pieces, as drawn in App.css (.archive-edge,
// .archive-divider): the first edge of a month is whole, the next ones overlap.
const EDGES_PADDING = 6;
const FIRST_EDGE_HEIGHT = 52;
const NEXT_EDGE_PITCH = 41;
const DIVIDER_FIRST_ON_PAGE = 48;
const DIVIDER_HEIGHT = 56;
const MIN_CARDS_PER_PAGE = 2;

/**
 * Cuts the months into pages that each fit `budget` pixels without scrolling.
 * A month that runs over the page edge carries on, under its divider again, on
 * the next page. A page always holds at least a few cards, whatever the budget.
 */
export const paginateArchive = (
  months: ArchiveMonth[],
  budget: number,
): ArchiveMonth[][] => {
  const pages: ArchiveMonth[][] = [];
  let page: ArchiveMonth[] = [];
  let height = 0;
  let count = 0;

  const flush = () => {
    if (page.length > 0) {
      pages.push(page);
    }
    page = [];
    height = 0;
    count = 0;
  };

  for (const month of months) {
    let group: ArchiveMonth | null = null;

    for (const card of month.cards) {
      const startsGroup = group === null;
      const cost = startsGroup
        ? (page.length === 0 ? DIVIDER_FIRST_ON_PAGE : DIVIDER_HEIGHT) +
          FIRST_EDGE_HEIGHT
        : NEXT_EDGE_PITCH;

      if (count >= MIN_CARDS_PER_PAGE && height + cost > budget) {
        flush();
        group = null;
      }

      if (group === null) {
        group = { ...month, cards: [] };
        page.push(group);
        height += (page.length === 1 ? DIVIDER_FIRST_ON_PAGE : DIVIDER_HEIGHT) +
          FIRST_EDGE_HEIGHT +
          (height === 0 ? EDGES_PADDING : 0);
      } else {
        height += NEXT_EDGE_PITCH;
      }

      group.cards.push(card);
      count += 1;
    }
  }

  flush();

  return pages;
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

  if (getLanguage() === 'en') {
    return count === 1 ? 'day' : 'days';
  }

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
  const time = new Intl.DateTimeFormat(getLocale(), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return `${day}, ${time}`;
};

/**
 * A completed card made live again (to go back on the table or into the bin):
 * the completion mark goes, and a series loses its "finished" mark and times
 * its next step from now rather than from its last step long ago.
 */
export const reviveCard = (
  card: VisualCard,
  now: Date = new Date(),
): VisualCard => {
  const revived: VisualCard = { ...card, completedAt: undefined };

  if (revived.series) {
    revived.series = {
      ...revived.series,
      finishedAt: undefined,
      finishReason: undefined,
      timingAnchorAt: now.toISOString(),
    };
  }

  return revived;
};

/** "12 окт" */
export const formatArchiveDay = (iso?: string): string => {
  if (!iso) {
    return '';
  }

  return new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short' })
    .format(new Date(iso))
    .replace('.', '');
};

export const pluralCards = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (getLanguage() === 'en') {
    return count === 1 ? 'card' : 'cards';
  }

  if (mod10 === 1 && mod100 !== 11) {
    return 'карточка';
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'карточки';
  }

  return 'карточек';
};
