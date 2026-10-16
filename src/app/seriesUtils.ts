import type { SeriesData } from './cardTheme';
import { t } from './i18n';

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
    return t('{hours} ч {minutes} мин', { hours, minutes });
  }

  if (minutes > 0) {
    return t('{minutes} мин {seconds} сек', { minutes, seconds });
  }

  return t('{seconds} сек', { seconds });
};
