import { getLocale, t } from './i18n';
export const padNumber = (value: number): string => {
  return String(value).padStart(2, '0');
};

const shortDateFormatter = () =>
  new Intl.DateTimeFormat(getLocale(), {
    day: '2-digit',
    month: 'short',
  });

const humanDateFormatter = () =>
  new Intl.DateTimeFormat(getLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const formatShortDate = (value: string): string => {
  return shortDateFormatter().format(new Date(value))
    .replace('.', '')
    .toUpperCase();
};

export const formatHumanDate = (value: string): string => {
  return humanDateFormatter().format(new Date(value));
};

export const formatCompletedDate = (value: string): string => {
  const date = new Date(value);

  return [
    padNumber(date.getDate()),
    '.',
    padNumber(date.getMonth() + 1),
    '.',
    date.getFullYear(),
    ' · ',
    padNumber(date.getHours()),
    ':',
    padNumber(date.getMinutes()),
  ].join('');
};

export const formatRemainingTime = (milliseconds: number): string => {
  if (!Number.isFinite(milliseconds)) {
    return t('Дата не указана');
  }

  if (milliseconds <= 0) {
    return t('Срок наступил');
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return t('{days} д {hours} ч {minutes} мин', { days, hours, minutes });
  }

  if (hours > 0) {
    return t('{hours} ч {minutes} мин {seconds} с', { hours, minutes, seconds });
  }

  return t('{minutes} мин {seconds} с', { minutes, seconds });
};

export const formatOverdueTime = (milliseconds: number): string => {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return t('{days} д {hours} ч', { days, hours });
  }

  if (hours > 0) {
    return t('{hours} ч {minutes} мин', { hours, minutes });
  }

  return t('{minutes} мин', { minutes: Math.max(1, minutes) });
};

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export const MONTH_NAMES_RU = [
  t('Январь'),
  t('Февраль'),
  t('Март'),
  t('Апрель'),
  t('Май'),
  t('Июнь'),
  t('Июль'),
  t('Август'),
  t('Сентябрь'),
  t('Октябрь'),
  t('Ноябрь'),
  t('Декабрь'),
];

export const WEEKDAYS_RU = [t('Пн'), t('Вт'), t('Ср'), t('Чт'), t('Пт'), t('Сб'), t('Вс')];

export const startOfLocalDay = (value: Date): Date => {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
};

export const getNextFiveMinuteSlot = (value = new Date()): Date => {
  return new Date(
    Math.ceil(value.getTime() / FIVE_MINUTES_MS) * FIVE_MINUTES_MS,
  );
};

export const addLocalDays = (value: Date, days: number): Date => {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate() + days,
  );
};

export const getNextMonday = (value: Date): Date => {
  const daysUntilMonday = ((8 - value.getDay()) % 7) || 7;
  return addLocalDays(value, daysUntilMonday);
};

export const isSameLocalDay = (left: Date, right: Date): boolean => {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
};

export const formatDraftDate = (value: Date): string => {
  return [
    padNumber(value.getDate()),
    '.',
    padNumber(value.getMonth() + 1),
    '.',
    value.getFullYear(),
  ].join('');
};

export const getDraftDateLabel = (value: Date, today: Date): string => {
  if (isSameLocalDay(value, today)) {
    return t('Сегодня');
  }

  if (isSameLocalDay(value, addLocalDays(today, 1))) {
    return t('Завтра');
  }

  if (isSameLocalDay(value, addLocalDays(today, 2))) {
    return t('Послезавтра');
  }

  if (isSameLocalDay(value, getNextMonday(today))) {
    return t('В понедельник');
  }

  return t('Выбрано');
};

export const createLocalDateTimeValue = (
  date: Date,
  hour: number,
  minute: number,
): string => {
  return [
    date.getFullYear(),
    '-',
    padNumber(date.getMonth() + 1),
    '-',
    padNumber(date.getDate()),
    'T',
    padNumber(hour),
    ':',
    padNumber(minute),
  ].join('');
};
