import { createId } from './cardOps';
import {
  CARD_COLOR_SCHEMES,
  type RecurrenceRule,
  type SeriesEntry,
  type TaskListItem,
  type VisualCard,
} from './cardTheme';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * The deck a first run starts with: thirty cards of every kind and state, so
 * the whole product can be looked at at once: plain tasks, deadlines (one
 * overdue, one today, some later), reminders, put-off cards with stamps,
 * repeating cards, series at different progress, lists, and one pinned card.
 */
export const createDemoCards = (now: number = Date.now()): VisualCard[] => {
  const iso = (timestamp: number) => new Date(timestamp).toISOString();
  let sequence = 0;
  let colorIndex = 3;
  const nextColorId = () =>
    CARD_COLOR_SCHEMES[colorIndex++ % CARD_COLOR_SCHEMES.length]!.id;
  // Slightly different creation moments, so the footers differ as well.
  const createdAt = () => iso(now - (6 + sequence++ * 53) * MINUTE);
  // The next given hour of today or, when passed, of tomorrow.
  const atHour = (hour: number, minute = 0, dayOffset = 0) => {
    const base = new Date(now);
    base.setHours(hour, minute, 0, 0);
    return base.getTime() + dayOffset * DAY;
  };

  const base = (title: string): VisualCard => ({
    id: createId(),
    title,
    kind: 'single',
    timeMode: 'none',
    colorId: nextColorId(),
    createdAt: createdAt(),
  });

  const plain = (title: string): VisualCard => base(title);

  const deadline = (title: string, at: number): VisualCard => ({
    ...base(title),
    timeMode: 'deadline',
    deadlineAt: iso(at),
  });

  const reminder = (title: string, at: number): VisualCard => ({
    ...base(title),
    timeMode: 'reminder',
    reminderAt: iso(at),
  });

  const putOff = (title: string, stamps: number): VisualCard => {
    const postponements = Array.from({ length: stamps }, (_, index) => ({
      at: iso(now - (stamps - index) * DAY),
      until: iso(now - (stamps - index - 1) * DAY + 9 * HOUR),
    }));

    return {
      ...base(title),
      postponements,
      postponedUntil: iso(now + 2 * DAY),
    };
  };

  const repeating = (
    title: string,
    rule: RecurrenceRule,
    next: number,
  ): VisualCard => ({
    ...base(title),
    timeMode: 'reminder',
    reminderAt: iso(next),
    recurrence: rule,
  });

  const series = (title: string, target: number, done: number): VisualCard => {
    const startedAt = now - (done + 2) * DAY;
    const entries: SeriesEntry[] = Array.from({ length: done }, (_, index) => ({
      completedAt: iso(startedAt + (index + 1) * DAY + 9 * HOUR),
      durationMs: DAY + (index % 3) * HOUR,
    }));

    return {
      ...base(title),
      kind: 'series',
      series: {
        targetCount: target,
        entries,
        startedAt: iso(startedAt),
        timingAnchorAt: entries.at(-1)?.completedAt ?? iso(startedAt),
      },
    };
  };

  const list = (title: string, items: string[], done: number): VisualCard => {
    const listItems: TaskListItem[] = items.map((text, index) => ({
      id: createId(),
      text,
      completedAt: index < done ? iso(now - (done - index) * HOUR) : undefined,
    }));

    return {
      ...base(title),
      title: items[0] ?? title,
      kind: 'list',
      list: { items: listItems },
    };
  };

  const cards: VisualCard[] = [
    { ...deadline('Сдать налоговую декларацию', now - DAY + 3 * HOUR), pinned: true },
    plain('Купить хлеб'),
    series('Прогулка в парке', 10, 3),
    reminder('Выпить таблетку', now - 20 * MINUTE),
    list('Купить продукты на неделю', ['Молоко', 'Яйца', 'Гречка', 'Сыр', 'Яблоки', 'Чай'], 2),
    deadline('Отправить отчёт', now + 5 * HOUR),
    repeating('Зарядка', { kind: 'daily' }, atHour(7, 30, 1)),
    plain('Позвонить маме'),
    putOff('Разобрать антресоль', 2),
    series('Вода: 8 стаканов', 8, 5),
    deadline('Записаться к стоматологу', now + 2 * DAY),
    list('Собрать чемодан', ['Паспорт', 'Зарядки', 'Одежда', 'Лекарства', 'Билеты'], 4),
    reminder('Позвонить в банк', now + 2 * HOUR),
    plain('Полить цветы'),
    series('Чтение: 20 минут', 21, 0),
    deadline('Вернуть книги в библиотеку', now - 3 * HOUR),
    repeating('Вынести мусор', { kind: 'weekly', weekdays: [0, 3] }, atHour(20, 0, 1)),
    deadline('Оплатить интернет', now + 3 * DAY),
    list('План на выходные', ['Поход в кино', 'Встреча с друзьями', 'Уборка', 'Прогулка'], 0),
    putOff('Сменить масло в машине', 1),
    series('Тренировка', 12, 7),
    reminder('Встреча с Аней', atHour(10, 0, 1)),
    plain('Подарок на день рождения'),
    deadline('Подготовить презентацию', now + 5 * DAY),
    repeating('Отчёт по неделе', { kind: 'weekly', weekdays: [4] }, atHour(17, 0, 2)),
    list('Ремонт на кухне', ['Выбрать плитку', 'Замерить стены', 'Заказать мебель', 'Найти мастера', 'Купить смеситель', 'Покрасить стены', 'Повесить полки'], 1),
    reminder('Забрать посылку', now + 4 * DAY),
    series('Выучить слова', 5, 1),
    plain('Разобрать почту'),
    deadline('Продлить страховку', now + 21 * DAY),
  ];

  return cards;
};
