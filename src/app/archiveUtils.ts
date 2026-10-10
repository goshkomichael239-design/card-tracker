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
  /** Current month in the prepositional case: "октябре". */
  monthName: string;
}

/** Done in the last 7 days, in the current calendar month, and in total. */
export const summarizeArchive = (
  cards: VisualCard[],
  now: number = Date.now(),
): ArchiveSummary => {
  const today = new Date(now);
  const currentMonth = monthKeyOf(today);

  return {
    week: cards.filter((card) => now - completedTime(card) < 7 * DAY_MS).length,
    month: cards.filter(
      (card) => monthKeyOf(new Date(completedTime(card))) === currentMonth,
    ).length,
    total: cards.length,
    monthName: MONTHS_PREPOSITIONAL[today.getMonth()]!,
  };
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
