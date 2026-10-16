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

  const work = createDeck(t('Работа'), 'navy');
  const meta = createDeck('card-tracker', 'emerald');

  const ago = (hours: number) => now - hours * HOUR;
  const ahead = (hours: number) => now + hours * HOUR;

  // ---- the base deck: forty cards, ten of them overdue ---------------------
  const base40: VisualCard[] = [
    // overdue (10)
    pin(deadline(t('Сдать налоговую декларацию'), ago(21))),
    deadline(t('Вернуть книги в библиотеку'), ago(3)),
    reminder(t('Выпить таблетку'), atHour(8, 30, -1)),
    deadline(t('Оплатить квартиру'), ago(48)),
    reminder(t('Позвонить в банк'), atHour(15, 0, -1)),
    deadline(t('Записаться к стоматологу'), ago(96)),
    reminder(t('Забрать посылку'), atHour(11, 0, -2)),
    deadline(t('Продлить страховку'), ago(6)),
    deadline(t('Отправить отчёт'), now - 50 * MINUTE),
    list(t('Собрать чемодан'), [t('Паспорт'), t('Зарядки'), t('Одежда'), t('Лекарства'), t('Билеты')], 4, ago(8)),
    // plain (6)
    plain(t('Купить хлеб')),
    plain(t('Позвонить маме')),
    plain(t('Полить цветы')),
    plain(t('Подарок на день рождения')),
    plain(t('Разобрать почту')),
    plain(t('Сходить на рынок')),
    // series (5)
    series(t('Прогулка в парке'), 10, 3),
    series(t('Вода: 8 стаканов'), 8, 5),
    series(t('Чтение: 20 минут'), 21, 0),
    series(t('Тренировка'), 12, 7),
    series(t('Выучить слова'), 5, 1),
    // lists (4)
    list(t('Купить продукты на неделю'), [t('Молоко'), t('Яйца'), t('Гречка'), t('Сыр'), t('Яблоки'), t('Чай')], 2),
    list(t('План на выходные'), [t('Поход в кино'), t('Встреча с друзьями'), t('Уборка'), t('Прогулка')], 0),
    list(t('Ремонт на кухне'), [t('Выбрать плитку'), t('Замерить стены'), t('Заказать мебель'), t('Найти мастера'), t('Купить смеситель'), t('Покрасить стены'), t('Повесить полки')], 1),
    list(t('Поездка на море'), [t('Гостиница'), t('Билеты'), t('Страховка'), t('Плавки'), t('Крем от солнца')], 3),
    // deadlines (5)
    deadline(t('Подготовить презентацию'), ahead(5 * 24)),
    deadline(t('Оплатить интернет'), ahead(3 * 24)),
    deadline(t('Подать документы'), ahead(8 * 24)),
    deadline(t('Заплатить налог'), ahead(21 * 24)),
    deadline(t('Сдать анализы'), ahead(30)),
    // reminders (3)
    reminder(t('Встреча с Аней'), atHour(10, 0, 1)),
    reminder(t('Позвонить врачу'), ahead(2)),
    reminder(t('Поздравить Колю'), ahead(4 * 24)),
    // repeating (4)
    repeating(t('Зарядка'), { kind: 'daily' }, atHour(7, 30, 1)),
    repeating(t('Вынести мусор'), { kind: 'weekly', weekdays: [0, 3] }, atHour(20, 0, 1)),
    repeating(t('Полив растений'), { kind: 'interval', intervalDays: 3 }, atHour(19, 0, 2)),
    repeating(t('Сводка расходов'), { kind: 'weekdays' }, atHour(21, 0, 1)),
    // put off (3)
    putOff(t('Разобрать антресоль'), 2),
    putOff(t('Сменить масло в машине'), 1),
    putOff(t('Записаться на стрижку'), 4),
  ];

  // ---- "Работа": thirty cards, seven overdue -------------------------------
  const workCards: VisualCard[] = [
    // overdue (7)
    deadline(t('Отправить отчёт клиенту'), ago(2)),
    deadline(t('Согласовать смету'), ago(26)),
    reminder(t('Ответить на письмо юристов'), atHour(16, 0, -1)),
    deadline(t('Подписать акт'), ago(72)),
    reminder(t('Созвониться с подрядчиком'), atHour(10, 30, -1)),
    deadline(t('Обновить прайс-лист'), ago(5)),
    list(t('Подготовить договор'), [t('Реквизиты'), t('Сроки'), t('Оплата'), t('Согласование')], 1, ago(30)),
    // plain (5)
    plain(t('Разобрать входящие')),
    plain(t('Заказать канцелярию')),
    plain(t('Обновить резюме')),
    plain(t('Придумать название проекту')),
    plain(t('Написать благодарность коллеге')),
    // series (3)
    series(t('Код-ревью: 10 штук'), 10, 4),
    series(t('Холодные звонки'), 15, 6),
    series(t('Статьи в блог'), 6, 2),
    // lists (3)
    list(t('Подготовка к презентации'), [t('Слайды'), t('Цифры'), t('Репетиция'), t('Раздатка'), t('Проектор')], 2),
    list(t('Онбординг новичка'), [t('Пропуск'), t('Ноутбук'), t('Доступы'), t('Знакомство'), t('План на месяц'), t('Наставник')], 0),
    list(t('Закупки для офиса'), [t('Бумага'), t('Кофе'), t('Стаканы'), t('Маркеры')], 3),
    // deadlines (4)
    pin(deadline(t('Квартальный отчёт'), ahead(3 * 24))),
    deadline(t('Защитить бюджет'), ahead(6 * 24)),
    deadline(t('Сдать проект'), ahead(10 * 24)),
    deadline(t('Ревью на пятницу'), ahead(8)),
    // reminders (3)
    reminder(t('Планёрка'), atHour(10, 0, 1)),
    reminder(t('Позвонить в HR'), ahead(3)),
    reminder(t('Обед с клиентом'), ahead(2 * 24)),
    // repeating (3)
    repeating(t('Ежедневный стендап'), { kind: 'weekdays' }, atHour(9, 30, 1)),
    repeating(t('Отчёт по неделе'), { kind: 'weekly', weekdays: [4] }, atHour(17, 0, 2)),
    repeating(t('Оплата хостинга'), { kind: 'interval', intervalDays: 30 }, atHour(12, 0, 9)),
    // put off (2)
    putOff(t('Разобрать архив документов'), 3),
    putOff(t('Обновить сайт'), 1),
  ].map((card) => ({ ...card, deckId: work.id }));

  // ---- "card-tracker": thirty cards, six overdue ---------------------------
  const metaCards: VisualCard[] = [
    // overdue (6)
    deadline(t('Починить свайп на телефоне'), ago(24)),
    deadline(t('Выровнять кромки картотеки'), ago(4)),
    reminder(t('Победить скрепку'), atHour(23, 0, -1)),
    deadline(t('Решить, что делать с корзиной'), ago(72)),
    reminder(t('Показать приложение друзьям'), atHour(18, 0, -2)),
    list(t('Список багов'), [t('Кромки'), t('Скрепка'), t('Штамп'), t('Звук'), t('Вибрация')], 2, ago(48)),
    // plain (5)
    plain(t('Нарисовать новую корзину')),
    plain(t('Придумать красивое имя')),
    plain(t('Пересмотреть цвета колод')),
    plain(t('Озвучить штамп')),
    plain(t('Не трогать кромки')),
    // series (3)
    series(t('Коммиты: 30 штук'), 30, 12),
    series(t('Тесты на телефоне'), 8, 3),
    series(t('Иконки'), 4, 0),
    // lists (3)
    list(t('Дорожная карта'), [t('Колоды'), t('Картотека'), 'PWA', 'APK', t('Уведомления'), t('Английский')], 2),
    list(t('Релиз APK'), [t('Иконка'), t('Подпись'), t('Сборка'), t('Проверка'), t('Выкладка')], 1),
    list(t('Уведомления'), [t('Разрешения'), t('Расписание'), t('Звук'), t('Повтор')], 0),
    // deadlines (4)
    pin(deadline(t('Выложить на GitHub Pages'), ahead(2 * 24))),
    deadline(t('Собрать APK'), ahead(5 * 24)),
    deadline(t('Английский перевод'), ahead(14 * 24)),
    deadline(t('Демо для друзей'), ahead(9)),
    // reminders (3)
    reminder(t('Запушить ветку'), ahead(1)),
    reminder(t('Проверить на телефоне'), ahead(20)),
    reminder(t('Сделать бэкап'), ahead(3 * 24)),
    // repeating (3)
    repeating(t('Коммит в конце дня'), { kind: 'daily' }, atHour(22, 0, 1)),
    repeating(t('Резервная копия'), { kind: 'weekly', weekdays: [6] }, atHour(11, 0, 3)),
    repeating(t('Чистка кэша'), { kind: 'interval', intervalDays: 14 }, atHour(15, 0, 5)),
    // put off (3)
    putOff(t('Переписать всё на Rust'), 3),
    putOff(t('Журнал карточек'), 1),
    putOff(t('Фольга на заголовок'), 2),
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
