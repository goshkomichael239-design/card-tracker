import type { TaskListData } from './cardTheme';

export const getListCompletedCount = (list: TaskListData): number =>
  list.items.filter((item) => Boolean(item.completedAt)).length;

export const getListProgress = (list: TaskListData): number =>
  list.items.length === 0 ? 0 : getListCompletedCount(list) / list.items.length;
