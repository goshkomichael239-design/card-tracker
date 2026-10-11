import type { RecurrenceRule } from './cardTheme';

/**
 * What the app understood from one line typed into a new card: a task with a
 * time (or a repeat), a series ("30 раз") or a list ("купить: хлеб, молоко").
 * `null` means it understood nothing: the line is then simply the title.
 */
export type QuickEntry =
  | {
      kind: 'single';
      title: string;
      timeMode: 'deadline' | 'reminder';
      /** When it is due; for a repeating card the clock time of its sheets. */
      at: Date;
      recurrence?: RecurrenceRule;
      /** The question put to the person: "Создать ... и оформить карточку?" */
      question: string;
    }
  | {
      kind: 'series';
      title: string;
      target: number;
      question: string;
    }
  | {
      kind: 'list';
      title: string;
      items: string[];
      question: string;
    };

const MONTHS: Record<string, number> = {
  января: 0,
  февраля: 1,
  марта: 2,
  апреля: 3,
  мая: 4,
  июня: 5,
  июля: 6,
  августа: 7,
  сентября: 8,
  октября: 9,
  ноября: 10,
  декабря: 11,
};

const MONTH_NAMES = Object.keys(MONTHS);

// 0 = Monday ... 6 = Sunday; stems cover every case ("пятницу", "пятницам").
const WEEKDAY_STEMS = [
  'понедельник',
  'вторник',
  'сред',
  'четверг',
  'пятниц',
  'суббот',
  'воскресен',
];
const WEEKDAY_ACCUSATIVE = [
  'понедельник',
  'вторник',
  'среду',
  'четверг',
  'пятницу',
  'субботу',
  'воскресенье',
];
const WEEKDAY_EACH = [
  'каждый понедельник',
  'каждый вторник',
  'каждую среду',
  'каждый четверг',
  'каждую пятницу',
  'каждую субботу',
  'каждое воскресенье',
];
const WEEKDAY_STEM_PATTERN = `(?:${WEEKDAY_STEMS.join('|')})[а-я]*`;

// "\b" does not know Cyrillic, so words are fenced by hand.
const fence = (pattern: string): RegExp =>
  new RegExp(`(?<![а-яa-z0-9])(?:${pattern})(?![а-яa-z0-9])`, 'u');

const weekdayIndex = (word: string): number =>
  WEEKDAY_STEMS.findIndex((stem) => word.startsWith(stem));

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const NUMBER_WORDS: Record<string, number> = {
  один: 1,
  одну: 1,
  два: 2,
  две: 2,
  три: 3,
  четыре: 4,
  пять: 5,
  шесть: 6,
  семь: 7,
  восемь: 8,
  девять: 9,
  десять: 10,
};

const toNumber = (word: string | undefined): number | null => {
  if (!word) {
    return null;
  }

  if (/^\d+$/.test(word)) {
    return Number(word);
  }

  return NUMBER_WORDS[word] ?? null;
};

interface Cut {
  start: number;
  end: number;
}

const capitalize = (text: string): string =>
  text.charAt(0).toLocaleUpperCase('ru-RU') + text.slice(1);

const tidyTitle = (text: string): string => {
  let result = text.replace(/\s+/g, ' ').trim();
  const edge =
    /^(?:[,.;:\-–—\s]|(?:в|во|на|к|до|около|и|а|мне)(?![а-яa-z0-9]))+/iu;
  const tail =
    /(?:[,.;:\-–—\s]|(?<![а-яa-z0-9])(?:в|во|на|к|до|около|и|а|мне))+$/iu;

  result = result.replace(edge, '').replace(tail, '').trim();

  return result ? capitalize(result) : '';
};

const pad = (value: number): string => String(value).padStart(2, '0');

const describeDay = (day: Date, today: Date): string => {
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);

  if (diff === 0) {
    return 'сегодня';
  }

  if (diff === 1) {
    return 'завтра';
  }

  if (diff === 2) {
    return 'послезавтра';
  }

  const weekday = WEEKDAY_ACCUSATIVE[(day.getDay() + 6) % 7];
  const month = MONTH_NAMES[day.getMonth()];

  if (diff > 0 && diff < 7) {
    return `в ${weekday}, ${day.getDate()} ${month}`;
  }

  return `${day.getDate()} ${month}`;
};

const describeRule = (rule: RecurrenceRule): string => {
  switch (rule.kind) {
    case 'daily':
      return 'каждый день';
    case 'weekdays':
      return 'по будням';
    case 'interval':
      return rule.intervalDays === 2
        ? 'через день'
        : `каждые ${rule.intervalDays} дн.`;
    default: {
      const days = rule.weekdays ?? [];

      return days.length === 1
        ? (WEEKDAY_EACH[days[0]!] ?? 'по дням недели')
        : 'по дням недели';
    }
  }
};

const splitItems = (text: string): string[] =>
  text
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);

export const parseQuickEntry = (
  raw: string,
  now: Date,
): QuickEntry | null => {
  const text = raw.trim();

  if (text.length < 3) {
    return null;
  }

  // Same length as the original ("ё" is one letter either way), so a match
  // position here is a position in the original.
  const low = text.toLowerCase().replace(/ё/g, 'е');

  // --- a list: "купить: хлеб, молоко, яйца" or "хлеб, молоко, яйца" ---
  const colon = /^([^:\n]{1,40}):\s*([\s\S]+)$/.exec(text);

  if (colon) {
    const items = splitItems(colon[2]!);

    if (items.length >= 2) {
      const prefix = tidyTitle(colon[1]!);

      return {
        kind: 'list',
        title: prefix || capitalize(items[0]!),
        items: items.map(capitalize),
        question: `Создать список${prefix ? ` «${prefix}»` : ''} из ${items.length} пунктов и оформить карточку?`,
      };
    }
  }

  const plainItems = splitItems(text);

  if (
    plainItems.length >= 3 &&
    plainItems.every((item) => item.length <= 40)
  ) {
    return {
      kind: 'list',
      title: capitalize(plainItems[0]!),
      items: plainItems.map(capitalize),
      question: `Создать список из ${plainItems.length} пунктов и оформить карточку?`,
    };
  }

  const cuts: Cut[] = [];
  const mark = (match: RegExpExecArray | null): boolean => {
    if (!match) {
      return false;
    }

    cuts.push({ start: match.index, end: match.index + match[0].length });
    return true;
  };

  // --- a series: "отжаться 30 раз" ---
  const times = fence('(\\d{1,3})\\s*(?:раз|раза)').exec(low);

  if (times) {
    const target = Number(times[1]);
    const title = tidyTitle(
      text.slice(0, times.index) + ' ' + text.slice(times.index + times[0].length),
    );

    if (target >= 2 && title) {
      return {
        kind: 'series',
        title,
        target,
        question: `Создать серию «${title}» из ${target} повторений и оформить карточку?`,
      };
    }
  }

  // --- a task with a time ---
  const today = startOfDay(now);
  let recurrence: RecurrenceRule | undefined;
  let day: Date | null = null;
  let minutesAhead: number | null = null;
  let hour: number | null = null;
  let minute = 0;
  let hasExplicitTime = false;
  let isDeadline = false;
  let isReminder = false;

  // Repeats.
  const eachDay = fence(
    'каждый день|ежедневно|каждое утро|каждый вечер|каждый божий день',
  ).exec(low);
  const workdays = fence('по будням|в будние дни|каждый будний день').exec(low);
  const eachWeekday = fence(
    `кажд(?:ый|ую|ое)\\s+(${WEEKDAY_STEM_PATTERN})`,
  ).exec(low);
  const everyPlural = fence(`по\\s+(${WEEKDAY_STEM_PATTERN})`).exec(low);
  const everyN = fence('кажд(?:ые|ый)\\s+(\\d{1,2})\\s+(?:дня|дней|день)').exec(
    low,
  );
  const everyOther = fence('через день').exec(low);

  if (mark(eachDay)) {
    recurrence = { kind: 'daily' };

    if (/вечер/.test(eachDay![0])) {
      hour = 19;
    } else if (/утро/.test(eachDay![0])) {
      hour = 8;
    }
  } else if (mark(workdays)) {
    recurrence = { kind: 'weekdays' };
  } else if (eachWeekday && weekdayIndex(eachWeekday[1]!) >= 0) {
    mark(eachWeekday);
    recurrence = { kind: 'weekly', weekdays: [weekdayIndex(eachWeekday[1]!)] };
  } else if (everyPlural && weekdayIndex(everyPlural[1]!) >= 0) {
    mark(everyPlural);
    recurrence = { kind: 'weekly', weekdays: [weekdayIndex(everyPlural[1]!)] };
  } else if (everyN) {
    mark(everyN);
    recurrence = { kind: 'interval', intervalDays: Math.max(2, Number(everyN[1])) };
  } else if (mark(everyOther)) {
    recurrence = { kind: 'interval', intervalDays: 2 };
  }

  // Intent words.
  const remind = fence('напомни(?:ть)?(?:\\s+мне)?').exec(low);

  if (mark(remind)) {
    isReminder = true;
  }

  // A day.
  if (!recurrence) {
    const dayAfter = fence('послезавтра').exec(low);
    const tomorrow = fence('завтра').exec(low);
    const todayWord = fence('сегодня').exec(low);
    const inDays = fence(
      '(?:через)\\s+(\\d{1,3}|один|два|две|три|четыре|пять|шесть|семь)?\\s*(день|дня|дней|неделю|недели|недель|месяц)',
    ).exec(low);
    const inTime = fence(
      '(?:через)\\s+(\\d{1,3}|один|одну|два|две|три|четыре|пять|десять)?\\s*(минуту|минуты|минут|час|часа|часов)',
    ).exec(low);
    const halfHour = fence('через полчаса').exec(low);
    const weekday = fence(
      `(?:в|во|на|к|до)\\s+(${WEEKDAY_STEM_PATTERN})`,
    ).exec(low);
    const monthDate = fence(
      `(\\d{1,2})\\s+(${MONTH_NAMES.join('|')})(?:\\s+(\\d{4}))?`,
    ).exec(low);
    const numericDate = fence('(\\d{1,2})\\.(\\d{1,2})(?:\\.(\\d{2,4}))?').exec(
      low,
    );

    if (mark(dayAfter)) {
      day = addDays(today, 2);
    } else if (mark(tomorrow)) {
      day = addDays(today, 1);
    } else if (mark(todayWord)) {
      day = today;
    } else if (halfHour) {
      mark(halfHour);
      minutesAhead = 30;
    } else if (inTime) {
      const amount = toNumber(inTime[1]) ?? 1;

      mark(inTime);
      minutesAhead = /мин/.test(inTime[2]!) ? amount : amount * 60;
    } else if (inDays) {
      const amount = toNumber(inDays[1]) ?? 1;

      mark(inDays);
      day = addDays(
        today,
        /недел/.test(inDays[2]!)
          ? amount * 7
          : /месяц/.test(inDays[2]!)
            ? amount * 30
            : amount,
      );
    } else if (weekday && weekdayIndex(weekday[1]!) >= 0) {
      const wanted = weekdayIndex(weekday[1]!);
      const current = (today.getDay() + 6) % 7;
      const ahead = ((wanted - current + 7) % 7) || 7;

      mark(weekday);
      day = addDays(today, ahead);

      if (/^(?:до|к)/.test(weekday[0])) {
        isDeadline = true;
      }
    } else if (monthDate) {
      const month = MONTHS[monthDate[2]!]!;
      let year = monthDate[3] ? Number(monthDate[3]) : today.getFullYear();
      let candidate = new Date(year, month, Number(monthDate[1]));

      if (!monthDate[3] && candidate.getTime() < today.getTime()) {
        year += 1;
        candidate = new Date(year, month, Number(monthDate[1]));
      }

      mark(monthDate);
      day = candidate;
    } else if (numericDate) {
      const dayNumber = Number(numericDate[1]);
      const month = Number(numericDate[2]) - 1;

      if (dayNumber >= 1 && dayNumber <= 31 && month >= 0 && month <= 11) {
        let year = numericDate[3]
          ? Number(numericDate[3]) < 100
            ? 2000 + Number(numericDate[3])
            : Number(numericDate[3])
          : today.getFullYear();
        let candidate = new Date(year, month, dayNumber);

        if (!numericDate[3] && candidate.getTime() < today.getTime()) {
          year += 1;
          candidate = new Date(year, month, dayNumber);
        }

        mark(numericDate);
        day = candidate;
      }
    }
  }

  // A time of day.
  if (minutesAhead === null) {
    // A bare number is a time only with a preposition or a part-of-day word.
    const withPreposition = fence(
      '(в|к|до|около)\\s+(\\d{1,2})(?:[:.](\\d{2}))?(?:\\s*(утра|вечера|дня|ночи))?',
    ).exec(low);
    const withPartOfDay = fence(
      '(\\d{1,2})(?:[:.](\\d{2}))?\\s*(утра|вечера|дня|ночи)',
    ).exec(low);
    const noon = fence('в полдень').exec(low);
    const midnight = fence('в полночь').exec(low);
    const partWord = fence('утром|днем|вечером|ночью').exec(low);

    let match: RegExpExecArray | null = null;
    let h: number | null = null;
    let m = 0;
    let part: string | undefined;

    if (withPreposition) {
      match = withPreposition;
      h = Number(withPreposition[2]);
      m = withPreposition[3] ? Number(withPreposition[3]) : 0;
      part = withPreposition[4];

      if (/^(?:до|к)$/.test(withPreposition[1]!)) {
        isDeadline = true;
      }
    } else if (withPartOfDay) {
      match = withPartOfDay;
      h = Number(withPartOfDay[1]);
      m = withPartOfDay[2] ? Number(withPartOfDay[2]) : 0;
      part = withPartOfDay[3];
    } else if (noon) {
      match = noon;
      h = 12;
    } else if (midnight) {
      match = midnight;
      h = 0;
    }

    if (match && h !== null && h <= 24 && m <= 59) {
      if (part === 'вечера' && h < 12) {
        h += 12;
      } else if (part === 'дня' && h >= 1 && h < 12) {
        h += 12;
      } else if (part === 'ночи' && h === 12) {
        h = 0;
      } else if (part === 'ночи' && h >= 6 && h < 12) {
        h += 12;
      }

      if (h === 24) {
        h = 0;
      }

      mark(match);
      hour = h;
      minute = m;
      hasExplicitTime = true;
    } else if (partWord) {
      mark(partWord);
      hour = { утром: 9, днем: 13, вечером: 19, ночью: 23 }[
        partWord[0] as 'утром' | 'днем' | 'вечером' | 'ночью'
      ];
      hasExplicitTime = true;
    }
  }

  // "до пятницы" and "к 18:00" are deadlines; also "срок" and "дедлайн".
  const deadlineWord = fence('(?:не\\s+позднее|не\\s+позже|срок|дедлайн)').exec(
    low,
  );

  if (mark(deadlineWord)) {
    isDeadline = true;
  }

  const hasWhen =
    recurrence !== undefined ||
    day !== null ||
    minutesAhead !== null ||
    hasExplicitTime;

  if (!hasWhen) {
    return null;
  }

  // Cut what was understood out of the line; the rest is the title.
  const ordered = [...cuts].sort((a, b) => a.start - b.start);
  let rest = '';
  let cursor = 0;

  for (const cut of ordered) {
    if (cut.start < cursor) {
      continue;
    }

    rest += text.slice(cursor, cut.start) + ' ';
    cursor = cut.end;
  }

  rest += text.slice(cursor);
  const title = tidyTitle(rest);

  if (!title) {
    return null;
  }

  let at: Date;

  if (minutesAhead !== null) {
    at = new Date(now.getTime() + minutesAhead * 60_000);
    at.setSeconds(0, 0);
  } else if (recurrence) {
    at = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      hour ?? 9,
      minute,
    );
  } else {
    const useDeadline = isDeadline || (!isReminder && !hasExplicitTime);
    const defaultHour = useDeadline ? 18 : 9;
    const targetHour = hour ?? defaultHour;
    let targetDay = day;

    if (targetDay === null) {
      // Only a time was given: today if it is still ahead, else tomorrow.
      const candidate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        targetHour,
        minute,
      );

      targetDay = candidate.getTime() > now.getTime() ? today : addDays(today, 1);
    }

    at = new Date(
      targetDay.getFullYear(),
      targetDay.getMonth(),
      targetDay.getDate(),
      targetHour,
      minute,
    );

    if (at.getTime() <= now.getTime()) {
      return null;
    }

    isDeadline = useDeadline;
  }

  const clock = `${at.getHours()}:${pad(at.getMinutes())}`;

  if (recurrence) {
    return {
      kind: 'single',
      title,
      timeMode: 'reminder',
      at,
      recurrence,
      question: `Создать повторяющуюся задачу «${title}» (${describeRule(recurrence)}, в ${clock}) и оформить карточку?`,
    };
  }

  const when =
    minutesAhead !== null
      ? `в ${clock}`
      : `${describeDay(startOfDay(at), today)} в ${clock}`;

  return {
    kind: 'single',
    title,
    timeMode: isDeadline ? 'deadline' : 'reminder',
    at,
    question: isDeadline
      ? `Создать задачу «${title}» со сроком ${when} и оформить карточку?`
      : `Создать задачу «${title}» с напоминанием ${when} и оформить карточку?`,
  };
};
