import type { VisualCard } from './cardTheme';
import { getLocale, t } from './i18n';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const FIVE_MINUTES = 5 * MINUTE;

/**
 * The moment a card is "due": its deadline or reminder, or for a card without
 * its own time, the day it was put off to.
 */
export const getCardTargetAt = (card: VisualCard): string | undefined =>
  card.timeMode === 'deadline'
    ? card.deadlineAt
    : card.timeMode === 'reminder'
      ? card.reminderAt
      : card.postponedUntil;

/**
 * Puts a card off until `until`: a deadline or reminder moves; a card without
 * its own time remembers the day. Every time leaves a stamp in `postponements`.
 */
export const postponeCard = (
  card: VisualCard,
  until: Date,
  now: Date = new Date(),
): VisualCard => {
  const untilIso = until.toISOString();
  const next: VisualCard = {
    ...card,
    postponements: [
      ...(card.postponements ?? []),
      { at: now.toISOString(), until: untilIso },
    ],
  };

  if (card.timeMode === 'deadline') {
    next.deadlineAt = untilIso;
  } else if (card.timeMode === 'reminder') {
    next.reminderAt = untilIso;
  } else {
    next.postponedUntil = untilIso;
  }

  return next;
};

const atTime = (base: Date, dayOffset: number, hour: number, minute = 0): Date =>
  new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + dayOffset,
    hour,
    minute,
  );

export interface PostponePreset {
  id: string;
  label: string;
  until: Date;
}

/**
 * Ready-made "put off" choices: in an hour, this evening (while it is still
 * ahead), tomorrow morning, next Monday morning, in a week.
 */
export const getPostponePresets = (now: Date = new Date()): PostponePreset[] => {
  const inAnHour = new Date(
    Math.ceil((now.getTime() + HOUR) / FIVE_MINUTES) * FIVE_MINUTES,
  );
  const evening = atTime(now, 0, 19);
  const daysToMonday = ((8 - now.getDay()) % 7) || 7;
  const presets: PostponePreset[] = [
    { id: 'hour', label: t('Через час'), until: inAnHour },
  ];

  if (evening.getTime() - now.getTime() > 2 * HOUR) {
    presets.push({ id: 'evening', label: t('Вечером'), until: evening });
  }

  presets.push(
    { id: 'tomorrow', label: t('Завтра утром'), until: atTime(now, 1, 9) },
    { id: 'monday', label: t('В понедельник'), until: atTime(now, daysToMonday, 9) },
    { id: 'week', label: t('Через неделю'), until: atTime(now, 7, 9) },
  );

  return presets;
};

/** "11 окт, 09:00", or "сегодня, 19:00" / "завтра, 09:00". */
export const formatPostponeMoment = (date: Date, now: Date = new Date()): string => {
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(date) - startOfDay(now)) / (24 * HOUR));
  const time = new Intl.DateTimeFormat(getLocale(), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  if (dayDiff === 0) {
    return t('сегодня, {time}', { time });
  }

  if (dayDiff === 1) {
    return t('завтра, {time}', { time });
  }

  const day = new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short' })
    .format(date)
    .replace('.', '');

  return `${day}, ${time}`;
};

/** "11 окт" for a stamp. */
export const formatStampDay = (iso: string): string =>
  new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short' })
    .format(new Date(iso))
    .replace('.', '');

export type DueBucket = 'overdue' | 'today' | 'soon';

const SOON_DAYS = 7;

const dayStart = (time: number): number => {
  const date = new Date(time);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

/**
 * Where a live card stands in time:
 * - overdue: a deadline that has passed, or anything due on an earlier day;
 * - today: due today (including a reminder whose time has come);
 * - soon: due within the next seven days.
 * Cards without a date of any kind are in none of them.
 */
export const getDueBucket = (
  card: VisualCard,
  now: number = Date.now(),
): DueBucket | null => {
  const target = getCardTargetAt(card);

  // A card whose coupon was just torn still counts until it leaves the deck,
  // so an overview tab does not drop it mid-way.
  if (!target) {
    return null;
  }

  const due = new Date(target).getTime();

  if (!Number.isFinite(due)) {
    return null;
  }

  const days = Math.round((dayStart(due) - dayStart(now)) / (24 * HOUR));

  if (days < 0 || (card.timeMode === 'deadline' && due < now)) {
    return 'overdue';
  }

  if (days === 0) {
    return 'today';
  }

  return days <= SOON_DAYS ? 'soon' : null;
};

/**
 * How long a card has been overdue, in a word or two for a narrow place:
 * "сейчас", "5 мин", "3 ч", "вчера", "4 дн.", "3 нед.", "2 мес.". Null for a
 * card that is not overdue.
 */
export const formatOverdueShort = (
  card: VisualCard,
  now: number = Date.now(),
): string | null => {
  const target = getCardTargetAt(card);

  if (!target) {
    return null;
  }

  const due = new Date(target).getTime();

  if (!Number.isFinite(due) || due >= now) {
    return null;
  }

  const days = Math.round((dayStart(now) - dayStart(due)) / (24 * HOUR));

  if (days >= 60) {
    return t('{months} мес.', { months: Math.floor(days / 30) });
  }

  if (days >= 14) {
    return t('{weeks} нед.', { weeks: Math.floor(days / 7) });
  }

  if (days >= 2) {
    return t('{days} дн.', { days });
  }

  if (days === 1) {
    return t('вчера');
  }

  const hours = Math.floor((now - due) / HOUR);

  if (hours >= 1) {
    return t('{hours} ч', { hours });
  }

  const minutes = Math.floor((now - due) / MINUTE);

  return minutes >= 1 ? t('{minutes} мин', { minutes }) : t('сейчас');
};
