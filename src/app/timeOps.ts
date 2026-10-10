import type { VisualCard } from './cardTheme';

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
    { id: 'hour', label: 'Через час', until: inAnHour },
  ];

  if (evening.getTime() - now.getTime() > 2 * HOUR) {
    presets.push({ id: 'evening', label: 'Вечером', until: evening });
  }

  presets.push(
    { id: 'tomorrow', label: 'Завтра утром', until: atTime(now, 1, 9) },
    { id: 'monday', label: 'В понедельник', until: atTime(now, daysToMonday, 9) },
    { id: 'week', label: 'Через неделю', until: atTime(now, 7, 9) },
  );

  return presets;
};

/** "11 окт, 09:00", or "сегодня, 19:00" / "завтра, 09:00". */
export const formatPostponeMoment = (date: Date, now: Date = new Date()): string => {
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(date) - startOfDay(now)) / (24 * HOUR));
  const time = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  if (dayDiff === 0) {
    return `сегодня, ${time}`;
  }

  if (dayDiff === 1) {
    return `завтра, ${time}`;
  }

  const day = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
    .format(date)
    .replace('.', '');

  return `${day}, ${time}`;
};

/** "11 окт" for a stamp. */
export const formatStampDay = (iso: string): string =>
  new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
    .format(new Date(iso))
    .replace('.', '');
