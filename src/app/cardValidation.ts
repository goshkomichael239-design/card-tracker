import type {
  Postponement,
  RecurrenceRule,
  SeriesData,
  TaskListData,
  VisualCard,
} from './cardTheme';

const isDateString = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

const isPostponement = (value: unknown): value is Postponement =>
  Boolean(value) &&
  typeof value === 'object' &&
  isDateString((value as Postponement).at) &&
  isDateString((value as Postponement).until);

const isRecurrenceRule = (value: unknown): value is RecurrenceRule => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const rule = value as Record<string, unknown>;

  switch (rule.kind) {
    case 'daily':
    case 'weekdays':
      return true;
    case 'weekly':
      return (
        Array.isArray(rule.weekdays) &&
        rule.weekdays.length > 0 &&
        rule.weekdays.every(
          (day) => Number.isInteger(day) && (day as number) >= 0 && (day as number) <= 6,
        )
      );
    case 'interval':
      return (
        Number.isInteger(rule.intervalDays) &&
        (rule.intervalDays as number) >= 1 &&
        (rule.intervalDays as number) <= 365
      );
    default:
      return false;
  }
};

/**
 * Keeps the optional fields added in later versions only when they are well
 * formed, so a damaged or hand-edited value never breaks a card: it simply
 * loses that one field.
 */
export const sanitizeStoredCard = (card: VisualCard): VisualCard => {
  const clean: VisualCard = { ...card };
  const postponements = Array.isArray(card.postponements)
    ? card.postponements.filter(isPostponement)
    : [];

  clean.postponements = postponements.length > 0 ? postponements : undefined;
  clean.postponedUntil = isDateString(card.postponedUntil)
    ? card.postponedUntil
    : undefined;
  clean.pinned = card.pinned === true ? true : undefined;
  // A repeating card keeps its next occurrence in reminderAt.
  clean.recurrence =
    isRecurrenceRule(card.recurrence) &&
    card.timeMode === 'reminder' &&
    isDateString(card.reminderAt)
      ? card.recurrence
      : undefined;

  return clean;
};

const isSeriesData = (value: unknown): value is SeriesData => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const series = value as Record<string, unknown>;
  return (
    typeof series.targetCount === 'number' &&
    Number.isInteger(series.targetCount) &&
    series.targetCount >= 1 &&
    Array.isArray(series.entries) &&
    series.entries.every(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        typeof (entry as Record<string, unknown>).completedAt === 'string' &&
        typeof (entry as Record<string, unknown>).durationMs === 'number',
    ) &&
    typeof series.startedAt === 'string' &&
    typeof series.timingAnchorAt === 'string'
  );
};

const isTaskListData = (value: unknown): value is TaskListData =>
  Boolean(value) &&
  typeof value === 'object' &&
  Array.isArray((value as TaskListData).items) &&
  (value as TaskListData).items.every(
    (item) =>
      typeof item.id === 'string' &&
      typeof item.text === 'string' &&
      (item.completedAt === undefined || typeof item.completedAt === 'string'),
  );

export const isStoredVisualCard = (value: unknown): value is VisualCard => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const card = value as Record<string, unknown>;

  return (
    typeof card.id === 'string' &&
    typeof card.title === 'string' &&
    (card.kind === 'single' || card.kind === 'series' || card.kind === 'list') &&
    (card.timeMode === 'none' ||
      card.timeMode === 'deadline' ||
      card.timeMode === 'reminder') &&
    typeof card.createdAt === 'string' &&
    (card.kind !== 'series' || isSeriesData(card.series)) &&
    (card.kind !== 'list' || isTaskListData(card.list))
  );
};
