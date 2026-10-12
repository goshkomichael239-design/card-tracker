import { createId } from './cardOps';
import {
  CARD_COLOR_SCHEMES,
  type RecurrenceRule,
  type SeriesEntry,
  type TaskListItem,
  type VisualCard,
} from './cardTheme';
import { createDeck, type Deck } from './decks';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface DemoSet {
  decks: Deck[];
  cards: VisualCard[];
}

/**
 * What a first run starts with, to test everything at once: three decks, the
 * base one with forty cards and "Работа" and "card-tracker" with thirty each.
 * Every deck has overdue cards and cards of every kind and state: plain tasks,
 * deadlines, reminders, put-off cards with stamps, repeating cards, series at
 * different progress, lists and pinned cards.
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

  const list = (
    title: string,
    items: string[],
    done: number,
    dueAt?: number,
  ): VisualCard => {
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
      ...(dueAt === undefined
        ? {}
        : { timeMode: 'deadline' as const, deadlineAt: iso(dueAt) }),
    };
  };

  const pin = (card: VisualCard): VisualCard => ({ ...card, pinned: true });

  const work = createDeck('Работа', 'navy');
  const meta = createDeck('card-tracker', 'emerald');

  const ago = (hours: number) => now - hours * HOUR;
  const ahead = (hours: number) => now + hours * HOUR;

  // ---- the base deck: forty cards, ten of them overdue ---------------------
  const base40: VisualCard[] = [
    // overdue (10)
    pin(deadline('Сдать налоговую декларацию', ago(21))),
    deadline('Вернуть книги в библиотеку', ago(3)),
    reminder('Выпить таблетку', atHour(8, 30, -1)),
    deadline('Оплатить квартиру', ago(48)),
    reminder('Позвонить в банк', atHour(15, 0, -1)),
    deadline('Записаться к стоматологу', ago(96)),
    reminder('Забрать посылку', atHour(11, 0, -2)),
    deadline('Продлить страховку', ago(6)),
    deadline('Отправить отчёт', now - 50 * MINUTE),
    list('Собрать чемодан', ['Паспорт', 'Зарядки', 'Одежда', 'Лекарства', 'Билеты'], 4, ago(8)),
    // plain (6)
    plain('Купить хлеб'),
    plain('Позвонить маме'),
    plain('Полить цветы'),
    plain('Подарок на день рождения'),
    plain('Разобрать почту'),
    plain('Сходить на рынок'),
    // series (5)
    series('Прогулка в парке', 10, 3),
    series('Вода: 8 стаканов', 8, 5),
    series('Чтение: 20 минут', 21, 0),
    series('Тренировка', 12, 7),
    series('Выучить слова', 5, 1),
    // lists (4)
    list('Купить продукты на неделю', ['Молоко', 'Яйца', 'Гречка', 'Сыр', 'Яблоки', 'Чай'], 2),
    list('План на выходные', ['Поход в кино', 'Встреча с друзьями', 'Уборка', 'Прогулка'], 0),
    list('Ремонт на кухне', ['Выбрать плитку', 'Замерить стены', 'Заказать мебель', 'Найти мастера', 'Купить смеситель', 'Покрасить стены', 'Повесить полки'], 1),
    list('Поездка на море', ['Гостиница', 'Билеты', 'Страховка', 'Плавки', 'Крем от солнца'], 3),
    // deadlines (5)
    deadline('Подготовить презентацию', ahead(5 * 24)),
    deadline('Оплатить интернет', ahead(3 * 24)),
    deadline('Подать документы', ahead(8 * 24)),
    deadline('Заплатить налог', ahead(21 * 24)),
    deadline('Сдать анализы', ahead(30)),
    // reminders (3)
    reminder('Встреча с Аней', atHour(10, 0, 1)),
    reminder('Позвонить врачу', ahead(2)),
    reminder('Поздравить Колю', ahead(4 * 24)),
    // repeating (4)
    repeating('Зарядка', { kind: 'daily' }, atHour(7, 30, 1)),
    repeating('Вынести мусор', { kind: 'weekly', weekdays: [0, 3] }, atHour(20, 0, 1)),
    repeating('Полив растений', { kind: 'interval', intervalDays: 3 }, atHour(19, 0, 2)),
    repeating('Сводка расходов', { kind: 'weekdays' }, atHour(21, 0, 1)),
    // put off (3)
    putOff('Разобрать антресоль', 2),
    putOff('Сменить масло в машине', 1),
    putOff('Записаться на стрижку', 4),
  ];

  // ---- "Работа": thirty cards, seven overdue -------------------------------
  const workCards: VisualCard[] = [
    // overdue (7)
    deadline('Отправить отчёт клиенту', ago(2)),
    deadline('Согласовать смету', ago(26)),
    reminder('Ответить на письмо юристов', atHour(16, 0, -1)),
    deadline('Подписать акт', ago(72)),
    reminder('Созвониться с подрядчиком', atHour(10, 30, -1)),
    deadline('Обновить прайс-лист', ago(5)),
    list('Подготовить договор', ['Реквизиты', 'Сроки', 'Оплата', 'Согласование'], 1, ago(30)),
    // plain (5)
    plain('Разобрать входящие'),
    plain('Заказать канцелярию'),
    plain('Обновить резюме'),
    plain('Придумать название проекту'),
    plain('Написать благодарность коллеге'),
    // series (3)
    series('Код-ревью: 10 штук', 10, 4),
    series('Холодные звонки', 15, 6),
    series('Статьи в блог', 6, 2),
    // lists (3)
    list('Подготовка к презентации', ['Слайды', 'Цифры', 'Репетиция', 'Раздатка', 'Проектор'], 2),
    list('Онбординг новичка', ['Пропуск', 'Ноутбук', 'Доступы', 'Знакомство', 'План на месяц', 'Наставник'], 0),
    list('Закупки для офиса', ['Бумага', 'Кофе', 'Стаканы', 'Маркеры'], 3),
    // deadlines (4)
    pin(deadline('Квартальный отчёт', ahead(3 * 24))),
    deadline('Защитить бюджет', ahead(6 * 24)),
    deadline('Сдать проект', ahead(10 * 24)),
    deadline('Ревью на пятницу', ahead(8)),
    // reminders (3)
    reminder('Планёрка', atHour(10, 0, 1)),
    reminder('Позвонить в HR', ahead(3)),
    reminder('Обед с клиентом', ahead(2 * 24)),
    // repeating (3)
    repeating('Ежедневный стендап', { kind: 'weekdays' }, atHour(9, 30, 1)),
    repeating('Отчёт по неделе', { kind: 'weekly', weekdays: [4] }, atHour(17, 0, 2)),
    repeating('Оплата хостинга', { kind: 'interval', intervalDays: 30 }, atHour(12, 0, 9)),
    // put off (2)
    putOff('Разобрать архив документов', 3),
    putOff('Обновить сайт', 1),
  ].map((card) => ({ ...card, deckId: work.id }));

  // ---- "card-tracker": thirty cards, six overdue ---------------------------
  const metaCards: VisualCard[] = [
    // overdue (6)
    deadline('Починить свайп на телефоне', ago(24)),
    deadline('Выровнять кромки картотеки', ago(4)),
    reminder('Победить скрепку', atHour(23, 0, -1)),
    deadline('Решить, что делать с корзиной', ago(72)),
    reminder('Показать приложение друзьям', atHour(18, 0, -2)),
    list('Список багов', ['Кромки', 'Скрепка', 'Штамп', 'Звук', 'Вибрация'], 2, ago(48)),
    // plain (5)
    plain('Нарисовать новую корзину'),
    plain('Придумать красивое имя'),
    plain('Пересмотреть цвета колод'),
    plain('Озвучить штамп'),
    plain('Не трогать кромки'),
    // series (3)
    series('Коммиты: 30 штук', 30, 12),
    series('Тесты на телефоне', 8, 3),
    series('Иконки', 4, 0),
    // lists (3)
    list('Дорожная карта', ['Колоды', 'Картотека', 'PWA', 'APK', 'Уведомления', 'Английский'], 2),
    list('Релиз APK', ['Иконка', 'Подпись', 'Сборка', 'Проверка', 'Выкладка'], 1),
    list('Уведомления', ['Разрешения', 'Расписание', 'Звук', 'Повтор'], 0),
    // deadlines (4)
    pin(deadline('Выложить на GitHub Pages', ahead(2 * 24))),
    deadline('Собрать APK', ahead(5 * 24)),
    deadline('Английский перевод', ahead(14 * 24)),
    deadline('Демо для друзей', ahead(9)),
    // reminders (3)
    reminder('Запушить ветку', ahead(1)),
    reminder('Проверить на телефоне', ahead(20)),
    reminder('Сделать бэкап', ahead(3 * 24)),
    // repeating (3)
    repeating('Коммит в конце дня', { kind: 'daily' }, atHour(22, 0, 1)),
    repeating('Резервная копия', { kind: 'weekly', weekdays: [6] }, atHour(11, 0, 3)),
    repeating('Чистка кэша', { kind: 'interval', intervalDays: 14 }, atHour(15, 0, 5)),
    // put off (3)
    putOff('Переписать всё на Rust', 3),
    putOff('Журнал карточек', 1),
    putOff('Фольга на заголовок', 2),
  ].map((card) => ({ ...card, deckId: meta.id }));

  return {
    decks: [work, meta],
    cards: [
      ...base40,
      ...workCards,
      ...metaCards,
    ],
  };
};
