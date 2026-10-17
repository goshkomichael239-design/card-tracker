import { createId } from './cardOps';
import {
  CARD_COLOR_SCHEMES,
  type RecurrenceRule,
  type SeriesEntry,
  type TaskListItem,
  type VisualCard,
} from './cardTheme';
import { createDeck, type Deck } from './decks';
import { t } from './i18n';

const withDemoId = (deck: Deck): Deck => ({
  ...deck,
  id: DEMO_ID_PREFIX + deck.id,
});

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface DemoSet {
  decks: Deck[];
  cards: VisualCard[];
}

/** Marks everything the test set creates, so that it can be removed again. */
export const DEMO_ID_PREFIX = 'demo-';

export const isDemoId = (id: string): boolean => id.startsWith(DEMO_ID_PREFIX);

/**
 * The test set, made on request from the settings: two decks and about
 * thirty neutral cards of every kind and state (plain tasks, deadlines,
 * reminders, put-off cards with stamps, repeating cards, series at different
 * progress, lists, pinned and overdue ones), in the language of the app.
 */
export const createDemoSet = (now: number = Date.now()): DemoSet => {
  const iso = (timestamp: number) => new Date(timestamp).toISOString();
  let sequence = 0;
  let colorIndex = 3;
  const nextColorId = () =>
    CARD_COLOR_SCHEMES[colorIndex++ % CARD_COLOR_SCHEMES.length]!.id;
  // Slightly different creation moments, so the footers differ as well.
  const createdAt = () => iso(now - (6 + sequence++ * 53) * MINUTE);
  // A given hour of today, moved by whole days (a reminder counts as overdue
  // only from the day before, so those use -1 or less).
  const atHour = (hour: number, minute = 0, dayOffset = 0) => {
    const base = new Date(now);
    base.setHours(hour, minute, 0, 0);
    return base.getTime() + dayOffset * DAY;
  };

  const base = (title: string): VisualCard => ({
    id: DEMO_ID_PREFIX + createId(),
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

  const list = (
    title: string,
    items: string[],
    done: number,
    dueAt?: number,
  ): VisualCard => {
    const listItems: TaskListItem[] = items.map((text, index) => ({
      id: DEMO_ID_PREFIX + createId(),
      text,
      completedAt: index < done ? iso(now - (done - index) * HOUR) : undefined,
    }));

    return {
      ...base(title),
      title: items[0] ?? title,
      kind: 'list',
      list: { items: listItems },
      ...(dueAt === undefined
        ? {}
        : { timeMode: 'deadline' as const, deadlineAt: iso(dueAt) }),
    };
  };

  const pin = (card: VisualCard): VisualCard => ({ ...card, pinned: true });

  const home = withDemoId(createDeck(t('Дом'), 'emerald'));
  const work = withDemoId(createDeck(t('Работа'), 'navy'));

  const ago = (hours: number) => now - hours * HOUR;
  const ahead = (hours: number) => now + hours * HOUR;

  // ---- the base deck ---------------------------------------------------------
  const baseCards: VisualCard[] = [
    pin(deadline(t('Оплатить счёт'), ago(21))),
    deadline(t('Вернуть книгу в библиотеку'), ago(3)),
    reminder(t('Позвонить в банк'), atHour(15, 0, -1)),
    list(t('Собрать чемодан'), [t('Паспорт'), t('Зарядки'), t('Одежда'), t('Билеты')], 3, ago(8)),
    plain(t('Купить хлеб')),
    plain(t('Позвонить маме')),
    plain(t('Полить цветы')),
    series(t('Прогулка'), 10, 3),
    series(t('Вода: 8 стаканов'), 8, 5),
    series(t('Чтение: 20 минут'), 21, 0),
    list(t('Купить продукты'), [t('Молоко'), t('Яйца'), t('Сыр'), t('Яблоки')], 2),
    deadline(t('Подготовить документы'), ahead(5 * 24)),
    reminder(t('Встреча с другом'), atHour(10, 0, 1)),
    repeating(t('Зарядка'), { kind: 'daily' }, atHour(7, 30, 1)),
    repeating(t('Вынести мусор'), { kind: 'weekly', weekdays: [0, 3] }, atHour(20, 0, 1)),
    putOff(t('Разобрать шкаф'), 2),
  ];

  // ---- "Дом" ---------------------------------------------------------------------
  const homeCards: VisualCard[] = [
    deadline(t('Починить кран'), ago(26)),
    reminder(t('Заказать фильтр для воды'), atHour(18, 0, -1)),
    plain(t('Купить лампочки')),
    list(t('Уборка'), [t('Пыль'), t('Полы'), t('Окна'), t('Бельё')], 1),
    series(t('Растяжка'), 7, 2),
    repeating(t('Полив растений'), { kind: 'interval', intervalDays: 3 }, atHour(19, 0, 2)),
    deadline(t('Заплатить за интернет'), ahead(3 * 24)),
    putOff(t('Разобрать балкон'), 1),
  ].map((card) => ({ ...card, deckId: home.id }));

  // ---- "Работа" ------------------------------------------------------------------
  const workCards: VisualCard[] = [
    deadline(t('Отправить отчёт'), ago(2)),
    reminder(t('Ответить на письмо'), atHour(16, 0, -1)),
    plain(t('Разобрать входящие')),
    series(t('Звонки клиентам'), 15, 6),
    list(t('Подготовка к встрече'), [t('Повестка'), t('Цифры'), t('Слайды'), t('Материалы')], 2),
    pin(deadline(t('Квартальный отчёт'), ahead(3 * 24))),
    reminder(t('Планёрка'), atHour(10, 0, 1)),
    repeating(t('Отчёт по неделе'), { kind: 'weekly', weekdays: [4] }, atHour(17, 0, 2)),
    putOff(t('Обновить документы'), 3),
  ].map((card) => ({ ...card, deckId: work.id }));

  return {
    decks: [home, work],
    cards: [...baseCards, ...homeCards, ...workCards],
  };
};
