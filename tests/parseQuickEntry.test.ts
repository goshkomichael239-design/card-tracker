import { beforeEach, describe, expect, it } from 'vitest';

import { parseQuickEntry } from '../src/app/parseQuickEntry';
import { at, setLang } from './helpers';

// Friday, 16 October 2026, 10:00.
const NOW = at(2026, 10, 16, 10, 0);

describe('quick entry in English', () => {
  beforeEach(() => setLang('en'));

  it('understands a day and a time', () => {
    const result = parseQuickEntry('call mom tomorrow at 9', NOW);

    expect(result).toMatchObject({ kind: 'single', title: 'Call mom', timeMode: 'reminder' });
    expect(result && 'at' in result && result.at).toEqual(at(2026, 10, 17, 9, 0));
  });

  it('reads "by" as a deadline', () => {
    const result = parseQuickEntry('pay rent by Friday', NOW);

    expect(result).toMatchObject({ kind: 'single', title: 'Pay rent', timeMode: 'deadline' });
    // Today is Friday: "by Friday" means the next one.
    expect(result && 'at' in result && result.at).toEqual(at(2026, 10, 23, 18, 0));
  });

  it('reads a repeat', () => {
    const daily = parseQuickEntry('take pill every day at 8pm', NOW);
    const other = parseQuickEntry('water the plants every other day', NOW);
    const weekly = parseQuickEntry('gym every Tuesday at 7am', NOW);

    expect(daily).toMatchObject({ title: 'Take pill', recurrence: { kind: 'daily' } });
    expect(other).toMatchObject({ recurrence: { kind: 'interval', intervalDays: 2 } });
    expect(weekly).toMatchObject({ recurrence: { kind: 'weekly', weekdays: [1] } });
  });

  it('reads a series', () => {
    expect(parseQuickEntry('push-ups 30 times', NOW)).toMatchObject({
      kind: 'series',
      title: 'Push-ups',
      target: 30,
    });
  });

  it('reads a list', () => {
    expect(parseQuickEntry('buy: bread, milk, eggs', NOW)).toMatchObject({
      kind: 'list',
      title: 'Buy',
      items: ['Bread', 'Milk', 'Eggs'],
    });
  });

  it('reads "in two hours" and a date', () => {
    const soon = parseQuickEntry('remind me to send the report in 2 hours', NOW);
    const dated = parseQuickEntry('meeting with Anna on Oct 20 at 3:30 pm', NOW);

    expect(soon).toMatchObject({ title: 'Send the report', timeMode: 'reminder' });
    expect(soon && 'at' in soon && soon.at).toEqual(at(2026, 10, 16, 12, 0));
    expect(dated && 'at' in dated && dated.at).toEqual(at(2026, 10, 20, 15, 30));
  });

  it('understands nothing in a plain title', () => {
    expect(parseQuickEntry('just a plain title', NOW)).toBeNull();
    expect(parseQuickEntry('hi', NOW)).toBeNull();
  });

  it('does not make a task in the past', () => {
    expect(parseQuickEntry('call mom yesterday at 9', NOW)).toBeNull();
  });

  it('still understands Russian typed into the English app', () => {
    expect(parseQuickEntry('Позвонить маме завтра в 9', NOW)).toMatchObject({
      kind: 'single',
      title: 'Позвонить маме',
    });
  });
});

describe('quick entry in Russian', () => {
  beforeEach(() => setLang('ru'));

  it('understands a day and a time', () => {
    const result = parseQuickEntry('позвонить маме завтра в 9', NOW);

    expect(result).toMatchObject({ kind: 'single', title: 'Позвонить маме' });
    expect(result && 'at' in result && result.at).toEqual(at(2026, 10, 17, 9, 0));
  });

  it('reads a series, a list and a repeat', () => {
    expect(parseQuickEntry('отжаться 30 раз', NOW)).toMatchObject({ kind: 'series', target: 30 });
    expect(parseQuickEntry('купить: хлеб, молоко, яйца', NOW)).toMatchObject({
      kind: 'list',
      items: ['Хлеб', 'Молоко', 'Яйца'],
    });
    expect(parseQuickEntry('зарядка каждый день в 7 утра', NOW)).toMatchObject({
      recurrence: { kind: 'daily' },
    });
  });

  it('asks in Russian', () => {
    const result = parseQuickEntry('позвонить маме завтра в 9', NOW);

    expect(result?.question).toMatch(/^Создать задачу/);
  });
});
