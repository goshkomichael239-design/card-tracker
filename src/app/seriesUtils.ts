import type { SeriesData } from './cardTheme';

export const getSeriesCompletedCount = (series: SeriesData): number =>
  Math.min(series.entries.length, series.targetCount);

export const getSeriesProgress = (series: SeriesData): number =>
  Math.min(1, Math.max(0, getSeriesCompletedCount(series) / series.targetCount));

export const formatSeriesDuration = (durationMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }

  if (minutes > 0) {
    return `${minutes} мин ${seconds} сек`;
  }

  return `${seconds} сек`;
};
