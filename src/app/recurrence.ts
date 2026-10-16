import type { RecurrenceRule, VisualCard } from './cardTheme';
import { getLanguage, getLocale, t } from './i18n';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_SHORT = [t('Пн'), t('Вт'), t('Ср'), t('Чт'), t('Пт'), t('Сб'), t('Вс')];
const MAX_LOOKAHEAD_DAYS = 400;

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** 0 = Monday … 6 = Sunday. */
const mondayIndex = (date: Date): number => (date.getDay() + 6) % 7;

const wholeDaysBetween = (from: Date, to: Date): number =>
  Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);

const matchesDay = (rule: RecurrenceRule, day: Date): boolean => {
  switch (rule.kind) {
    case 'daily':
      return true;
    case 'weekdays':
      return mondayIndex(day) < 5;
    case 'weekly':
      return (rule.weekdays ?? []).includes(mondayIndex(day));
    case 'interval':
      // Interval rules are counted from an anchor; see nextOccurrence.
      return true;
  }
};

const withTime = (day: Date, hours: number, minutes: number): Date =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);

/**
 * The first occurrence for a new repeating card at the given time of day:
 * today if the rule allows today and that time is still ahead, otherwise the
 * next allowed day.
 */
export const firstOccurrence = (
  rule: RecurrenceRule,
  hours: number,
  minutes: number,
  now: Date = new Date(),
): Date => {
  const today = startOfDay(now);

  for (let offset = 0; offset < MAX_LOOKAHEAD_DAYS; offset += 1) {
    const day = addDays(today, offset);
    const candidate = withTime(day, hours, minutes);

    if (candidate.getTime() > now.getTime() && matchesDay(rule, day)) {
      return candidate;
    }
  }

  return withTime(addDays(today, 1), hours, minutes);
};

/**
 * The occurrence after `current`, at the same time of day. Days missed in
 * between are skipped: the next one is never earlier than tomorrow.
 */
export const nextOccurrence = (
  rule: RecurrenceRule,
  current: Date,
  now: Date = new Date(),
): Date => {
  const hours = current.getHours();
  const minutes = current.getMinutes();
  const today = startOfDay(now);
  const from = current.getTime() > today.getTime() ? startOfDay(current) : today;

  if (rule.kind === 'interval') {
    const step = Math.max(1, rule.intervalDays ?? 1);
    let day = addDays(startOfDay(current), step);

    while (day.getTime() <= from.getTime()) {
      day = addDays(day, step);
    }

    return withTime(day, hours, minutes);
  }

  for (let offset = 1; offset < MAX_LOOKAHEAD_DAYS; offset += 1) {
    const day = addDays(from, offset);

    if (matchesDay(rule, day)) {
      return withTime(day, hours, minutes);
    }
  }

  return withTime(addDays(from, 1), hours, minutes);
};

/** The repeating card as it looks after this occurrence was torn off. */
export const advanceRecurringCard = (
  card: VisualCard,
  now: Date = new Date(),
): VisualCard => {
  if (!card.recurrence || !card.reminderAt) {
    return card;
  }

  return {
    ...card,
    reminderAt: nextOccurrence(card.recurrence, new Date(card.reminderAt), now).toISOString(),
    // A fresh sheet: the stamps belonged to the one that was torn off.
    postponements: undefined,
  };
};

/**
 * A future sheet cannot be torn off yet: only today's (or a missed earlier
 * one) is available.
 */
export const isOccurrenceAvailable = (
  card: VisualCard,
  now: Date = new Date(),
): boolean =>
  !card.recurrence ||
  !card.reminderAt ||
  wholeDaysBetween(now, new Date(card.reminderAt)) <= 0;

/** "Каждый день", "По будням", "Пн, Ср, Пт", "Раз в 3 дня". */
export const describeRecurrence = (rule: RecurrenceRule): string => {
  switch (rule.kind) {
    case 'daily':
      return t('Каждый день');
    case 'weekdays':
      return t('По будням');
    case 'weekly':
      return [...(rule.weekdays ?? [])]
        .sort((a, b) => a - b)
        .map((day) => WEEKDAY_SHORT[day])
        .join(', ');
    case 'interval': {
      const n = rule.intervalDays ?? 1;

      if (n === 1) {
        return t('Каждый день');
      }

      if (getLanguage() === 'en') {
        return `Every ${n} days`;
      }

      const mod10 = n % 10;
      const mod100 = n % 100;
      const word =
        mod10 === 1 && mod100 !== 11
          ? 'день'
          : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
            ? 'дня'
            : 'дней';

      return `Раз в ${n} ${word}`;
    }
  }
};

/** "Завтра" or "Пн, 12 окт" — when the next sheet can be torn off. */
export const describeNextSheet = (
  iso: string,
  now: Date = new Date(),
): string => {
  const date = new Date(iso);

  if (wholeDaysBetween(now, date) === 1) {
    return t('Завтра');
  }

  const day = new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short' })
    .format(date)
    .replace('.', '');

  return `${WEEKDAY_SHORT[mondayIndex(date)]}, ${day}`;
};

export const WEEKDAY_LABELS = WEEKDAY_SHORT;

/** A rule is ready once a weekly one has at least one day picked. */
export const isRecurrenceComplete = (rule: RecurrenceRule | null): boolean =>
  rule !== null &&
  (rule.kind !== 'weekly' || (rule.weekdays?.length ?? 0) > 0);
