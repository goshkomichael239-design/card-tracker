import type { RecurrenceRule } from './cardTheme';
import type { QuickEntry } from './parseQuickEntry';

/**
 * The English counterpart of parseQuickEntry: what the app understands from one
 * line typed into a new card ("call mom tomorrow at 9", "push-ups 30 times",
 * "buy: bread, milk, eggs", "water the plants every other day at 8pm"). `null`
 * means it understood nothing: the line is then simply the title.
 */

const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const MONTH_PATTERN = `(?:${MONTH_NAMES.join('|')}|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec)\\.?`;

// 0 = Monday ... 6 = Sunday.
const WEEKDAY_NAMES = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
const WEEKDAY_LABEL = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const WEEKDAY_PATTERN = `(?:${WEEKDAY_NAMES.join('|')}|mon|tues?|wed|thur?s?|fri|sat|sun)`;

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

const fence = (pattern: string): RegExp =>
  new RegExp(`(?<![a-z0-9])(?:${pattern})(?![a-z0-9])`, 'u');

const monthIndex = (word: string): number => {
  const stem = word.replace(/\.$/, '');

  return MONTH_NAMES.findIndex(
    (name) => name === stem || name.startsWith(stem.slice(0, 3)),
  );
};

const weekdayIndex = (word: string): number => {
  const stem = word.slice(0, 3);

  return WEEKDAY_NAMES.findIndex((name) => name.startsWith(stem));
};

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

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
  text.charAt(0).toLocaleUpperCase('en-US') + text.slice(1);

const tidyTitle = (text: string): string => {
  let result = text.replace(/\s+/g, ' ').trim();
  const edge =
    /^(?:[,.;:\-–—\s]|(?:to|at|on|by|before|in|for|and|me|please|remind|that)(?![a-z0-9]))+/i;
  const tail =
    /(?:[,.;:\-–—\s]|(?<![a-z0-9])(?:to|at|on|by|before|in|for|and|me|next|this|every|each))+$/i;

  result = result.replace(edge, '').replace(tail, '').trim();

  return result ? capitalize(result) : '';
};

const pad = (value: number): string => String(value).padStart(2, '0');

const splitItems = (text: string): string[] =>
  text
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);

const describeDay = (day: Date, today: Date): string => {
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);

  if (diff === 0) {
    return 'today';
  }

  if (diff === 1) {
    return 'tomorrow';
  }

  if (diff > 1 && diff < 7) {
    return `on ${WEEKDAY_LABEL[(day.getDay() + 6) % 7]}, ${MONTH_SHORT[day.getMonth()]} ${day.getDate()}`;
  }

  return `on ${MONTH_SHORT[day.getMonth()]} ${day.getDate()}`;
};

const describeRule = (rule: RecurrenceRule): string => {
  switch (rule.kind) {
    case 'daily':
      return 'every day';
    case 'weekdays':
      return 'on weekdays';
    case 'interval':
      return rule.intervalDays === 2
        ? 'every other day'
        : `every ${rule.intervalDays} days`;
    default: {
      const days = rule.weekdays ?? [];

      return days.length === 1
        ? `every ${WEEKDAY_LABEL[days[0]!] ?? 'week'}`
        : 'on certain weekdays';
    }
  }
};

const formatClock = (at: Date): string => {
  const hours = at.getHours();
  const suffix = hours >= 12 ? 'pm' : 'am';
  const shown = hours % 12 === 0 ? 12 : hours % 12;

  return `${shown}:${pad(at.getMinutes())} ${suffix}`;
};

export const parseQuickEntryEn = (raw: string, now: Date): QuickEntry | null => {
  const text = raw.trim();

  if (text.length < 3) {
    return null;
  }

  const low = text.toLowerCase();

  // --- a list: "buy: bread, milk, eggs" or "bread, milk, eggs" ---
  const colon = /^([^:\n]{1,40}):\s*([\s\S]+)$/.exec(text);

  if (colon) {
    const items = splitItems(colon[2]!);

    if (items.length >= 2) {
      const prefix = tidyTitle(colon[1]!);

      return {
        kind: 'list',
        title: prefix || capitalize(items[0]!),
        items: items.map(capitalize),
        question: `Make a list${prefix ? ` "${prefix}"` : ''} of ${items.length} items and prepare the card?`,
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
      question: `Make a list of ${plainItems.length} items and prepare the card?`,
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

  // --- a series: "do push-ups 30 times" ---
  const times = fence('(\\d{1,3})\\s*(?:times|x)').exec(low);

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
        question: `Make a series "${title}" of ${target} repeats and prepare the card?`,
      };
    }
  }

  // The past is not a task: a day that has gone is not guessed at.
  if (fence('yesterday|last\\s+(?:night|week|month)').exec(low)) {
    return null;
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
    'every\\s+day|everyday|daily|each\\s+day|every\\s+morning|every\\s+evening|every\\s+night',
  ).exec(low);
  const workdays = fence(
    'on\\s+weekdays|every\\s+weekday|each\\s+weekday|weekdays|on\\s+workdays|every\\s+workday',
  ).exec(low);
  const eachWeekday = fence(
    `(?:every|each)\\s+(${WEEKDAY_PATTERN})`,
  ).exec(low);
  const everyPlural = fence(`on\\s+(${WEEKDAY_NAMES.join('|')})s`).exec(low);
  const everyN = fence('every\\s+(\\d{1,2})\\s+days').exec(low);
  const everyOther = fence('every\\s+other\\s+day|every\\s+second\\s+day').exec(
    low,
  );

  if (mark(eachDay)) {
    recurrence = { kind: 'daily' };

    if (/evening|night/.test(eachDay![0])) {
      hour = 19;
    } else if (/morning/.test(eachDay![0])) {
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
  const remind = fence('remind(?:\\s+me)?(?:\\s+to)?').exec(low);

  if (mark(remind)) {
    isReminder = true;
  }

  // A day.
  if (!recurrence) {
    const dayAfter = fence('(?:the\\s+)?day\\s+after\\s+tomorrow').exec(low);
    const tomorrow = fence('tomorrow').exec(low);
    const todayWord = fence('today|tonight').exec(low);
    const inDays = fence(
      '(?:in)\\s+(\\d{1,3}|a|an|one|two|three|four|five|six|seven)?\\s*(days?|weeks?|months?)',
    ).exec(low);
    const inTime = fence(
      '(?:in)\\s+(\\d{1,3}|a|an|one|two|three|four|five|ten)?\\s*(minutes?|mins?|hours?|hrs?)',
    ).exec(low);
    const halfHour = fence('in\\s+(?:half\\s+an\\s+hour|30\\s+min(?:ute)?s?)').exec(
      low,
    );
    const weekday = fence(
      `(?:on|next|this|by|before|until|till|for)\\s+(${WEEKDAY_PATTERN})`,
    ).exec(low);
    const monthFirst = fence(
      `(?:on\\s+)?(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?`,
    ).exec(low);
    const dayFirst = fence(
      `(?:on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_PATTERN})(?:,?\\s+(\\d{4}))?`,
    ).exec(low);
    const numericDate = fence('(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?').exec(low);

    if (mark(dayAfter)) {
      day = addDays(today, 2);
    } else if (mark(tomorrow)) {
      day = addDays(today, 1);
    } else if (todayWord) {
      mark(todayWord);
      day = today;

      if (/tonight/.test(todayWord[0])) {
        hour = 20;
        hasExplicitTime = true;
      }
    } else if (halfHour) {
      mark(halfHour);
      minutesAhead = 30;
    } else if (inTime) {
      const amount = toNumber(inTime[1]) ?? 1;

      mark(inTime);
      minutesAhead = /^min/.test(inTime[2]!) ? amount : amount * 60;
    } else if (inDays) {
      const amount = toNumber(inDays[1]) ?? 1;

      mark(inDays);
      day = addDays(
        today,
        /^week/.test(inDays[2]!)
          ? amount * 7
          : /^month/.test(inDays[2]!)
            ? amount * 30
            : amount,
      );
    } else if (weekday && weekdayIndex(weekday[1]!) >= 0) {
      const wanted = weekdayIndex(weekday[1]!);
      const current = (today.getDay() + 6) % 7;
      const ahead = ((wanted - current + 7) % 7) || 7;

      mark(weekday);
      day = addDays(today, ahead);

      if (/^(?:by|before|until|till)/.test(weekday[0])) {
        isDeadline = true;
      }
    } else if (monthFirst || dayFirst) {
      const found = (monthFirst ?? dayFirst)!;
      const month = monthIndex(monthFirst ? found[1]! : found[2]!);
      const dayNumber = Number(monthFirst ? found[2] : found[1]);
      const explicitYear = found[3];

      if (month >= 0 && dayNumber >= 1 && dayNumber <= 31) {
        let year = explicitYear ? Number(explicitYear) : today.getFullYear();
        let candidate = new Date(year, month, dayNumber);

        if (!explicitYear && candidate.getTime() < today.getTime()) {
          year += 1;
          candidate = new Date(year, month, dayNumber);
        }

        mark(found);
        day = candidate;
      }
    } else if (numericDate) {
      // US order: month/day(/year).
      const month = Number(numericDate[1]) - 1;
      const dayNumber = Number(numericDate[2]);

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
  if (minutesAhead === null && !hasExplicitTime) {
    // "at 9", "at 9:30", "at 9pm", "9pm", "by 6 pm".
    const withPreposition = fence(
      '(at|by|before|around|until|till)\\s+(\\d{1,2})(?:[:.](\\d{2}))?\\s*(am|pm|a\\.m\\.|p\\.m\\.)?',
    ).exec(low);
    const withMeridiem = fence(
      '(\\d{1,2})(?:[:.](\\d{2}))?\\s*(am|pm|a\\.m\\.|p\\.m\\.)',
    ).exec(low);
    const noon = fence('(?:at\\s+)?noon').exec(low);
    const midnight = fence('(?:at\\s+)?midnight').exec(low);
    const partWord = fence(
      'in\\s+the\\s+morning|this\\s+morning|in\\s+the\\s+afternoon|this\\s+afternoon|in\\s+the\\s+evening|this\\s+evening|at\\s+night',
    ).exec(low);

    let match: RegExpExecArray | null = null;
    let h: number | null = null;
    let m = 0;
    let meridiem: string | undefined;

    if (withPreposition) {
      match = withPreposition;
      h = Number(withPreposition[2]);
      m = withPreposition[3] ? Number(withPreposition[3]) : 0;
      meridiem = withPreposition[4]?.replace(/\./g, '');

      if (/^(?:by|before|until|till)$/.test(withPreposition[1]!)) {
        isDeadline = true;
      }
    } else if (withMeridiem) {
      match = withMeridiem;
      h = Number(withMeridiem[1]);
      m = withMeridiem[2] ? Number(withMeridiem[2]) : 0;
      meridiem = withMeridiem[3]?.replace(/\./g, '');
    } else if (noon) {
      match = noon;
      h = 12;
    } else if (midnight) {
      match = midnight;
      h = 0;
    }

    if (match && h !== null && h <= 24 && m <= 59) {
      if (meridiem === 'pm' && h < 12) {
        h += 12;
      } else if (meridiem === 'am' && h === 12) {
        h = 0;
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
      hour = /morning/.test(partWord[0])
        ? 9
        : /afternoon/.test(partWord[0])
          ? 14
          : /evening/.test(partWord[0])
            ? 19
            : 23;
      hasExplicitTime = true;
    }
  }

  // "by Friday" and "by 6pm" are deadlines; also "due" and "deadline".
  const deadlineWord = fence('(?:due|deadline|no\\s+later\\s+than)').exec(low);

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

  const clock = formatClock(at);

  if (recurrence) {
    return {
      kind: 'single',
      title,
      timeMode: 'reminder',
      at,
      recurrence,
      question: `Make a repeating task "${title}" (${describeRule(recurrence)}, at ${clock}) and prepare the card?`,
    };
  }

  const when =
    minutesAhead !== null
      ? `at ${clock}`
      : `${describeDay(startOfDay(at), today)} at ${clock}`;

  return {
    kind: 'single',
    title,
    timeMode: isDeadline ? 'deadline' : 'reminder',
    at,
    question: isDeadline
      ? `Make a task "${title}" due ${when} and prepare the card?`
      : `Make a task "${title}" with a reminder ${when} and prepare the card?`,
  };
};
