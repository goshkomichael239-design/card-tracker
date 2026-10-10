import type { TaskListItem, VisualCard } from './cardTheme';

export type DateTimePart = 'day' | 'month' | 'hour' | 'minute';

const MINUTE_STEP = 5;

const daysInMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();

/** Moves one component of a local date/time by a single physical step. */
export const shiftDateTime = (
  base: Date,
  part: DateTimePart,
  direction: -1 | 1,
): Date => {
  const year = base.getFullYear();
  const month = base.getMonth();
  const day = base.getDate();
  const hour = base.getHours();
  const minute = base.getMinutes();

  switch (part) {
    case 'day':
      return new Date(year, month, day + direction, hour, minute);
    case 'month': {
      const target = new Date(year, month + direction, 1);
      const clampedDay = Math.min(
        day,
        daysInMonth(target.getFullYear(), target.getMonth()),
      );

      return new Date(
        target.getFullYear(),
        target.getMonth(),
        clampedDay,
        hour,
        minute,
      );
    }
    case 'hour':
      return new Date(year, month, day, hour + direction, minute);
    case 'minute':
      return new Date(
        year,
        month,
        day,
        hour,
        minute + direction * MINUTE_STEP,
      );
  }
};

/**
 * A step is allowed when it stays in the future, or when it moves a time that
 * is already in the past forward (so an overdue card can be rescheduled).
 */
export const canShiftDateTime = (
  base: Date,
  part: DateTimePart,
  direction: -1 | 1,
  now: number = Date.now(),
): boolean => {
  const candidate = shiftDateTime(base, part, direction).getTime();

  return candidate >= now || candidate > base.getTime();
};

export const getEditableTargetAt = (card: VisualCard): string | undefined =>
  card.timeMode === 'deadline'
    ? card.deadlineAt
    : card.timeMode === 'reminder'
      ? card.reminderAt
      : undefined;

export const createItemId = (): string => {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

/** Normalises edited list items: trims text and drops the empty ones. */
export const cleanListItems = (items: TaskListItem[]): TaskListItem[] =>
  items
    .map((item) => ({ ...item, text: item.text.trim() }))
    .filter((item) => item.text.length > 0);

export const getListTitle = (items: TaskListItem[]): string =>
  items[0]?.text.trim() || 'Список';
