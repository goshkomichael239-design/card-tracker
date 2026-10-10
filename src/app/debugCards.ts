import {
  CARD_COLOR_SCHEMES,
  type SeriesEntry,
  type TaskListItem,
  type TimeMode,
  type VisualCard,
} from './cardTheme';

/** Id prefix that marks cards created by the DEV-only debug button. */
export const DEBUG_CARD_ID_PREFIX = 'debug-';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Fifteen believable cards of every kind and state, for looking at the whole
 * product at once: undated tasks, deadlines (one already overdue), reminders
 * (one already due), series at different progress, and lists.
 */
export const createDebugCards = (now: number = Date.now()): VisualCard[] => {
  const iso = (timestamp: number) => new Date(timestamp).toISOString();
  let sequence = 0;
  const nextId = () => `${DEBUG_CARD_ID_PREFIX}${now}-${sequence++}`;
  // Walk through the colour schemes so neighbouring cards always differ.
  let colorIndex = 0;
  const nextColorId = () =>
    CARD_COLOR_SCHEMES[colorIndex++ % CARD_COLOR_SCHEMES.length]!.id;
  // Slightly different creation moments, so the footers differ as well.
  const createdAt = () => iso(now - (sequence + 1) * 47 * MINUTE);

  const single = (
    title: string,
    timeMode: TimeMode,
    offsetMs?: number,
  ): VisualCard => {
    const target = offsetMs === undefined ? undefined : iso(now + offsetMs);

    return {
      id: nextId(),
      colorId: nextColorId(),
      title,
      kind: 'single',
      timeMode,
      deadlineAt: timeMode === 'deadline' ? target : undefined,
      reminderAt: timeMode === 'reminder' ? target : undefined,
      createdAt: createdAt(),
    };
  };

  const series = (
    title: string,
    targetCount: number,
    doneCount: number,
    stepMinutes: number,
  ): VisualCard => {
    const startedAt = now - (doneCount + 1) * stepMinutes * MINUTE;
    const entries: SeriesEntry[] = Array.from(
      { length: doneCount },
      (_, index) => ({
        completedAt: iso(startedAt + (index + 1) * stepMinutes * MINUTE),
        // A little jitter so the "за ..." line is not identical everywhere.
        durationMs: (stepMinutes + (index % 3) - 1) * MINUTE,
      }),
    );

    return {
      id: nextId(),
      colorId: nextColorId(),
      title,
      kind: 'series',
      timeMode: 'none',
      createdAt: iso(startedAt),
      series: {
        targetCount,
        entries,
        startedAt: iso(startedAt),
        timingAnchorAt: iso(entries.at(-1)
          ? new Date(entries.at(-1)!.completedAt).getTime()
          : startedAt),
      },
    };
  };

  const list = (
    title: string,
    items: Array<[text: string, done?: boolean]>,
  ): VisualCard => {
    const listItems: TaskListItem[] = items.map(([text, done]) => ({
      id: `${nextId()}-item`,
      text,
      completedAt: done ? iso(now - 20 * MINUTE) : undefined,
    }));

    return {
      id: nextId(),
      colorId: nextColorId(),
      title,
      kind: 'list',
      timeMode: 'none',
      createdAt: createdAt(),
      list: { items: listItems },
    };
  };

  return [
    single('Купить продукты на неделю', 'none'),
    single('Записаться к стоматологу', 'none'),
    single('Разобрать антресоль', 'none'),

    single('Сдать налоговую декларацию', 'deadline', 5 * DAY),
    single('Оплатить интернет', 'deadline', 2 * DAY + 3 * HOUR),
    single('Подготовить презентацию для встречи', 'deadline', 20 * HOUR),
    single('Вернуть книги в библиотеку', 'deadline', -(2 * HOUR + 15 * MINUTE)),

    single('Позвонить маме', 'reminder', 3 * HOUR),
    single('Полить цветы', 'reminder', DAY + 2 * HOUR),
    single('Выпить таблетку', 'reminder', -(25 * MINUTE)),

    series('Отжимания: 10 подходов', 10, 4, 35),
    series('Стакан воды · 8 за день', 8, 7, 55),

    list('Сборы в поездку', [
      ['Паспорт и билеты', true],
      ['Зарядки и пауэрбанк', true],
      ['Аптечка'],
      ['Тёплая куртка'],
      ['Наушники'],
      ['Ключи отдать соседке'],
    ]),
    list('Продукты к ужину', [
      ['Лосось', true],
      ['Лимон'],
      ['Рис басмати'],
      ['Укроп'],
    ]),
    list('План на выходные', [
      ['Прогулка в парке', true],
      ['Позвонить родителям'],
      ['Постирать и погладить'],
      ['Дочитать главу'],
      ['Кино вечером'],
    ]),
  ];
};
