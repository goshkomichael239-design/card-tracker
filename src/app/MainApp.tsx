import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import tableTexture from '../assets/black-main-background.avif';
import cardboardTexture from '../assets/cardboard.avif';

type CreationState = 'idle' | 'editing' | 'committing';
type CardKind = 'single' | 'routine' | 'list';
type TimeMode = 'none' | 'deadline' | 'reminder';
type DraftStep = 'title' | 'kind' | 'time' | 'date' | 'clock' | 'confirm';

interface GhostSettings {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
}

interface CardPalette {
  paper: string;
  accent: string;
  accentDark: string;
  ink: string;
}

interface VisualCard {
  id: string;
  title: string;
  kind: 'single';
  timeMode: TimeMode;
  deadlineAt?: string;
  reminderAt?: string;
  createdAt: string;
  completedAt?: string;
}

interface DetachedCoupon {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  palette: CardPalette;
}

const CARD_RADIUS = 32;

const GHOST_SETTINGS: GhostSettings = {
  x: -31,
  y: -41,
  rotate: -7,
  scale: 1,
  opacity: 0.2,
};

const PALETTES: Record<TimeMode, CardPalette> = {
  none: {
    paper: '#E8D9C0',
    accent: '#CD5334',
    accentDark: '#8F3025',
    ink: '#1E1C1A',
  },
  deadline: {
    paper: '#CFD7E0',
    accent: '#4A6578',
    accentDark: '#2E4655',
    ink: '#1B242A',
  },
  reminder: {
    paper: '#CDD9C4',
    accent: '#5C7A5A',
    accentDark: '#3E583D',
    ink: '#1D251D',
  },
};

const CARD_SHADOW = `
  18px 28px 50px -8px rgba(0,0,0,0.72),
  8px 14px 24px -4px rgba(0,0,0,0.42),
  inset 0 1.5px 1px rgba(255,255,255,0.7),
  inset 0 -2px 4px rgba(0,0,0,0.1)
`;

const DRAFT_SHADOW = `
  0 5px 0 -1px rgba(105,82,59,0.92),
  0 8px 0 -2px rgba(62,47,34,0.78),
  0 11px 10px -4px rgba(0,0,0,0.68),
  25px 38px 70px -10px rgba(0,0,0,0.78),
  12px 20px 34px -6px rgba(0,0,0,0.55),
  inset 0 1.5px 1px rgba(255,255,255,0.7),
  inset 0 -2px 4px rgba(0,0,0,0.1)
`;

const GHOST_SHADOW = `
  8px 14px 28px rgba(0,0,0,0.18),
  inset 2px 2px 5px rgba(255,255,255,0.18),
  inset -2px -2px 5px rgba(0,0,0,0.12)
`;

const PHYSICAL_SPRING = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 22,
  mass: 0.95,
};


const COUPON_WIDTH = 236;
const COUPON_HEIGHT = 38;
const COUPON_RADIUS = 6;
const COUPON_DASH_LENGTH = 4.2;
const COUPON_DASH_GAP = 3;
const COUPON_CORE_THICKNESS = 1.15;
const COUPON_SHOULDER_THICKNESS = 2.8;
const COUPON_SHOULDER_OPACITY = 0.52;
const COUPON_STROKE_INSET = COUPON_SHOULDER_THICKNESS / 2 + 0.35;

const createId = (): string => {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const padNumber = (value: number): string => {
  return String(value).padStart(2, '0');
};

const formatShortDate = (value: string): string => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
  })
    .format(new Date(value))
    .replace('.', '')
    .toUpperCase();
};

const formatHumanDate = (value: string): string => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const formatCompletedDate = (value: string): string => {
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

const formatRemainingTime = (milliseconds: number): string => {
  if (!Number.isFinite(milliseconds)) {
    return 'Дата не указана';
  }

  if (milliseconds <= 0) {
    return 'Срок наступил';
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days} д ${hours} ч ${minutes} мин`;
  }

  if (hours > 0) {
    return `${hours} ч ${minutes} мин ${seconds} с`;
  }

  return `${minutes} мин ${seconds} с`;
};

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const MONTH_NAMES_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];
const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const startOfLocalDay = (value: Date): Date => {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  );
};

const getNextFiveMinuteSlot = (value = new Date()): Date => {
  return new Date(
    Math.ceil(value.getTime() / FIVE_MINUTES_MS) *
      FIVE_MINUTES_MS,
  );
};

const addLocalDays = (value: Date, days: number): Date => {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate() + days,
  );
};

const getNextMonday = (value: Date): Date => {
  const daysUntilMonday = ((8 - value.getDay()) % 7) || 7;
  return addLocalDays(value, daysUntilMonday);
};

const isSameLocalDay = (left: Date, right: Date): boolean => {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
};

const formatDraftDate = (value: Date): string => {
  return [
    padNumber(value.getDate()),
    '.',
    padNumber(value.getMonth() + 1),
    '.',
    value.getFullYear(),
  ].join('');
};

const getDraftDateLabel = (
  value: Date,
  today: Date,
): string => {
  if (isSameLocalDay(value, today)) {
    return 'Сегодня';
  }

  if (isSameLocalDay(value, addLocalDays(today, 1))) {
    return 'Завтра';
  }

  if (isSameLocalDay(value, addLocalDays(today, 2))) {
    return 'Послезавтра';
  }

  if (isSameLocalDay(value, getNextMonday(today))) {
    return 'В понедельник';
  }

  return 'Выбрано';
};

const createLocalDateTimeValue = (
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

const useViewportWidth = (): number => {
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') {
      return 1280;
    }

    return window.innerWidth;
  });

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
};

const MainApp: React.FC = () => {
  const viewportWidth = useViewportWidth();

  const [currentCard, setCurrentCard] = useState<VisualCard>({
    id: createId(),
    title: 'Продумать движение новой карточки',
    kind: 'single',
    timeMode: 'none',
    createdAt: new Date().toISOString(),
  });

  const [creationState, setCreationState] =
    useState<CreationState>('idle');
  const [draftTitle, setDraftTitle] = useState('');
  const [selectedKind, setSelectedKind] = useState<CardKind | null>(null);
  const [draftStep, setDraftStep] = useState<DraftStep>('title');
  const [timeMode, setTimeMode] = useState<TimeMode | null>(null);
  const [dateTimeValue, setDateTimeValue] = useState('');
  const [selectedDraftDate, setSelectedDraftDate] = useState(() =>
    startOfLocalDay(getNextFiveMinuteSlot()),
  );
  const [draftHour, setDraftHour] = useState(
    () => getNextFiveMinuteSlot().getHours(),
  );
  const [draftMinute, setDraftMinute] = useState(
    () => getNextFiveMinuteSlot().getMinutes(),
  );
  const [draftHourInput, setDraftHourInput] = useState(
    () => padNumber(getNextFiveMinuteSlot().getHours()),
  );
  const [draftMinuteInput, setDraftMinuteInput] = useState(
    () => padNumber(getNextFiveMinuteSlot().getMinutes()),
  );
  const [calendarView, setCalendarView] = useState(() => {
    const initialDate = getNextFiveMinuteSlot();
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const [isManualCalendarOpen, setIsManualCalendarOpen] =
    useState(false);
  const [creationCycle, setCreationCycle] = useState(0);
  const [isGhostHovered, setIsGhostHovered] = useState(false);
  const [detachedCoupon, setDetachedCoupon] =
    useState<DetachedCoupon | null>(null);

  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const commitTimerRef = useRef<number | null>(null);

  const isCreating = creationState !== 'idle';
  const currentCardExitX = Math.max(520, viewportWidth * 0.72);
  const draftPalette = PALETTES[timeMode ?? 'none'];

  const currentDraftDay = startOfLocalDay(new Date());
  const currentDraftMonth = new Date(
    currentDraftDay.getFullYear(),
    currentDraftDay.getMonth(),
    1,
  );
  const selectedDraftDateTime = new Date(
    selectedDraftDate.getFullYear(),
    selectedDraftDate.getMonth(),
    selectedDraftDate.getDate(),
    draftHour,
    draftMinute,
    0,
    0,
  );
  const isSelectedDateTimeValid =
    selectedDraftDateTime.getTime() >= Date.now();
  const selectedDateLabel = getDraftDateLabel(
    selectedDraftDate,
    currentDraftDay,
  );
  const datePresets = [
    {
      label: 'Завтра',
      date: addLocalDays(currentDraftDay, 1),
    },
    {
      label: 'Послезавтра',
      date: addLocalDays(currentDraftDay, 2),
    },
    {
      label: 'В понедельник',
      date: getNextMonday(currentDraftDay),
    },
  ];
  const calendarCells = useMemo(() => {
    const year = calendarView.getFullYear();
    const month = calendarView.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: 42 }, (_, index) => {
      const day = index - firstWeekday + 1;
      return day >= 1 && day <= daysInMonth ? day : null;
    });
  }, [calendarView]);
  const canGoToPreviousYear =
    calendarView.getFullYear() > currentDraftDay.getFullYear();
  const canGoToPreviousMonth =
    calendarView.getTime() > currentDraftMonth.getTime();
  const canAdvanceDraft =
    (draftStep === 'title' && Boolean(draftTitle.trim())) ||
    draftStep === 'date' ||
    (draftStep === 'clock' && isSelectedDateTimeValid);

  const resetDraft = useCallback(() => {
    const initialSlot = getNextFiveMinuteSlot();
    const initialDate = startOfLocalDay(initialSlot);

    setDraftTitle('');
    setSelectedKind(null);
    setDraftStep('title');
    setTimeMode(null);
    setDateTimeValue('');
    setSelectedDraftDate(initialDate);
    setDraftHour(initialSlot.getHours());
    setDraftMinute(initialSlot.getMinutes());
    setDraftHourInput(padNumber(initialSlot.getHours()));
    setDraftMinuteInput(padNumber(initialSlot.getMinutes()));
    setCalendarView(
      new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
    );
    setIsManualCalendarOpen(false);
  }, []);

  useEffect(() => {
    if (creationState !== 'editing' || draftStep !== 'title') {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      titleInputRef.current?.focus({ preventScroll: true });
    }, 430);

    return () => window.clearTimeout(focusTimer);
  }, [creationState, draftStep]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && creationState === 'editing') {
        resetDraft();
        setCreationState('idle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [creationState, resetDraft]);

  useEffect(() => {
    return () => {
      if (commitTimerRef.current !== null) {
        window.clearTimeout(commitTimerRef.current);
      }
    };
  }, []);

  const handleStartCreating = () => {
    if (creationState !== 'idle') {
      return;
    }

    resetDraft();
    setIsGhostHovered(false);
    setCreationState('editing');
  };

  const handleCancelCreating = () => {
    if (creationState !== 'editing') {
      return;
    }

    resetDraft();
    setCreationState('idle');
  };

  const handleSelectKind = (kind: CardKind) => {
    if (kind !== 'single') {
      return;
    }

    setSelectedKind('single');
    setTimeMode(null);
    setDateTimeValue('');
    setDraftStep('time');
  };

  const handleCreateCard = (
    event?: React.FormEvent,
    forcedTimeMode?: TimeMode,
    forcedDateTimeValue?: string,
  ) => {
    event?.preventDefault();
    const creationTimeMode = forcedTimeMode ?? timeMode;
    const creationDateTimeValue =
      forcedDateTimeValue ?? dateTimeValue;
    const isReadyToCreate =
      creationState === 'editing' &&
      Boolean(draftTitle.trim()) &&
      selectedKind === 'single' &&
      Boolean(creationTimeMode) &&
      (creationTimeMode === 'none' ||
        Boolean(creationDateTimeValue));

    if (!isReadyToCreate || !creationTimeMode) {
      return;
    }

    setCreationState('committing');

    commitTimerRef.current = window.setTimeout(() => {
      const storedDate = creationDateTimeValue
        ? new Date(creationDateTimeValue).toISOString()
        : undefined;

      setCurrentCard({
        id: createId(),
        title: draftTitle.trim(),
        kind: 'single',
        timeMode: creationTimeMode,
        deadlineAt:
          creationTimeMode === 'deadline' ? storedDate : undefined,
        reminderAt:
          creationTimeMode === 'reminder' ? storedDate : undefined,
        createdAt: new Date().toISOString(),
      });

      resetDraft();
      setCreationCycle((previous) => previous + 1);
      setCreationState('idle');
    }, 340);
  };

  const handleSelectTimeMode = (mode: TimeMode) => {
    setTimeMode(mode);

    if (mode === 'none') {
      setDateTimeValue('');
      setDraftStep('confirm');
      commitTimerRef.current = window.setTimeout(() => {
        handleCreateCard(undefined, 'none');
      }, 110);
      return;
    }

    const initialSlot = getNextFiveMinuteSlot();
    const initialDate = startOfLocalDay(initialSlot);

    setSelectedDraftDate(initialDate);
    setDraftHour(initialSlot.getHours());
    setDraftMinute(initialSlot.getMinutes());
    setDraftHourInput(padNumber(initialSlot.getHours()));
    setDraftMinuteInput(padNumber(initialSlot.getMinutes()));
    setCalendarView(
      new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
    );
    setIsManualCalendarOpen(false);
    setDateTimeValue(
      createLocalDateTimeValue(
        initialDate,
        initialSlot.getHours(),
        initialSlot.getMinutes(),
      ),
    );
    setDraftStep('date');
  };

  const handleSelectDraftDate = (date: Date) => {
    const nextDate = startOfLocalDay(date);

    if (nextDate.getTime() < currentDraftDay.getTime()) {
      return;
    }

    setSelectedDraftDate(nextDate);
    setDateTimeValue(
      createLocalDateTimeValue(
        nextDate,
        draftHour,
        draftMinute,
      ),
    );
  };

  const handleOpenManualCalendar = () => {
    setCalendarView(
      new Date(
        selectedDraftDate.getFullYear(),
        selectedDraftDate.getMonth(),
        1,
      ),
    );
    setIsManualCalendarOpen(true);
  };

  const handleChangeCalendarMonth = (direction: -1 | 1) => {
    const nextView = new Date(
      calendarView.getFullYear(),
      calendarView.getMonth() + direction,
      1,
    );

    if (nextView.getTime() < currentDraftMonth.getTime()) {
      return;
    }

    setCalendarView(nextView);
  };

  const handleChangeCalendarYear = (direction: -1 | 1) => {
    const nextYear = calendarView.getFullYear() + direction;

    if (nextYear < currentDraftDay.getFullYear()) {
      return;
    }

    const nextMonth =
      nextYear === currentDraftDay.getFullYear()
        ? currentDraftDay.getMonth()
        : 0;

    setCalendarView(new Date(nextYear, nextMonth, 1));
  };

  const applyDraftTime = (
    nextHour: number,
    nextMinute: number,
    direction: number,
  ) => {
    const candidate = new Date(
      selectedDraftDate.getFullYear(),
      selectedDraftDate.getMonth(),
      selectedDraftDate.getDate(),
      nextHour,
      nextMinute,
      0,
      0,
    );

    if (candidate.getTime() < Date.now()) {
      if (direction > 0) {
        const minimumSlot = getNextFiveMinuteSlot();

        if (isSameLocalDay(minimumSlot, selectedDraftDate)) {
          setDraftHour(minimumSlot.getHours());
          setDraftMinute(minimumSlot.getMinutes());
          setDraftHourInput(padNumber(minimumSlot.getHours()));
          setDraftMinuteInput(padNumber(minimumSlot.getMinutes()));
          setDateTimeValue(
            createLocalDateTimeValue(
              selectedDraftDate,
              minimumSlot.getHours(),
              minimumSlot.getMinutes(),
            ),
          );
        }
      }

      return;
    }

    setDraftHour(nextHour);
    setDraftMinute(nextMinute);
    setDraftHourInput(padNumber(nextHour));
    setDraftMinuteInput(padNumber(nextMinute));
    setDateTimeValue(
      createLocalDateTimeValue(
        selectedDraftDate,
        nextHour,
        nextMinute,
      ),
    );
  };

  const handleAdjustDraftHour = (direction: -1 | 1) => {
    const nextHour = (draftHour + direction + 24) % 24;
    applyDraftTime(nextHour, draftMinute, direction);
  };

  const handleAdjustDraftMinute = (direction: -5 | 5) => {
    const nextMinute = (draftMinute + direction + 60) % 60;
    applyDraftTime(draftHour, nextMinute, direction);
  };

  const handleDraftTimeInputChange = (
    part: 'hour' | 'minute',
    value: string,
  ) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 2);

    if (part === 'hour') {
      setDraftHourInput(numericValue);
      return;
    }

    setDraftMinuteInput(numericValue);
  };

  const handleCommitDraftTimeInput = (
    part: 'hour' | 'minute',
  ) => {
    const rawValue =
      part === 'hour' ? draftHourInput : draftMinuteInput;
    const fallbackValue =
      part === 'hour' ? draftHour : draftMinute;
    const maximumValue = part === 'hour' ? 23 : 59;
    const parsedValue =
      rawValue === '' ? fallbackValue : Number(rawValue);
    const normalizedValue = Math.min(
      maximumValue,
      Math.max(0, parsedValue),
    );
    let nextHour =
      part === 'hour' ? normalizedValue : draftHour;
    let nextMinute =
      part === 'minute' ? normalizedValue : draftMinute;
    const candidate = new Date(
      selectedDraftDate.getFullYear(),
      selectedDraftDate.getMonth(),
      selectedDraftDate.getDate(),
      nextHour,
      nextMinute,
      0,
      0,
    );

    if (candidate.getTime() < Date.now()) {
      const minimumSlot = getNextFiveMinuteSlot();

      if (isSameLocalDay(minimumSlot, selectedDraftDate)) {
        nextHour = minimumSlot.getHours();
        nextMinute = minimumSlot.getMinutes();
      } else {
        nextHour = draftHour;
        nextMinute = draftMinute;
      }
    }

    setDraftHour(nextHour);
    setDraftMinute(nextMinute);
    setDraftHourInput(padNumber(nextHour));
    setDraftMinuteInput(padNumber(nextMinute));
    setDateTimeValue(
      createLocalDateTimeValue(
        selectedDraftDate,
        nextHour,
        nextMinute,
      ),
    );
  };

  const handleDraftBack = () => {
    if (draftStep === 'kind') {
      setDraftStep('title');
      return;
    }

    if (draftStep === 'time') {
      setSelectedKind(null);
      setTimeMode(null);
      setDateTimeValue('');
      setDraftStep('kind');
      return;
    }

    if (draftStep === 'date') {
      setTimeMode(null);
      setDraftStep('time');
      return;
    }

    if (draftStep === 'clock') {
      setDraftStep('date');
    }
  };

  const handleDraftNext = () => {
    if (draftStep === 'title' && draftTitle.trim()) {
      setDraftStep('kind');
      return;
    }

    if (draftStep === 'date') {
      setDateTimeValue(
        createLocalDateTimeValue(
          selectedDraftDate,
          draftHour,
          draftMinute,
        ),
      );
      setDraftStep('clock');
      return;
    }

    if (draftStep !== 'clock' || !timeMode) {
      return;
    }

    const finalDateTimeValue = createLocalDateTimeValue(
      selectedDraftDate,
      draftHour,
      draftMinute,
    );
    const finalDateTime = new Date(finalDateTimeValue);

    if (finalDateTime.getTime() < Date.now()) {
      return;
    }

    setDateTimeValue(finalDateTimeValue);
    setDraftStep('confirm');
    commitTimerRef.current = window.setTimeout(() => {
      handleCreateCard(
        undefined,
        timeMode,
        finalDateTimeValue,
      );
    }, 110);
  };

  const handleCompleteCard = (couponBounds: DOMRect) => {
    if (currentCard.completedAt) {
      return;
    }

    setDetachedCoupon({
      id: currentCard.id,
      left: couponBounds.left,
      top: couponBounds.top,
      width: couponBounds.width,
      height: couponBounds.height,
      palette: PALETTES[currentCard.timeMode],
    });

    setCurrentCard((previous) => ({
      ...previous,
      completedAt: new Date().toISOString(),
    }));
  };

  return (
    <main className="relative h-full w-full overflow-hidden">
      <TableBackground />

      <div className="relative z-10 flex h-full w-full items-center justify-center px-4 py-8">
        <div
          className="relative w-[280px] max-w-[78vw]"
          style={{
            aspectRatio: '9 / 16',
            maxHeight: '78vh',
          }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={currentCard.id}
              initial={{
                opacity: 0,
                y: 18,
                rotate: -1.5,
                scale: 0.96,
              }}
              animate={
                isCreating
                  ? {
                      x: currentCardExitX,
                      y: -125,
                      rotate: 15,
                      scale: 0.86,
                      opacity: 0,
                      filter: 'blur(2px) saturate(0.65)',
                    }
                  : {
                      x: 0,
                      y: 0,
                      rotate: 0,
                      scale: 1,
                      opacity: 1,
                      filter: 'blur(0px) saturate(1)',
                    }
              }
              exit={{
                x: currentCardExitX,
                y: -125,
                rotate: 15,
                scale: 0.86,
                opacity: 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 185,
                damping: 21,
                mass: 0.9,
              }}
              className="absolute inset-0"
              style={{
                zIndex: 20,
                pointerEvents: isCreating ? 'none' : 'auto',
              }}
            >
              <TaskCard card={currentCard} onComplete={handleCompleteCard} />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {creationState === 'idle' && (
              <motion.div
                key={`ghost-border-${creationCycle}`}
                initial={{
                  x: GHOST_SETTINGS.x,
                  y: GHOST_SETTINGS.y,
                  rotate: GHOST_SETTINGS.rotate,
                  scale: GHOST_SETTINGS.scale,
                  opacity: 0,
                }}
                animate={{
                  x: GHOST_SETTINGS.x,
                  y: GHOST_SETTINGS.y,
                  rotate: GHOST_SETTINGS.rotate,
                  scale: GHOST_SETTINGS.scale,
                  opacity: 1,
                }}
                exit={{ opacity: 0 }}
                transition={PHYSICAL_SPRING}
                className="absolute inset-0"
                style={{
                  zIndex: 13,
                  pointerEvents: 'none',
                  borderRadius: `${CARD_RADIUS}px`,
                  border: '1.7px dashed rgba(239,232,216,1)',
                  boxSizing: 'border-box',
                  filter: isGhostHovered
                    ? 'brightness(1.14) drop-shadow(0 1px 0 rgba(0,0,0,0.3))'
                    : 'brightness(1) drop-shadow(0 1px 0 rgba(0,0,0,0.3))',
                  transformOrigin: 'center center',
                }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence initial={false} mode="sync">
            {creationState === 'idle' ? (
              <motion.div
                key={`ghost-${creationCycle}`}
                initial={{
                  opacity: 0,
                  x: GHOST_SETTINGS.x,
                  y: GHOST_SETTINGS.y,
                  rotate: GHOST_SETTINGS.rotate,
                  scale: GHOST_SETTINGS.scale,
                }}
                animate={{
                  opacity: 1,
                  x: GHOST_SETTINGS.x,
                  y: GHOST_SETTINGS.y,
                  rotate: GHOST_SETTINGS.rotate,
                  scale: GHOST_SETTINGS.scale,
                }}
                exit={{ opacity: 0 }}
                transition={PHYSICAL_SPRING}
                onHoverStart={() => setIsGhostHovered(true)}
                onHoverEnd={() => setIsGhostHovered(false)}
                className="absolute inset-0"
                style={{
                  zIndex: 10,
                  transformOrigin: 'center center',
                }}
              >
                <motion.div
                  className="absolute inset-0 overflow-hidden"
                  animate={{
                    opacity: isGhostHovered
                      ? Math.min(0.52, GHOST_SETTINGS.opacity + 0.14)
                      : GHOST_SETTINGS.opacity,
                    filter: isGhostHovered
                      ? 'saturate(0.72) brightness(1.05)'
                      : 'saturate(0.42) brightness(0.94)',
                    boxShadow: isGhostHovered
                      ? `
                          12px 20px 38px rgba(0,0,0,0.28),
                          inset 2px 2px 5px rgba(255,255,255,0.24),
                          inset -2px -2px 5px rgba(0,0,0,0.15)
                        `
                      : GHOST_SHADOW,
                  }}
                  transition={{ duration: 0.18 }}
                  style={{
                    borderRadius: `${CARD_RADIUS}px`,
                    backgroundColor: PALETTES.none.paper,
                    backgroundImage: `url(${cardboardTexture})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundBlendMode: 'multiply',
                  }}
                />

                <button
                  type="button"
                  onClick={handleStartCreating}
                  onFocus={() => setIsGhostHovered(true)}
                  onBlur={() => setIsGhostHovered(false)}
                  className="absolute inset-0 cursor-pointer border-0 bg-transparent p-0"
                  aria-label="Добавить карту"
                >
                  <motion.span
                    animate={{
                      opacity: isGhostHovered ? 1 : 0.78,
                      scale: isGhostHovered ? 1.015 : 1,
                    }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-[17px] top-[15px] flex select-none items-center gap-2 text-left"
                  >
                    <span
                      className="font-serif text-[26px] font-light leading-none"
                      style={{
                        color: 'rgba(20,18,16,0.48)',
                        textShadow: `
                          -1px -1px 1px rgba(0,0,0,0.44),
                          1px 1px 1px rgba(255,255,255,0.54)
                        `,
                      }}
                    >
                      +
                    </span>

                    <span
                      className="max-w-[88px] font-mono text-[8px] font-semibold uppercase leading-[1.2] tracking-[0.11em]"
                      style={{
                        color: 'rgba(20,18,16,0.48)',
                        textShadow: `
                          -1px -1px 1px rgba(0,0,0,0.42),
                          1px 1px 1px rgba(255,255,255,0.52)
                        `,
                      }}
                    >
                      Добавить
                      <br />
                      карту
                    </span>
                  </motion.span>
                </button>
              </motion.div>
            ) : (
                <motion.form
                key={`draft-${creationCycle}`}
                onSubmit={handleCreateCard}
                initial={{
                  x: GHOST_SETTINGS.x,
                  y: GHOST_SETTINGS.y,
                  rotate: GHOST_SETTINGS.rotate,
                  scale: GHOST_SETTINGS.scale,
                  opacity: GHOST_SETTINGS.opacity,
                  filter: 'saturate(0.45) brightness(0.96)',
                  boxShadow: GHOST_SHADOW,
                  backgroundColor: PALETTES.none.paper,
                }}
                animate={
                  creationState === 'committing'
                    ? {
                        x: 0,
                        y: 4,
                        rotate: 0,
                        scale: 0.988,
                        opacity: 1,
                        filter: 'saturate(1) brightness(1)',
                        boxShadow: CARD_SHADOW,
                        backgroundColor: draftPalette.paper,
                      }
                    : {
                        x: 0,
                        y: 0,
                        rotate: 0,
                        scale: 1,
                        opacity: 1,
                        filter: 'saturate(1) brightness(1)',
                        boxShadow: DRAFT_SHADOW,
                        backgroundColor: draftPalette.paper,
                      }
                }
                exit={{ opacity: 0, scale: 0.985 }}
                transition={PHYSICAL_SPRING}
                className="absolute inset-0 flex flex-col overflow-hidden"
                style={{
                  zIndex: 40,
                  borderRadius: `${CARD_RADIUS}px`,
                  padding: '23px 20px 20px',
                  backgroundImage: `
                    radial-gradient(
                      circle at 14% 8%,
                      rgba(255,255,255,0.24) 0%,
                      rgba(255,255,255,0.06) 34%,
                      transparent 58%
                    ),
                    linear-gradient(
                      142deg,
                      rgba(255,255,255,0.08) 0%,
                      transparent 46%,
                      rgba(49,34,23,0.13) 100%
                    ),
                    url(${cardboardTexture})
                  `,
                  backgroundPosition: 'center, center, center',
                  backgroundSize: '100% 100%, 100% 100%, cover',
                  backgroundBlendMode: 'soft-light, multiply, multiply',
                  border: '1px solid rgba(70,52,38,0.24)',
                  transformOrigin: 'center center',
                }}
              >
                <DraftCardHeader
                  palette={draftPalette}
                  onCancel={handleCancelCreating}
                  disabled={creationState === 'committing'}
                />

                <div className="relative mt-5 min-h-0 flex-1 overflow-hidden">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      key={draftStep}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        y: -3,
                        transition: { duration: 0.1, ease: 'easeOut' },
                      }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute inset-0 flex flex-col"
                    >
                      {draftStep === 'title' && (
                        <textarea
                          ref={titleInputRef}
                          value={draftTitle}
                          onChange={(event) =>
                            setDraftTitle(event.target.value)
                          }
                          disabled={creationState === 'committing'}
                          rows={2}
                          maxLength={100}
                          placeholder="Что нужно сделать?"
                          className="mt-1 min-h-[138px] w-full resize-none rounded-[6px] border-0 bg-transparent px-1 py-4 text-[1.36rem] font-semibold leading-[1.42] outline-none placeholder:text-black/25 disabled:opacity-50"
                          style={{
                            color: draftPalette.ink,
                            letterSpacing: '-0.018em',
                            backgroundImage:
                              'repeating-linear-gradient(180deg, transparent 0, transparent 35px, rgba(77,58,43,0.14) 36px)',
                            boxShadow:
                              'inset 0 -1px 0 rgba(255,255,255,0.18)',
                          }}
                        />
                      )}

                      {draftStep === 'kind' && (
                        <div>
                          <span
                            className="font-mono text-[13px] font-bold uppercase tracking-[0.17em]"
                            style={{
                              color: 'rgba(30,28,26,0.72)',
                              textShadow: '0 1px 0 rgba(255,255,255,0.28)',
                            }}
                          >
                            Выберите тип
                          </span>
                          <div className="mt-5 grid grid-cols-3 gap-3">
                            <TypeOption
                              index={0}
                              lines={['Одна', 'задача']}
                              selected={selectedKind === 'single'}
                              palette={draftPalette}
                              onClick={() => handleSelectKind('single')}
                            />
                            <TypeOption
                              index={1}
                              lines={['Рутина', '']}
                              hint="Скоро"
                              selected={false}
                              disabled
                              palette={draftPalette}
                              onClick={() => undefined}
                            />
                            <TypeOption
                              index={2}
                              lines={['Список', '']}
                              hint="Скоро"
                              selected={false}
                              disabled
                              palette={draftPalette}
                              onClick={() => undefined}
                            />
                          </div>
                        </div>
                      )}

                      {draftStep === 'time' && (
                        <div>
                          <span
                            className="font-mono text-[13px] font-bold uppercase tracking-[0.17em]"
                            style={{
                              color: 'rgba(30,28,26,0.72)',
                              textShadow: '0 1px 0 rgba(255,255,255,0.28)',
                            }}
                          >
                            Когда?
                          </span>
                          <div className="mt-5 grid grid-cols-3 gap-2">
                            <TimeOption
                              index={0}
                              lines={['Без', 'времени']}
                              selected={timeMode === 'none'}
                              palette={PALETTES.none}
                              onClick={() => handleSelectTimeMode('none')}
                            />
                            <TimeOption
                              index={1}
                              lines={['Выполнить', 'до:']}
                              selected={timeMode === 'deadline'}
                              palette={PALETTES.deadline}
                              onClick={() =>
                                handleSelectTimeMode('deadline')
                              }
                            />
                            <TimeOption
                              index={2}
                              lines={['Напоминание', '']}
                              selected={timeMode === 'reminder'}
                              palette={PALETTES.reminder}
                              onClick={() =>
                                handleSelectTimeMode('reminder')
                              }
                            />
                          </div>
                        </div>
                      )}

                      {draftStep === 'date' && (
                        <div className="min-h-0 flex-1">
                          <span
                            className="font-mono text-[13px] font-bold uppercase tracking-[0.17em]"
                            style={{
                              color: 'rgba(30,28,26,0.72)',
                              textShadow: '0 1px 0 rgba(255,255,255,0.28)',
                            }}
                          >
                            Дата
                          </span>

                          <div
                            className="mt-3 rounded-[10px] px-3 py-2.5 text-center"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.08)',
                              boxShadow:
                                'inset 0 1px 3px rgba(43,31,23,0.12), 0 1px 0 rgba(255,255,255,0.18)',
                            }}
                          >
                            <span
                              className="font-mono text-[10px] font-bold uppercase tracking-[0.1em]"
                              style={{ color: draftPalette.ink }}
                            >
                              {selectedDateLabel} ·{' '}
                              {formatDraftDate(selectedDraftDate)}
                            </span>
                          </div>

                          {!isManualCalendarOpen ? (
                            <div className="mt-4 grid grid-cols-2 gap-2">
                              {datePresets.map((preset) => (
                                <motion.button
                                  key={preset.label}
                                  type="button"
                                  onClick={() =>
                                    handleSelectDraftDate(preset.date)
                                  }
                                  whileHover={{
                                    y: -1,
                                    filter: 'brightness(1.025)',
                                  }}
                                  whileTap={{
                                    y: 2,
                                    boxShadow:
                                      'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
                                    transition: {
                                      duration: 0.07,
                                      ease: 'easeOut',
                                    },
                                  }}
                                  className="min-h-[43px] rounded-[10px] border-0 px-2 py-2 font-mono text-[8px] font-semibold uppercase tracking-[0.09em]"
                                  style={{
                                    color: 'rgba(30,28,26,0.68)',
                                    backgroundColor:
                                      'rgba(245,236,218,0.16)',
                                    backgroundImage:
                                      'url(' + cardboardTexture + ')',
                                    backgroundPosition: 'center',
                                    backgroundSize: 'cover',
                                    backgroundBlendMode: 'multiply',
                                    border:
                                      '1px solid rgba(70,52,38,0.28)',
                                    boxShadow:
                                      '0 2px 0 rgba(83,61,43,0.28), 0 4px 6px rgba(0,0,0,0.1), inset 1px 1px 1px rgba(255,255,255,0.22)',
                                  }}
                                >
                                  {preset.label}
                                </motion.button>
                              ))}

                              <motion.button
                                type="button"
                                onClick={handleOpenManualCalendar}
                                whileHover={{
                                  y: -1,
                                  filter: 'brightness(1.025)',
                                }}
                                whileTap={{
                                  y: 2,
                                  boxShadow:
                                    'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
                                  transition: {
                                    duration: 0.07,
                                    ease: 'easeOut',
                                  },
                                }}
                                className="min-h-[43px] rounded-[10px] border-0 px-2 py-2 font-mono text-[8px] font-semibold uppercase tracking-[0.09em]"
                                style={{
                                  color: 'rgba(30,28,26,0.68)',
                                  backgroundColor:
                                    'rgba(245,236,218,0.16)',
                                  backgroundImage:
                                    'url(' + cardboardTexture + ')',
                                  backgroundPosition: 'center',
                                  backgroundSize: 'cover',
                                  backgroundBlendMode: 'multiply',
                                  border:
                                    '1px solid rgba(70,52,38,0.28)',
                                  boxShadow:
                                    '0 2px 0 rgba(83,61,43,0.28), 0 4px 6px rgba(0,0,0,0.1), inset 1px 1px 1px rgba(255,255,255,0.22)',
                                }}
                              >
                                Вручную
                              </motion.button>
                            </div>
                          ) : (
                            <div
                              className="mt-2 rounded-[12px] px-2 py-2"
                              style={{
                                backgroundColor: 'rgba(255,255,255,0.07)',
                                boxShadow:
                                  'inset 0 2px 5px rgba(48,34,24,0.11), 0 1px 0 rgba(255,255,255,0.16)',
                              }}
                            >
                              <div className="grid grid-cols-[30px_1fr_30px] items-center">
                                <button
                                  type="button"
                                  onClick={() => handleChangeCalendarYear(-1)}
                                  disabled={!canGoToPreviousYear}
                                  className="h-[28px] rounded-[8px] border-0 bg-transparent font-mono text-[14px] disabled:opacity-0"
                                  style={{ color: draftPalette.accentDark }}
                                  aria-label="Предыдущий год"
                                >
                                  ←
                                </button>
                                <span
                                  className="text-center font-mono text-[10px] font-bold tracking-[0.14em]"
                                  style={{ color: draftPalette.ink }}
                                >
                                  {calendarView.getFullYear()}
                                </span>
                                <motion.button
                                  type="button"
                                  onClick={() => handleChangeCalendarYear(1)}
                                  whileTap={{
                                    y: 1,
                                    transition: { duration: 0.07 },
                                  }}
                                  className="h-[28px] rounded-[8px] border-0 bg-transparent font-mono text-[14px]"
                                  style={{ color: draftPalette.accentDark }}
                                  aria-label="Следующий год"
                                >
                                  →
                                </motion.button>
                              </div>

                              <div className="grid grid-cols-[30px_1fr_30px] items-center">
                                <button
                                  type="button"
                                  onClick={() => handleChangeCalendarMonth(-1)}
                                  disabled={!canGoToPreviousMonth}
                                  className="h-[28px] rounded-[8px] border-0 bg-transparent font-mono text-[14px] disabled:opacity-0"
                                  style={{ color: draftPalette.accentDark }}
                                  aria-label="Предыдущий месяц"
                                >
                                  ←
                                </button>
                                <span
                                  className="text-center font-mono text-[9px] font-bold uppercase tracking-[0.13em]"
                                  style={{ color: draftPalette.ink }}
                                >
                                  {MONTH_NAMES_RU[calendarView.getMonth()]}
                                </span>
                                <motion.button
                                  type="button"
                                  onClick={() => handleChangeCalendarMonth(1)}
                                  whileTap={{
                                    y: 1,
                                    transition: { duration: 0.07 },
                                  }}
                                  className="h-[28px] rounded-[8px] border-0 bg-transparent font-mono text-[14px]"
                                  style={{ color: draftPalette.accentDark }}
                                  aria-label="Следующий месяц"
                                >
                                  →
                                </motion.button>
                              </div>

                              <div className="mt-1 grid grid-cols-7 gap-[2px]">
                                {WEEKDAYS_RU.map((weekday) => (
                                  <span
                                    key={weekday}
                                    className="text-center font-mono text-[6px] font-semibold uppercase"
                                    style={{
                                      color: 'rgba(30,28,26,0.42)',
                                    }}
                                  >
                                    {weekday}
                                  </span>
                                ))}

                                {calendarCells.map((day, index) => {
                                  if (day === null) {
                                    return (
                                      <span
                                        key={'blank-' + index}
                                        className="h-[24px]"
                                      />
                                    );
                                  }

                                  const dayValue = new Date(
                                    calendarView.getFullYear(),
                                    calendarView.getMonth(),
                                    day,
                                  );
                                  const isPast =
                                    dayValue.getTime() <
                                    currentDraftDay.getTime();
                                  const isToday = isSameLocalDay(
                                    dayValue,
                                    currentDraftDay,
                                  );
                                  const isSelected = isSameLocalDay(
                                    dayValue,
                                    selectedDraftDate,
                                  );

                                  return (
                                    <motion.button
                                      key={day}
                                      type="button"
                                      disabled={isPast}
                                      onClick={() =>
                                        handleSelectDraftDate(dayValue)
                                      }
                                      whileTap={
                                        isPast
                                          ? undefined
                                          : {
                                              y: 1,
                                              transition: {
                                                duration: 0.06,
                                              },
                                            }
                                      }
                                      className="h-[24px] rounded-[7px] border-0 p-0 text-center font-mono text-[8px] font-semibold disabled:cursor-default"
                                      style={{
                                        color: isSelected
                                          ? '#FFFFFF'
                                          : isPast
                                            ? 'rgba(30,28,26,0.22)'
                                            : draftPalette.ink,
                                        backgroundColor: isSelected
                                          ? draftPalette.accent
                                          : 'transparent',
                                        border: isToday
                                          ? '1px solid ' +
                                            draftPalette.accent +
                                            '99'
                                          : '1px solid transparent',
                                        boxShadow: isSelected
                                          ? 'inset 1px 1px 2px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)'
                                          : 'none',
                                      }}
                                    >
                                      {day}
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {draftStep === 'clock' && (
                        <div className="min-h-0 flex-1">
                          <span
                            className="font-mono text-[13px] font-bold uppercase tracking-[0.17em]"
                            style={{
                              color: 'rgba(30,28,26,0.72)',
                              textShadow: '0 1px 0 rgba(255,255,255,0.28)',
                            }}
                          >
                            Время
                          </span>

                          <div
                            className="mt-3 flex items-center justify-center gap-2 font-mono text-[2rem] font-bold tracking-[0.08em]"
                            style={{
                              color: draftPalette.ink,
                              textShadow: '0 1px 0 rgba(255,255,255,0.28)',
                            }}
                          >
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={2}
                              value={draftHourInput}
                              onFocus={(event) =>
                                event.currentTarget.select()
                              }
                              onChange={(event) =>
                                handleDraftTimeInputChange(
                                  'hour',
                                  event.target.value,
                                )
                              }
                              onBlur={() =>
                                handleCommitDraftTimeInput('hour')
                              }
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.currentTarget.blur();
                                }
                              }}
                              className="h-[48px] w-[64px] rounded-[10px] border-0 bg-transparent p-0 text-center font-mono text-[2rem] font-bold outline-none focus:bg-black/[0.04]"
                              style={{
                                color: draftPalette.ink,
                                caretColor: draftPalette.accentDark,
                                boxShadow:
                                  'inset 0 1px 3px rgba(48,34,24,0.13), 0 1px 0 rgba(255,255,255,0.18)',
                              }}
                              aria-label="Часы"
                            />
                            <span aria-hidden="true">:</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={2}
                              value={draftMinuteInput}
                              onFocus={(event) =>
                                event.currentTarget.select()
                              }
                              onChange={(event) =>
                                handleDraftTimeInputChange(
                                  'minute',
                                  event.target.value,
                                )
                              }
                              onBlur={() =>
                                handleCommitDraftTimeInput('minute')
                              }
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.currentTarget.blur();
                                }
                              }}
                              className="h-[48px] w-[64px] rounded-[10px] border-0 bg-transparent p-0 text-center font-mono text-[2rem] font-bold outline-none focus:bg-black/[0.04]"
                              style={{
                                color: draftPalette.ink,
                                caretColor: draftPalette.accentDark,
                                boxShadow:
                                  'inset 0 1px 3px rgba(48,34,24,0.13), 0 1px 0 rgba(255,255,255,0.18)',
                              }}
                              aria-label="Минуты"
                            />
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-4">
                            {[
                              {
                                label: 'Часы',
                                onIncrease: () => handleAdjustDraftHour(1),
                                onDecrease: () => handleAdjustDraftHour(-1),
                              },
                              {
                                label: 'Минуты',
                                onIncrease: () => handleAdjustDraftMinute(5),
                                onDecrease: () => handleAdjustDraftMinute(-5),
                              },
                            ].map((control) => (
                              <div
                                key={control.label}
                                className="flex flex-col items-center"
                              >
                                <motion.button
                                  type="button"
                                  onClick={control.onIncrease}
                                  whileTap={{
                                    y: 2,
                                    boxShadow:
                                      'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
                                    transition: { duration: 0.07 },
                                  }}
                                  className="min-h-[42px] w-full rounded-[10px] border-0 font-mono text-[18px] font-bold"
                                  style={{
                                    color: draftPalette.ink,
                                    backgroundColor:
                                      'rgba(245,236,218,0.16)',
                                    backgroundImage:
                                      'url(' + cardboardTexture + ')',
                                    backgroundPosition: 'center',
                                    backgroundSize: 'cover',
                                    backgroundBlendMode: 'multiply',
                                    border:
                                      '1px solid rgba(70,52,38,0.28)',
                                    boxShadow:
                                      '0 3px 0 rgba(83,61,43,0.3), 0 5px 7px rgba(0,0,0,0.1)',
                                  }}
                                >
                                  +
                                </motion.button>
                                <span
                                  className="my-2 font-mono text-[8px] font-semibold uppercase tracking-[0.13em]"
                                  style={{
                                    color: 'rgba(30,28,26,0.52)',
                                  }}
                                >
                                  {control.label}
                                </span>
                                <motion.button
                                  type="button"
                                  onClick={control.onDecrease}
                                  whileTap={{
                                    y: 2,
                                    boxShadow:
                                      'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
                                    transition: { duration: 0.07 },
                                  }}
                                  className="min-h-[42px] w-full rounded-[10px] border-0 font-mono text-[18px] font-bold"
                                  style={{
                                    color: draftPalette.ink,
                                    backgroundColor:
                                      'rgba(245,236,218,0.16)',
                                    backgroundImage:
                                      'url(' + cardboardTexture + ')',
                                    backgroundPosition: 'center',
                                    backgroundSize: 'cover',
                                    backgroundBlendMode: 'multiply',
                                    border:
                                      '1px solid rgba(70,52,38,0.28)',
                                    boxShadow:
                                      '0 3px 0 rgba(83,61,43,0.3), 0 5px 7px rgba(0,0,0,0.1)',
                                  }}
                                >
                                  −
                                </motion.button>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-2">
                            {[0, 1, 2].map((slot) => (
                              <div
                                key={slot}
                                className="flex min-h-[34px] items-center justify-center rounded-[9px] font-mono text-[6px] font-semibold uppercase tracking-[0.1em]"
                                style={{
                                  color: 'rgba(30,28,26,0.28)',
                                  border:
                                    '1px dashed rgba(70,52,38,0.22)',
                                  backgroundColor:
                                    'rgba(255,255,255,0.04)',
                                }}
                              >
                                Пресет
                              </div>
                            ))}
                          </div>

                          <div
                            className="mt-2 min-h-[14px] text-center font-mono text-[7px] uppercase tracking-[0.08em]"
                            style={{
                              color: isSelectedDateTimeValid
                                ? 'transparent'
                                : draftPalette.accentDark,
                            }}
                          >
                            Выберите будущее время
                          </div>
                        </div>
                      )}

                      <div className="mt-auto flex min-h-[58px] shrink-0 items-end justify-between gap-3 pt-4">
                        <div className="w-[108px]">
                          {draftStep !== 'title' &&
                            draftStep !== 'confirm' && (
                              <motion.button
                                type="button"
                                onClick={handleDraftBack}
                                disabled={creationState === 'committing'}
                                whileHover={{
                                  y: -1,
                                  filter: 'brightness(1.025)',
                                }}
                                whileTap={{
                                  y: 2,
                                  filter: 'brightness(0.98)',
                                  boxShadow:
                                    'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
                                  transition: {
                                    duration: 0.07,
                                    ease: 'easeOut',
                                  },
                                }}
                                className="min-h-[46px] w-full rounded-[11px] border-0 px-4 py-3 font-mono text-[9px] font-semibold uppercase tracking-[0.13em] disabled:opacity-40"
                                style={{
                                  color: 'rgba(30,28,26,0.68)',
                                  backgroundColor:
                                    'rgba(245,236,218,0.16)',
                                  backgroundImage:
                                    'url(' + cardboardTexture + ')',
                                  backgroundPosition: 'center',
                                  backgroundSize: 'cover',
                                  backgroundBlendMode: 'multiply',
                                  border:
                                    '1px solid rgba(70,52,38,0.28)',
                                  boxShadow:
                                    '0 3px 0 rgba(83,61,43,0.3), 0 5px 7px rgba(0,0,0,0.12), inset 1px 1px 1px rgba(255,255,255,0.24)',
                                }}
                              >
                                ← Назад
                              </motion.button>
                            )}
                        </div>

                        <div className="w-[108px]">
                          <AnimatePresence>
                            {canAdvanceDraft && (
                              <motion.button
                                type="button"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.16 }}
                                whileHover={{
                                  y: -1,
                                  filter: 'brightness(1.025)',
                                }}
                                whileTap={{
                                  y: 2,
                                  filter: 'brightness(0.98)',
                                  boxShadow:
                                    'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
                                  transition: {
                                    duration: 0.07,
                                    ease: 'easeOut',
                                  },
                                }}
                                onClick={handleDraftNext}
                                className="min-h-[46px] w-full rounded-[11px] border-0 px-4 py-3 font-mono text-[9px] font-semibold uppercase tracking-[0.13em]"
                                style={{
                                  color: 'rgba(30,28,26,0.68)',
                                  backgroundColor:
                                    'rgba(245,236,218,0.16)',
                                  backgroundImage:
                                    'url(' + cardboardTexture + ')',
                                  backgroundPosition: 'center',
                                  backgroundSize: 'cover',
                                  backgroundBlendMode: 'multiply',
                                  border:
                                    '1px solid rgba(70,52,38,0.28)',
                                  boxShadow:
                                    '0 3px 0 rgba(83,61,43,0.3), 0 5px 7px rgba(0,0,0,0.12), inset 1px 1px 1px rgba(255,255,255,0.24)',
                                }}
                              >
                                Дальше →
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {detachedCoupon && (
          <DetachedCompletionCoupon
            key={detachedCoupon.id}
            coupon={detachedCoupon}
            onFlightComplete={() => setDetachedCoupon(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
};


interface DraftCardHeaderProps {
  palette: CardPalette;
  disabled: boolean;
  onCancel: () => void;
}

const DraftCardHeader: React.FC<DraftCardHeaderProps> = ({
  palette,
  disabled,
  onCancel,
}) => {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3">
      <motion.span
        initial={{ opacity: 0, y: -5 }}
        animate={{
          opacity: 1,
          y: 0,
          backgroundColor: palette.paper,
        }}
        transition={{ delay: 0.15, duration: 0.22 }}
        className="inline-flex min-w-[158px] shrink-0 items-center justify-center whitespace-nowrap rounded-[11px] px-[20px] py-[9px] font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{
          width: 'max-content',
          minHeight: '38px',
          color: 'rgba(30,28,26,0.72)',
          backgroundColor: palette.paper,
          backgroundImage:
            'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(52,37,26,0.06) 100%), url(' +
            cardboardTexture +
            ')',
          backgroundPosition: 'center, center',
          backgroundSize: '100% 100%, cover',
          backgroundBlendMode: 'soft-light, multiply',
          border: '1px solid rgba(67,49,35,0.2)',
          boxShadow:
            '0 1px 0 rgba(79,58,41,0.2), 0 2px 4px rgba(0,0,0,0.08), inset 1px 1px 1px rgba(255,255,255,0.24), inset -1px -1px 1px rgba(49,34,24,0.08)',
          textShadow: '0 1px 0 rgba(255,255,255,0.24)',
          filter: 'brightness(0.96) saturate(0.82)',
        }}
      >
        Новая карта
      </motion.span>

      <button
        type="button"
        onClick={onCancel}
        disabled={disabled}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-xl transition hover:bg-black/[0.05] active:scale-95 disabled:opacity-20"
        style={{ color: 'rgba(30,28,26,0.48)' }}
        aria-label="Отменить создание"
      >
        ×
      </button>
    </div>
  );
};

interface TypeOptionProps {
  index: number;
  lines: [string, string];
  hint?: string;
  selected: boolean;
  disabled?: boolean;
  palette: CardPalette;
  onClick: () => void;
}

const TypeOption: React.FC<TypeOptionProps> = ({
  index,
  lines,
  hint,
  selected,
  disabled = false,
  palette,
  onClick,
}) => {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: disabled ? 0.38 : 1,
        y: 0,
        backgroundColor: selected
          ? palette.paper
          : 'rgba(245,236,218,0.16)',
      }}
      transition={{ delay: index * 0.035, duration: 0.18, ease: 'easeOut' }}
      whileHover={
        disabled
          ? undefined
          : { y: -1, filter: 'brightness(1.025)' }
      }
      whileTap={
        disabled
          ? undefined
          : {
              y: 2,
              filter: 'brightness(0.98)',
              boxShadow:
                'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
              transition: { duration: 0.07, ease: 'easeOut' },
            }
      }
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[92px] flex-col items-center justify-center rounded-[13px] px-2 py-3 text-center disabled:cursor-default"
      style={{
        color: selected ? palette.ink : 'rgba(30,28,26,0.68)',
        backgroundImage: 'url(' + cardboardTexture + ')',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundBlendMode: 'multiply',
        border: selected
          ? '1.5px solid rgba(72,53,38,0.48)'
          : '1px solid rgba(70,52,38,0.3)',
        boxShadow: selected
          ? 'inset 1px 2px 5px rgba(51,36,25,0.22), inset -1px -1px 1px rgba(255,255,255,0.2), 0 1px 0 rgba(72,52,37,0.22)'
          : '0 3px 0 rgba(83,61,43,0.28), 0 5px 7px rgba(0,0,0,0.12), inset 1px 1px 1px rgba(255,255,255,0.24), inset -1px -1px 2px rgba(55,39,28,0.1)',
        filter: selected ? 'brightness(0.94)' : 'none',
      }}
      aria-pressed={selected}
    >
      <span className="block text-[11px] font-semibold leading-[1.15]">
        {lines[0]}
      </span>

      <span className="mt-0.5 block min-h-[13px] text-[11px] font-semibold leading-[1.15]">
        {lines[1]}
      </span>

      {hint && (
        <span
          className="mt-1 block font-mono text-[6px] uppercase tracking-[0.08em]"
          style={{ color: 'rgba(30,28,26,0.3)' }}
        >
          {hint}
        </span>
      )}
    </motion.button>
  );
};

interface TimeOptionProps {
  index: number;
  lines: [string, string];
  selected: boolean;
  palette: CardPalette;
  onClick: () => void;
}

const TimeOption: React.FC<TimeOptionProps> = ({
  index,
  lines,
  selected,
  palette,
  onClick,
}) => {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: 1,
        y: 0,
        backgroundColor: selected
          ? palette.paper
          : 'rgba(245,236,218,0.16)',
      }}
      transition={{ delay: index * 0.035, duration: 0.18, ease: 'easeOut' }}
      whileHover={{ y: -1, filter: 'brightness(1.025)' }}
      whileTap={{
        y: 2,
        filter: 'brightness(0.98)',
        boxShadow:
          'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
        transition: { duration: 0.07, ease: 'easeOut' },
      }}
      onClick={onClick}
      className="flex min-h-[88px] flex-col items-center justify-center rounded-[13px] px-1 py-3 text-center"
      style={{
        color: selected ? palette.ink : 'rgba(30,28,26,0.7)',
        backgroundImage: 'url(' + cardboardTexture + ')',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundBlendMode: 'multiply',
        border: selected
          ? '1.5px solid ' + palette.accentDark + '99'
          : '1px solid rgba(70,52,38,0.3)',
        boxShadow: selected
          ? 'inset 1px 2px 4px rgba(51,36,25,0.2), inset -1px -1px 1px rgba(255,255,255,0.2), 0 1px 0 rgba(72,52,37,0.22)'
          : '0 3px 0 rgba(83,61,43,0.28), 0 5px 7px rgba(0,0,0,0.12), inset 1px 1px 1px rgba(255,255,255,0.24), inset -1px -1px 2px rgba(55,39,28,0.1)',
      }}
      aria-pressed={selected}
    >
      <span className="block text-[11px] font-semibold leading-[1.12]">
        {lines[0]}
      </span>

      <span className="mt-1 block min-h-[13px] text-[11px] font-semibold leading-[1.12]">
        {lines[1]}
      </span>
    </motion.button>
  );
};

interface TaskCardProps {
  card: VisualCard;
  onComplete: (couponBounds: DOMRect) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ card, onComplete }) => {
  const palette = PALETTES[card.timeMode];

  const targetAt =
    card.timeMode === 'deadline'
      ? card.deadlineAt
      : card.timeMode === 'reminder'
        ? card.reminderAt
        : undefined;

  return (
    <div className="relative h-full w-full">
      <div
        className="pointer-events-none absolute"
        style={{
          left: 10,
          right: -13,
          top: 16,
          bottom: -17,
          borderRadius: `${CARD_RADIUS + 4}px`,
          boxShadow: '18px 27px 42px rgba(0,0,0,0.48)',
        }}
      />

      <div
        className="pointer-events-none absolute"
        style={{
          left: 7,
          right: 1,
          bottom: -8,
          height: 22,
          borderRadius: '0 0 25px 25px',
          backgroundColor: 'rgba(31,24,19,0.5)',
          boxShadow: '0 5px 8px rgba(0,0,0,0.72)',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          transform: 'translate(2px, 5px)',
          borderRadius: `${CARD_RADIUS}px`,
          backgroundColor: '#77624B',
          backgroundImage: `url(${cardboardTexture})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundBlendMode: 'multiply',
          boxShadow: 'inset 0 -2px 2px rgba(0,0,0,0.38)',
        }}
      />

      <div
        className="pointer-events-none absolute"
        style={{
          top: 4,
          right: -4,
          bottom: -2,
          width: 28,
          borderRadius: `0 ${CARD_RADIUS}px ${CARD_RADIUS}px 0`,
          backgroundColor: '#685540',
          backgroundImage: `url(${cardboardTexture})`,
          backgroundPosition: 'right center',
          backgroundSize: 'cover',
          backgroundBlendMode: 'multiply',
        }}
      />

      <article
        className="absolute inset-0 flex flex-col overflow-hidden"
        style={{
          borderRadius: `${CARD_RADIUS}px`,
          padding: '22px 22px 20px',
          backgroundColor: palette.paper,
          backgroundImage: `
            radial-gradient(
              circle at 13% 9%,
              rgba(255,255,255,0.28) 0%,
              rgba(255,255,255,0.08) 28%,
              transparent 56%
            ),
            linear-gradient(
              138deg,
              rgba(255,255,255,0.09) 0%,
              transparent 44%,
              rgba(35,25,18,0.14) 100%
            ),
            url(${cardboardTexture})
          `,
          backgroundPosition: 'center, center, center',
          backgroundSize: '100% 100%, 100% 100%, cover',
          backgroundBlendMode: 'soft-light, multiply, multiply',
          border: '1px solid rgba(73,55,40,0.22)',
          boxShadow: `
            inset 1px 1px 1px rgba(255,255,255,0.42),
            inset -2px -2px 3px rgba(55,39,27,0.16)
          `,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: `${CARD_RADIUS}px`,
            background: `
              radial-gradient(
                ellipse at 22% 12%,
                rgba(255,255,255,0.13) 0%,
                transparent 48%
              ),
              linear-gradient(
                145deg,
                transparent 48%,
                rgba(41,29,20,0.075) 100%
              )
            `,
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.32),
              inset 0 -2px 2px rgba(50,35,24,0.1)
            `,
          }}
        />
      <div className="relative z-10 mt-1 shrink-0">
        <CardStamp text="Одна задача" palette={palette} />
      </div>

      <h2
        className="relative z-10 shrink-0 text-[1.55rem] font-bold leading-[1.18]"
        style={{
          marginTop: '24px',
          color: palette.ink,
          letterSpacing: '-0.025em',
        }}
      >
        {card.title}
      </h2>

      {targetAt && card.timeMode !== 'none' && (
        <div className="relative z-10 shrink-0" style={{ marginTop: 22 }}>
          <p
            className="text-[13px] font-semibold leading-snug"
            style={{ color: 'rgba(30,28,26,0.7)' }}
          >
            {card.timeMode === 'deadline'
              ? 'Для выполнения осталось:'
              : 'До напоминания осталось:'}
          </p>

          <div style={{ marginTop: 8 }}>
            <CountdownPanel
              targetAt={targetAt}
              mode={card.timeMode}
              completedAt={card.completedAt}
              palette={palette}
            />
          </div>

          <p
            className="text-center font-mono text-[13px] font-medium leading-relaxed tracking-[-0.015em]"
            style={{
              marginTop: 12,
              color: 'rgba(30,28,26,0.52)',
              textShadow:
                '0 1px 0 rgba(255,255,255,0.42), 0 -1px 0 rgba(52,38,28,0.16)',
            }}
          >
            {formatHumanDate(targetAt)}
          </p>
        </div>
      )}

      <div className="flex-1" />

      <CompletionCoupon
        completedAt={card.completedAt}
        palette={palette}
        onComplete={onComplete}
      />

      <div
        className="relative z-10 flex items-center justify-between border-t pt-4"
        style={{ borderColor: 'rgba(0,0,0,0.08)' }}
      >
        <span
          className="font-mono text-[9px] uppercase tracking-[0.14em]"
          style={{ color: 'rgba(30,28,26,0.34)' }}
        >
          TASK
        </span>

        <span
          className="font-mono text-[9px] uppercase tracking-[0.14em]"
          style={{ color: 'rgba(30,28,26,0.34)' }}
        >
          {formatShortDate(card.createdAt)}
        </span>
      </div>
      </article>
    </div>
  );
};

interface CardStampProps {
  text: string;
  palette: CardPalette;
}

const CardStamp: React.FC<CardStampProps> = ({ text, palette }) => {
  return (
    <span
      className="inline-flex min-w-[112px] shrink-0 items-center justify-center whitespace-nowrap rounded-[9px] px-[18px] py-[9px] font-mono text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{
        width: 'max-content',
        minHeight: '36px',
        color: 'rgba(255,255,255,0.94)',
        backgroundColor: palette.accent,
        boxShadow:
          'inset 2px 2px 5px rgba(0,0,0,0.42), inset -1px -1px 1px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.18)',
        textShadow: '0 1px 1px rgba(0,0,0,0.28)',
      }}
    >
      {text}
    </span>
  );
};

interface CountdownPanelProps {
  targetAt: string;
  mode: Exclude<TimeMode, 'none'>;
  completedAt?: string;
  palette: CardPalette;
}

const CountdownPanel: React.FC<CountdownPanelProps> = ({
  targetAt,
  mode,
  completedAt,
  palette,
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (completedAt) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [completedAt]);

  const remaining = new Date(targetAt).getTime() - now;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-10 flex min-h-[76px] items-center justify-center overflow-hidden rounded-[16px] px-4 py-4 text-center"
      aria-label={
        completedAt
          ? 'Задача завершена'
          : mode === 'deadline'
            ? 'Осталось для выполнения'
            : 'Осталось до напоминания'
      }
      style={{
        color: 'rgba(255,255,255,0.94)',
        backgroundColor: palette.accent,
        backgroundImage:
          'radial-gradient(circle at 20% 10%, rgba(255,255,255,0.12) 0%, transparent 48%), linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.09) 100%), url(' +
          cardboardTexture +
          ')',
        backgroundSize: '100% 100%, 100% 100%, cover',
        backgroundBlendMode: 'soft-light, soft-light, multiply',
        border: '1px solid rgba(42,34,27,0.2)',
        boxShadow:
          'inset 2px 3px 7px rgba(0,0,0,0.3), inset -1px -1px 2px rgba(255,255,255,0.16), 0 3px 0 rgba(54,43,34,0.24), 0 6px 10px rgba(0,0,0,0.16)',
      }}
    >
      <div className="font-mono text-[17px] font-semibold tracking-[-0.02em]">
        {completedAt ? 'Выполнено' : formatRemainingTime(remaining)}
      </div>
    </motion.div>
  );
};

interface CompletionCouponProps {
  completedAt?: string;
  palette: CardPalette;
  onComplete: (couponBounds: DOMRect) => void;
}

const CompletionCoupon: React.FC<CompletionCouponProps> = ({
  completedAt,
  palette,
  onComplete,
}) => {
  const dashPattern = `${COUPON_DASH_LENGTH} ${COUPON_DASH_GAP}`;
  const rectWidth = COUPON_WIDTH - COUPON_STROKE_INSET * 2;
  const rectHeight = COUPON_HEIGHT - COUPON_STROKE_INSET * 2;
  const rectRadius = Math.max(1, COUPON_RADIUS - COUPON_STROKE_INSET / 2);
  const couponRef = useRef<HTMLButtonElement | null>(null);

  const handleComplete = () => {
    const couponBounds = couponRef.current?.getBoundingClientRect();

    if (couponBounds) {
      onComplete(couponBounds);
    }
  };


  return (
    <div
      className="relative z-10 mb-6 h-[38px] w-full shrink-0"
      style={{ perspective: '900px' }}
    >
      <motion.div
        animate={{
          backgroundColor: completedAt
            ? palette.accent
            : 'rgba(32,28,25,0.14)',
          boxShadow: completedAt
            ? `
                inset 3px 4px 9px rgba(0,0,0,0.48),
                inset -1px -1px 2px rgba(255,255,255,0.12),
                0 1px 0 rgba(255,255,255,0.08)
              `
            : 'none',
        }}
        transition={{ duration: 0.24 }}
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{
          borderRadius: `${COUPON_RADIUS}px`,
          backgroundImage: `
            linear-gradient(
              180deg,
              rgba(255,255,255,0.06) 0%,
              rgba(0,0,0,0.12) 100%
            ),
            url(${cardboardTexture})
          `,
          backgroundPosition: 'center, center',
          backgroundSize: '100% 100%, cover',
          backgroundBlendMode: 'soft-light, multiply',
        }}
      >
        <AnimatePresence>
          {completedAt && (
            <motion.span
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.16, duration: 0.24 }}
              className="px-3 text-center font-mono text-[8px] font-semibold uppercase tracking-[0.08em]"
              style={{
                color: 'rgba(255,255,255,0.94)',
                textShadow: '0 1px 1px rgba(0,0,0,0.28)',
              }}
            >
              Выполнено · {formatCompletedDate(completedAt)}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {!completedAt && (
          <button
            type="button"
            ref={couponRef}
            onClick={handleComplete}
            className="absolute inset-0 cursor-pointer border-0 bg-transparent p-0"
            style={{
              transformOrigin: 'center bottom',
              borderRadius: `${COUPON_RADIUS}px`,
              boxShadow: 'none',
            }}
            aria-label="Завершить задачу"
          >
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                borderRadius: `${COUPON_RADIUS}px`,
                backgroundColor: palette.paper,
                backgroundImage: `
                  linear-gradient(
                    180deg,
                    rgba(255,255,255,0.08) 0%,
                    rgba(255,255,255,0.01) 48%,
                    rgba(0,0,0,0.018) 100%
                  ),
                  url(${cardboardTexture})
                `,
                backgroundPosition: 'center, center',
                backgroundSize: '100% 100%, cover',
                backgroundBlendMode: 'soft-light, multiply',
                boxShadow: 'none',
              }}
            />

            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox={`0 0 ${COUPON_WIDTH} ${COUPON_HEIGHT}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              shapeRendering="geometricPrecision"
            >
              <rect
                x={COUPON_STROKE_INSET}
                y={COUPON_STROKE_INSET}
                width={rectWidth}
                height={rectHeight}
                rx={rectRadius}
                fill="none"
                stroke={`rgba(104,104,104,${COUPON_SHOULDER_OPACITY})`}
                strokeWidth={COUPON_SHOULDER_THICKNESS}
                strokeDasharray={dashPattern}
                strokeLinecap="butt"
                vectorEffect="non-scaling-stroke"
              />

              <rect
                x={COUPON_STROKE_INSET}
                y={COUPON_STROKE_INSET}
                width={rectWidth}
                height={rectHeight}
                rx={rectRadius}
                fill="none"
                stroke="rgba(8,8,8,0.94)"
                strokeWidth={COUPON_CORE_THICKNESS}
                strokeDasharray={dashPattern}
                strokeLinecap="butt"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <span
              className="absolute inset-0 flex select-none items-center justify-center pt-[1px] font-mono text-[9px] font-semibold uppercase tracking-[0.18em]"
              style={{
                color: 'rgba(36,30,26,0.55)',
                textShadow: `
                  -1px -1px 1px rgba(0,0,0,0.2),
                  1px 1px 1px rgba(255,255,255,0.48)
                `,
              }}
            >
              Завершить
            </span>
          </button>
        )}
      </AnimatePresence>
    </div>
  );
};

interface DetachedCompletionCouponProps {
  coupon: DetachedCoupon;
  onFlightComplete: () => void;
}

const DetachedCompletionCoupon: React.FC<DetachedCompletionCouponProps> = ({
  coupon,
  onFlightComplete,
}) => {
  const dashPattern = `${COUPON_DASH_LENGTH} ${COUPON_DASH_GAP}`;
  const rectWidth = COUPON_WIDTH - COUPON_STROKE_INSET * 2;
  const rectHeight = COUPON_HEIGHT - COUPON_STROKE_INSET * 2;
  const rectRadius = Math.max(1, COUPON_RADIUS - COUPON_STROKE_INSET / 2);
  const flight = useMemo(() => {
    const driftDirection = Math.random() < 0.5 ? -1 : 1;
    const rotationDirection = Math.random() < 0.5 ? -1 : 1;

    return {
      originX: 25 + Math.random() * 50,
      originY: 25 + Math.random() * 50,
      driftX: driftDirection * (18 + Math.random() * 27),
      finalRotation: rotationDirection * (35 + Math.random() * 50),
      duration: 1.15 + Math.random() * 0.2,
    };
  }, [coupon.id]);
  const fallDistance =
    window.innerHeight - coupon.top + coupon.height + 80;

  return (
    <motion.div
      initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
      animate={{
        x: flight.driftX,
        y: fallDistance,
        rotate: flight.finalRotation,
        opacity: 1,
      }}
      transition={{
        x: {
          duration: flight.duration,
          ease: 'linear',
        },
        y: {
          duration: flight.duration,
          ease: [0.4, 0, 1, 1],
        },
        rotate: {
          duration: flight.duration,
          ease: 'linear',
        },
      }}
      onAnimationComplete={onFlightComplete}
      className="pointer-events-none fixed"
      style={{
        zIndex: 100,
        left: coupon.left,
        top: coupon.top,
        width: coupon.width,
        height: coupon.height,
        transformOrigin: `${flight.originX}% ${flight.originY}%`,
        filter:
          'drop-shadow(0 18px 14px rgba(0,0,0,0.62)) drop-shadow(0 6px 5px rgba(0,0,0,0.46))',
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: `${COUPON_RADIUS}px`,
          backgroundColor: coupon.palette.paper,
          backgroundImage: `
            linear-gradient(
              180deg,
              rgba(255,255,255,0.08) 0%,
              rgba(255,255,255,0.01) 48%,
              rgba(0,0,0,0.018) 100%
            ),
            url(${cardboardTexture})
          `,
          backgroundPosition: 'center, center',
          backgroundSize: '100% 100%, cover',
          backgroundBlendMode: 'soft-light, multiply',
          boxShadow: 'none',
        }}
      />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${COUPON_WIDTH} ${COUPON_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        shapeRendering="geometricPrecision"
      >
        <rect
          x={COUPON_STROKE_INSET}
          y={COUPON_STROKE_INSET}
          width={rectWidth}
          height={rectHeight}
          rx={rectRadius}
          fill="none"
          stroke={`rgba(104,104,104,${COUPON_SHOULDER_OPACITY})`}
          strokeWidth={COUPON_SHOULDER_THICKNESS}
          strokeDasharray={dashPattern}
          strokeLinecap="butt"
          vectorEffect="non-scaling-stroke"
        />

        <rect
          x={COUPON_STROKE_INSET}
          y={COUPON_STROKE_INSET}
          width={rectWidth}
          height={rectHeight}
          rx={rectRadius}
          fill="none"
          stroke="rgba(8,8,8,0.94)"
          strokeWidth={COUPON_CORE_THICKNESS}
          strokeDasharray={dashPattern}
          strokeLinecap="butt"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <span
        className="absolute inset-0 flex select-none items-center justify-center pt-[1px] font-mono text-[9px] font-semibold uppercase tracking-[0.18em]"
        style={{
          color: 'rgba(36,30,26,0.55)',
          textShadow: `
            -1px -1px 1px rgba(0,0,0,0.2),
            1px 1px 1px rgba(255,255,255,0.48)
          `,
        }}
      >
        {'\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044c'}
      </span>
    </motion.div>
  );
};


const TableBackground: React.FC = () => {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${tableTexture})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse at 25% 15%,
              rgba(255,255,255,0.12) 0%,
              transparent 55%
            ),
            radial-gradient(
              ellipse at 50% 45%,
              rgba(255,255,255,0.035) 0%,
              transparent 42%
            ),
            rgba(0,0,0,0.22)
          `,
        }}
      />
    </>
  );
};

export default MainApp;
