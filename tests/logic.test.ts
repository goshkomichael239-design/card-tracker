import { beforeEach, describe, expect, it, vi } from 'vitest';

import { longestDailyStreak, pluralCards, pluralDays } from '../src/app/archiveUtils';
import { parseBackup, serializeBackup } from '../src/app/backupUtils';
import {
  applySeriesStep,
  buildCompletedCard,
  finishSeriesByHand,
  toggleListItem,
} from '../src/app/cardOps';
import {
  advanceRecurringCard,
  firstOccurrence,
  nextOccurrence,
} from '../src/app/recurrence';
import { formatOverdueShort, getDueBucket, postponeCard } from '../src/app/timeOps';
import { at, makeCard, setLang } from './helpers';

// Friday, 16 October 2026, 10:00.
const NOW = at(2026, 10, 16, 10, 0);

describe('repeating cards', () => {
  it('starts today when the time is still ahead, tomorrow otherwise', () => {
    expect(firstOccurrence({ kind: 'daily' }, 18, 0, NOW)).toEqual(at(2026, 10, 16, 18, 0));
    expect(firstOccurrence({ kind: 'daily' }, 9, 0, NOW)).toEqual(at(2026, 10, 17, 9, 0));
  });

  it('skips the weekend for weekdays', () => {
    expect(firstOccurrence({ kind: 'weekdays' }, 9, 0, at(2026, 10, 16, 18, 0))).toEqual(
      at(2026, 10, 19, 9, 0),
    );
  });

  it('never goes back: a missed sheet moves to the next allowed day', () => {
    const next = nextOccurrence({ kind: 'daily' }, at(2026, 10, 10, 9, 0), NOW);

    expect(next).toEqual(at(2026, 10, 17, 9, 0));
  });

  it('steps by interval', () => {
    const next = nextOccurrence({ kind: 'interval', intervalDays: 3 }, at(2026, 10, 16, 9, 0), NOW);

    expect(next).toEqual(at(2026, 10, 19, 9, 0));
  });

  it('advances the card and clears its stamps', () => {
    const card = makeCard({
      timeMode: 'reminder',
      reminderAt: at(2026, 10, 16, 9, 0).toISOString(),
      recurrence: { kind: 'daily' },
      postponements: [{ at: NOW.toISOString(), until: NOW.toISOString() }],
    });
    const advanced = advanceRecurringCard(card, NOW);

    expect(new Date(advanced.reminderAt!)).toEqual(at(2026, 10, 17, 9, 0));
    expect(advanced.postponements).toBeUndefined();
  });
});

describe('completing cards', () => {
  it('gives the torn sheet of a repeating card its own id and no repeat', () => {
    const card = makeCard({ recurrence: { kind: 'daily' }, reminderAt: NOW.toISOString() });
    const done = buildCompletedCard(card, NOW.toISOString(), 'new-id');

    expect(done.id).toBe('new-id');
    expect(done.recurrence).toBeUndefined();
    expect(done.completedAt).toBe(NOW.toISOString());
  });

  it('counts the steps of a series and finishes on the last one', () => {
    let card = makeCard({
      kind: 'series',
      series: {
        targetCount: 2,
        entries: [],
        startedAt: NOW.toISOString(),
        timingAnchorAt: NOW.toISOString(),
      },
    });
    const first = applySeriesStep(card, new Date(NOW.getTime() + 60_000))!;

    expect(first.isFinished).toBe(false);
    expect(first.card.series!.entries).toHaveLength(1);

    card = first.card;
    const second = applySeriesStep(card, new Date(NOW.getTime() + 120_000))!;

    expect(second.isFinished).toBe(true);
    expect(second.card.series!.finishReason).toBe('completed');
  });

  it('finishes a series by hand', () => {
    const card = makeCard({
      kind: 'series',
      series: {
        targetCount: 5,
        entries: [],
        startedAt: NOW.toISOString(),
        timingAnchorAt: NOW.toISOString(),
      },
    });

    expect(finishSeriesByHand(card, NOW)!.series!.finishReason).toBe('manual');
    expect(finishSeriesByHand(makeCard(), NOW)).toBeNull();
  });

  it('ticks and unticks a list item', () => {
    const card = makeCard({
      kind: 'list',
      list: { items: [{ id: 'a', text: 'Bread' }] },
    });
    const ticked = toggleListItem(card, 'a', NOW);

    expect(ticked.list!.items[0]!.completedAt).toBeTruthy();
    expect(toggleListItem(ticked, 'a', NOW).list!.items[0]!.completedAt).toBeUndefined();
  });
});

describe('time', () => {
  beforeEach(() => setLang('en'));

  it('is overdue after a deadline, but a reminder earlier today only "today"', () => {
    const lateDeadline = makeCard({
      timeMode: 'deadline',
      deadlineAt: at(2026, 10, 16, 8, 0).toISOString(),
    });
    const earlyReminder = makeCard({
      timeMode: 'reminder',
      reminderAt: at(2026, 10, 16, 8, 0).toISOString(),
    });
    const yesterdayReminder = makeCard({
      timeMode: 'reminder',
      reminderAt: at(2026, 10, 15, 8, 0).toISOString(),
    });

    expect(getDueBucket(lateDeadline, NOW.getTime())).toBe('overdue');
    expect(getDueBucket(earlyReminder, NOW.getTime())).toBe('today');
    expect(getDueBucket(yesterdayReminder, NOW.getTime())).toBe('overdue');
  });

  it('says how long a card has been overdue', () => {
    const overdue = (date: Date) =>
      makeCard({ timeMode: 'deadline', deadlineAt: date.toISOString() });

    expect(formatOverdueShort(overdue(at(2026, 10, 16, 7, 0)), NOW.getTime())).toBe('3 h');
    expect(formatOverdueShort(overdue(at(2026, 10, 15, 9, 0)), NOW.getTime())).toBe('yesterday');
    expect(formatOverdueShort(overdue(at(2026, 10, 12, 9, 0)), NOW.getTime())).toBe('4 d');
    expect(formatOverdueShort(overdue(at(2026, 10, 17, 9, 0)), NOW.getTime())).toBeNull();
  });

  it('puts a card off: the deadline moves and a stamp is left', () => {
    const card = makeCard({
      timeMode: 'deadline',
      deadlineAt: at(2026, 10, 16, 8, 0).toISOString(),
    });
    const later = postponeCard(card, at(2026, 10, 17, 9, 0), NOW);

    expect(later.deadlineAt).toBe(at(2026, 10, 17, 9, 0).toISOString());
    expect(later.postponements).toHaveLength(1);
  });
});

describe('words', () => {
  it('has plurals in both languages', () => {
    setLang('en');
    expect([pluralDays(1), pluralDays(2), pluralCards(1), pluralCards(5)]).toEqual([
      'day',
      'days',
      'card',
      'cards',
    ]);
    setLang('ru');
    expect([pluralDays(1), pluralDays(2), pluralDays(5), pluralDays(21)]).toEqual([
      'день',
      'дня',
      'дней',
      'день',
    ]);
  });

  it('finds the longest run of days', () => {
    expect(
      longestDailyStreak([
        '2026-10-10T10:00:00',
        '2026-10-11T10:00:00',
        '2026-10-12T10:00:00',
        '2026-10-14T10:00:00',
      ]),
    ).toBe(3);
  });
});

describe('backups', () => {
  it('survives a round trip', () => {
    const active = makeCard({ id: 'a', title: 'Active' });
    const done = makeCard({ id: 'b', title: 'Done', completedAt: NOW.toISOString() });
    const text = serializeBackup([active], [done], [], true, []);
    const back = parseBackup(text)!;

    expect(back.cards.map((card) => card.id)).toEqual(['a']);
    expect(back.archive.map((card) => card.id)).toEqual(['b']);
    expect(back.decks[0]!.id).toBe('default');
  });

  it('refuses what is not a backup', () => {
    expect(parseBackup('not json')).toBeNull();
    expect(parseBackup('{"app":"something else"}')).toBeNull();
    expect(parseBackup('[]')).toBeNull();
  });
});

describe('notifications plan', () => {
  it('plans a notification an hour before and at the deadline, and a reminder', async () => {
    vi.doMock('@capacitor/core', () => ({
      Capacitor: { isNativePlatform: () => false },
    }));
    vi.doMock('@capacitor/local-notifications', () => ({ LocalNotifications: {} }));
    setLang('en');

    const { planReminders } = await import('../src/app/notifications');
    const hours = (n: number) => new Date(NOW.getTime() + n * 3_600_000).toISOString();
    const plan = planReminders(
      [
        makeCard({ id: 'd3', title: 'In three hours', timeMode: 'deadline', deadlineAt: hours(3) }),
        makeCard({ id: 'd30', title: 'In half an hour', timeMode: 'deadline', deadlineAt: hours(0.5) }),
        makeCard({ id: 'r', title: 'Tomorrow', timeMode: 'reminder', reminderAt: hours(24) }),
        makeCard({ id: 'late', title: 'Overdue', timeMode: 'deadline', deadlineAt: hours(-2) }),
        makeCard({ id: 'none', title: 'No time' }),
        makeCard({ id: 'done', title: 'Done', timeMode: 'reminder', reminderAt: hours(2), completedAt: hours(0) }),
      ],
      NOW.getTime(),
    );

    expect(plan.map((item) => [item.title, item.body])).toEqual([
      ['In half an hour', 'Deadline passed'],
      ['In three hours', 'Deadline in an hour'],
      ['In three hours', 'Deadline passed'],
      ['Tomorrow', 'Reminder'],
    ]);
    // Ids are stable numbers (the phone wants numbers).
    expect(new Set(plan.map((item) => item.id)).size).toBe(plan.length);
  });
});
