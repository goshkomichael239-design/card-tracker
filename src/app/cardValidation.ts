import type { SeriesData, TaskListData, VisualCard } from './cardTheme';

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
