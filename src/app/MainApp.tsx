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

import {
  CARD_RADIUS,
  GHOST_SETTINGS,
  GHOST_SHADOW,
  PALETTES,
  PHYSICAL_SPRING,
  type CardKind,
  type CreationState,
  type DetachedCoupon,
  type DraftStep,
  type TimeMode,
  type VisualCard,
} from './cardTheme';
import {
  addLocalDays,
  createLocalDateTimeValue,
  getDraftDateLabel,
  getNextFiveMinuteSlot,
  getNextMonday,
  isSameLocalDay,
  padNumber,
  startOfLocalDay,
} from './dateTimeUtils';
import { DraftCard } from '../components/draft-card/DraftCard';
import { ArchiveNavigation } from '../components/archive/ArchiveNavigation';
import { ArchiveView } from '../components/archive/ArchiveView';
import { CardSwitcher } from '../components/card-switcher/CardSwitcher';
import { CardStack } from '../components/card-stack/CardStack';
import { DetachedCompletionCoupon } from '../components/task-card/DetachedCompletionCoupon';
import { TaskCard } from '../components/task-card/TaskCard';
const createId = (): string => {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

type CompletionPhase =
  | 'idle'
  | 'preparing-next'
  | 'coupon-complete'
  | 'waiting-for-coupon'
  | 'exiting'
  | 'finalizing';

interface CompletionTransition {
  phase: CompletionPhase;
  completedCard: VisualCard | null;
  nextCard: VisualCard | null;
}

const IDLE_COMPLETION_TRANSITION: CompletionTransition = {
  phase: 'idle',
  completedCard: null,
  nextCard: null,
};

const ignoreCompletion = (): void => undefined;

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
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const [cards, setCards] = useState<VisualCard[]>(() => {
    if (!import.meta.env.DEV) {
      return [
        {
          id: createId(),
          title: 'Продумать движение новой карточки',
          kind: 'single',
          timeMode: 'none',
          createdAt: new Date().toISOString(),
        },
      ];
    }

    const now = Date.now();
    const seeds: Array<{ title: string; timeMode: TimeMode }> = [
      { title: 'Хлеб', timeMode: 'none' },
      { title: 'Абсолютное безумие', timeMode: 'none' },
      { title: 'Мама мыла раму', timeMode: 'deadline' },
      { title: 'Рыба в воде', timeMode: 'reminder' },
      { title: 'Кленовый сироп', timeMode: 'deadline' },
      {
        title: 'Продумать движение новой карточки',
        timeMode: 'reminder',
      },
      {
        title:
          'Очень длинное название карточки для проверки обрезания текста в переключателе',
        timeMode: 'none',
      },
    ];

    return seeds.map((seed, index) => {
      const targetAt = new Date(
        now + (index + 1) * 24 * 60 * 60 * 1000,
      ).toISOString();

      return {
        id: createId(),
        title: seed.title,
        kind: 'single',
        timeMode: seed.timeMode,
        deadlineAt: seed.timeMode === 'deadline' ? targetAt : undefined,
        reminderAt: seed.timeMode === 'reminder' ? targetAt : undefined,
        createdAt: new Date(now - index * 60 * 1000).toISOString(),
      };
    });
  });
  const [activeCardId, setActiveCardId] = useState(() => cards[0]!.id);

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
  const [completionTransition, setCompletionTransition] =
    useState<CompletionTransition>(IDLE_COMPLETION_TRANSITION);

  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const commitTimerRef = useRef<number | null>(null);
  const completionTransitionRef = useRef(completionTransition);

  const isCreating = creationState !== 'idle';
  const activeCard = cards.find((card) => card.id === activeCardId);
  const isCompletionTransitioning =
    completionTransition.phase !== 'idle';
  const isCompletionExiting = completionTransition.phase === 'exiting';
  const displayedActiveCard =
    completionTransition.phase === 'preparing-next' ||
    completionTransition.phase === 'coupon-complete' ||
    completionTransition.phase === 'waiting-for-coupon' ||
    completionTransition.phase === 'exiting'
      ? completionTransition.completedCard
      : activeCard;
  const preparedNextCard =
    completionTransition.phase === 'preparing-next' ||
    completionTransition.phase === 'coupon-complete' ||
    completionTransition.phase === 'waiting-for-coupon' ||
    completionTransition.phase === 'exiting'
      ? completionTransition.nextCard
      : null;
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

  const updateCompletionTransition = useCallback(
    (nextTransition: CompletionTransition) => {
      completionTransitionRef.current = nextTransition;
      setCompletionTransition(nextTransition);
    },
    [],
  );

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

  useEffect(() => {
    if (
      completionTransition.phase === 'preparing-next' ||
      completionTransition.phase === 'coupon-complete'
    ) {
      let secondFrameId: number | null = null;
      const firstFrameId = window.requestAnimationFrame(() => {
        secondFrameId = window.requestAnimationFrame(() => {
          const transition = completionTransitionRef.current;

          if (transition.phase === 'coupon-complete') {
            updateCompletionTransition({
              ...transition,
              phase: 'exiting',
            });
          } else if (transition.phase === 'preparing-next') {
            updateCompletionTransition({
              ...transition,
              phase: 'waiting-for-coupon',
            });
          }
        });
      });

      return () => {
        window.cancelAnimationFrame(firstFrameId);
        if (secondFrameId !== null) {
          window.cancelAnimationFrame(secondFrameId);
        }
      };
    }

    if (completionTransition.phase === 'finalizing') {
      let secondFrameId: number | null = null;
      const firstFrameId = window.requestAnimationFrame(() => {
        secondFrameId = window.requestAnimationFrame(() => {
          updateCompletionTransition(IDLE_COMPLETION_TRANSITION);
        });
      });

      return () => {
        window.cancelAnimationFrame(firstFrameId);
        if (secondFrameId !== null) {
          window.cancelAnimationFrame(secondFrameId);
        }
      };
    }
  }, [completionTransition, updateCompletionTransition]);

  const handleSelectCard = useCallback((cardId: string) => {
    if (completionTransitionRef.current.phase !== 'idle') {
      return;
    }

    setActiveCardId(cardId);
  }, []);

  const handleStartCreating = () => {
    if (
      creationState !== 'idle' ||
      completionTransitionRef.current.phase !== 'idle'
    ) {
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

      const newCard: VisualCard = {
        id: createId(),
        title: draftTitle.trim(),
        kind: 'single',
        timeMode: creationTimeMode,
        deadlineAt:
          creationTimeMode === 'deadline' ? storedDate : undefined,
        reminderAt:
          creationTimeMode === 'reminder' ? storedDate : undefined,
        createdAt: new Date().toISOString(),
      };

      setCards((previous) => [...previous, newCard]);
      setActiveCardId(newCard.id);

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
    if (
      !activeCard ||
      activeCard.completedAt ||
      completionTransitionRef.current.phase !== 'idle'
    ) {
      return;
    }

    const completedCard: VisualCard = {
      ...activeCard,
      completedAt: new Date().toISOString(),
    };
    const activeIndex = cards.findIndex(
      (card) => card.id === activeCard.id,
    );
    let nextCard: VisualCard | null = null;

    for (let offset = 1; offset < cards.length; offset += 1) {
      const candidate = cards[(activeIndex + offset) % cards.length];

      if (candidate && !candidate.completedAt) {
        nextCard = candidate;
        break;
      }
    }

    setDetachedCoupon({
      id: activeCard.id,
      left: couponBounds.left,
      top: couponBounds.top,
      width: couponBounds.width,
      height: couponBounds.height,
      palette: PALETTES[activeCard.timeMode],
    });

    updateCompletionTransition({
      phase: 'preparing-next',
      completedCard,
      nextCard,
    });
  };

  const handleCouponFlightComplete = () => {
    setDetachedCoupon(null);

    const transition = completionTransitionRef.current;

    if (transition.phase === 'waiting-for-coupon') {
      updateCompletionTransition({
        ...transition,
        phase: 'exiting',
      });
    } else if (transition.phase === 'preparing-next') {
      updateCompletionTransition({
        ...transition,
        phase: 'coupon-complete',
      });
    }
  };

  const handleCompletionExitComplete = () => {
    const transition = completionTransitionRef.current;

    if (
      transition.phase !== 'exiting' ||
      !transition.completedCard
    ) {
      return;
    }

    updateCompletionTransition({
      ...transition,
      phase: 'finalizing',
    });
    setCards((previous) =>
      previous.filter(
        (card) => card.id !== transition.completedCard!.id,
      ),
    );
    setActiveCardId(transition.nextCard?.id ?? '');
  };

  return (
    <main className="relative h-full w-full overflow-hidden">
      <ArchiveView isOpen={isArchiveOpen} />

      <motion.div
        className="absolute inset-0 z-20 h-full w-full"
        animate={{ y: isArchiveOpen ? '-100%' : '0%' }}
        transition={{ duration: 0.85, ease: [0.32, 0.72, 0, 1] }}
      >
        <TableBackground />

        <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2">
          <CardSwitcher
            cards={cards}
            activeCardId={activeCardId}
            onSelectCard={handleSelectCard}
          />
        </div>

      <div className="relative z-10 flex h-full w-full items-center justify-center px-4 py-8">
        <div
          className="relative w-[280px] max-w-[78vw]"
          style={{
            aspectRatio: '9 / 16',
            maxHeight: '78vh',
          }}
        >
          <CardStack cards={cards} activeCardId={activeCardId} />

          {preparedNextCard && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                zIndex: 19,
                backfaceVisibility: 'hidden',
              }}
            >
              <TaskCard
                card={preparedNextCard}
                onComplete={ignoreCompletion}
              />
            </div>
          )}

          <AnimatePresence initial={false} mode="popLayout">
            {displayedActiveCard && (
              <motion.div
                key={creationCycle}
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
                  pointerEvents:
                    isCreating || isCompletionTransitioning
                      ? 'none'
                      : 'auto',
                }}
              >
                <AnimatePresence initial={false} mode="sync">
                  <motion.div
                    key={displayedActiveCard.id}
                    initial={
                      completionTransition.phase === 'finalizing'
                        ? false
                        : { opacity: 0, x: 6 }
                    }
                    animate={
                      isCompletionExiting
                        ? {
                            opacity: 0,
                            x: 18,
                            y: -8,
                            rotate: 1.2,
                            scale: 0.985,
                          }
                        : {
                            opacity: 1,
                            x: 0,
                            y: 0,
                            rotate: 0,
                            scale: 1,
                          }
                    }
                    exit={{ opacity: 0, x: -6 }}
                    transition={
                      isCompletionExiting
                        ? {
                            duration: 0.4,
                            ease: [0.32, 0.72, 0, 1],
                          }
                        : { duration: 0.2, ease: 'easeOut' }
                    }
                    onAnimationComplete={handleCompletionExitComplete}
                    className="absolute inset-0"
                    style={{
                      willChange: 'transform, opacity',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <TaskCard
                      card={displayedActiveCard}
                      onComplete={handleCompleteCard}
                    />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
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
              <DraftCard
                creationCycle={creationCycle}
                creationState={creationState}
                palette={draftPalette}
                draftStep={draftStep}
                canAdvanceDraft={canAdvanceDraft}
                titleInputRef={titleInputRef}
                draftTitle={draftTitle}
                selectedKind={selectedKind}
                timeMode={timeMode}
                selectedDateLabel={selectedDateLabel}
                selectedDraftDate={selectedDraftDate}
                isManualCalendarOpen={isManualCalendarOpen}
                datePresets={datePresets}
                calendarView={calendarView}
                calendarCells={calendarCells}
                currentDraftDay={currentDraftDay}
                canGoToPreviousYear={canGoToPreviousYear}
                canGoToPreviousMonth={canGoToPreviousMonth}
                draftHourInput={draftHourInput}
                draftMinuteInput={draftMinuteInput}
                isSelectedDateTimeValid={isSelectedDateTimeValid}
                onSubmit={handleCreateCard}
                onCancel={handleCancelCreating}
                onTitleChange={setDraftTitle}
                onSelectKind={handleSelectKind}
                onSelectTimeMode={handleSelectTimeMode}
                onSelectDate={handleSelectDraftDate}
                onOpenManualCalendar={handleOpenManualCalendar}
                onChangeYear={handleChangeCalendarYear}
                onChangeMonth={handleChangeCalendarMonth}
                onTimeInputChange={handleDraftTimeInputChange}
                onCommitTimeInput={handleCommitDraftTimeInput}
                onAdjustHour={handleAdjustDraftHour}
                onAdjustMinute={handleAdjustDraftMinute}
                onBack={handleDraftBack}
                onNext={handleDraftNext}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {detachedCoupon && (
          <DetachedCompletionCoupon
            key={detachedCoupon.id}
            coupon={detachedCoupon}
            onFlightComplete={handleCouponFlightComplete}
          />
        )}
      </AnimatePresence>
      </motion.div>

      <ArchiveNavigation
        isArchiveOpen={isArchiveOpen}
        onToggle={() => setIsArchiveOpen((previous) => !previous)}
      />
    </main>
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
