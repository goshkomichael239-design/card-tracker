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
  getCardPalette,
  PALETTES,
  PHYSICAL_SPRING,
  type CardKind,
  type CreationState,
  type DraftStep,
  type TimeMode,
  type VisualCard,
  type TaskListItem,
} from './cardTheme';
import {
  downloadTextFile,
  getBackupFilename,
  parseBackup,
  serializeBackup,
  type BackupImportResult,
} from './backupUtils';
import { isStoredVisualCard } from './cardValidation';
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
import { CardStack } from '../components/card-stack/CardStack';
import { CardSwitcher } from '../components/card-switcher/CardSwitcher';
import { INITIAL_CARD_SWITCHER_CONFIG } from '../components/card-switcher/cardSwitcherConfig';
import { ARCHIVE_NAVIGATION_HEIGHT } from '../components/archive/ArchiveNavigation';
import { getCardScale, useViewportSize } from './viewportScale';
import {
  DetachedCompletionCoupon,
  type DetachedCompletionCouponHandle,
} from '../components/task-card/DetachedCompletionCoupon';
import { TaskCard } from '../components/task-card/TaskCard';
import { FullListSheet } from '../components/task-card/FullListSheet';
import { TransientTaskCardOverlay } from '../components/task-card/TransientTaskCardOverlay';
import { INITIAL_TASK_CARD_V2_CONFIG } from '../components/task-card/taskCardV2Config';
const createId = (): string => {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

type TransientOutgoingKind = 'switch' | 'completion' | 'discard';

const ARCHIVE_STORAGE_KEY = 'card-tracker.archive.v1';
const ACTIVE_CARDS_STORAGE_KEY = 'card-tracker.active-cards.v1';
const CORNER_HINT_STORAGE_KEY = 'card-tracker.corner-hint-dismissed.v1';

const loadCornerHintDismissed = (): boolean => {
  try {
    return window.localStorage.getItem(CORNER_HINT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

interface TransientOutgoingCard {
  key: number;
  card: VisualCard;
  kind: TransientOutgoingKind;
}

const getLocalDayKey = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const loadArchivedCards = (): VisualCard[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedCards = window.localStorage.getItem(ARCHIVE_STORAGE_KEY);

    if (!storedCards) {
      return [];
    }

    const parsedCards: unknown = JSON.parse(storedCards);

    if (!Array.isArray(parsedCards)) {
      return [];
    }

    return parsedCards
      .filter(isStoredVisualCard)
      .sort(
        (left, right) =>
          new Date(right.completedAt ?? 0).getTime() -
          new Date(left.completedAt ?? 0).getTime(),
      );
  } catch {
    return [];
  }
};

const loadActiveCards = (): VisualCard[] | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedCards = window.localStorage.getItem(ACTIVE_CARDS_STORAGE_KEY);
    if (!storedCards) {
      return null;
    }

    const parsedCards: unknown = JSON.parse(storedCards);
    return Array.isArray(parsedCards)
      ? parsedCards.filter(isStoredVisualCard).filter((card) => !card.completedAt)
      : null;
  } catch {
    return null;
  }
};

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"]'),
  );
};

const isSceneGestureTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }

  return !target.closest(
    'button, input, textarea, select, [contenteditable="true"]',
  );
};

// Free space the scene must keep around the card at scale 1: the ghost card sits
// up and to the left of it, the neighbouring stack down and to the right.
const SCENE_TOP_OVERHANG = 66;
const SCENE_BOTTOM_OVERHANG = 40;
const SCENE_SIDE_OVERHANG = 44;
const SWITCHER_TOP = 16;
const SWITCHER_CHROME = 16;
const SWITCHER_ROW_GAP = 2;

const MainApp: React.FC = () => {
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isCornerHintDismissed, setIsCornerHintDismissed] = useState(
    loadCornerHintDismissed,
  );

  const [cards, setCards] = useState<VisualCard[]>(() => {
    const storedCards = loadActiveCards();
    if (storedCards !== null) {
      return storedCards;
    }

    if (!import.meta.env.DEV) {
      return [
        {
          id: createId(),
          title: 'Моя первая карточка',
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
  const [archivedCards, setArchivedCards] = useState<VisualCard[]>(
    loadArchivedCards,
  );
  const [activeCardId, setActiveCardId] = useState(() => cards[0]?.id ?? '');

  const [creationState, setCreationState] =
    useState<CreationState>('idle');
  const [draftTitle, setDraftTitle] = useState('');
  const [seriesTargetInput, setSeriesTargetInput] = useState('');
  const [draftListItems, setDraftListItems] = useState<TaskListItem[]>([]);
  const [draftListInput, setDraftListInput] = useState('');
  const [selectedKind, setSelectedKind] = useState<CardKind | null>(null);
  const [draftStep, setDraftStep] = useState<DraftStep>('kind');
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
  const [transientOutgoing, setTransientOutgoing] =
    useState<TransientOutgoingCard | null>(null);
  const [pendingCompletedCardId, setPendingCompletedCardId] =
    useState<string | null>(null);
  const [expandedListCardId, setExpandedListCardId] = useState<string | null>(
    null,
  );
  const [currentDayKey, setCurrentDayKey] = useState(() =>
    getLocalDayKey(new Date()),
  );

  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const commitTimerRef = useRef<number | null>(null);
  const couponFlightInProgressRef = useRef(false);
  const detachedCouponLayerRef =
    useRef<DetachedCompletionCouponHandle | null>(null);
  const cardsRef = useRef(cards);
  const completedRemovalTimerRef = useRef<number | null>(null);
  const pendingCompletedCardIdRef = useRef<string | null>(null);
  const pendingCompletedRemovalArmedRef = useRef(false);
  const transientSequenceRef = useRef(0);
  const scenePointerRef = useRef<{ id: number; y: number } | null>(null);

  const isCreating = creationState !== 'idle';
  const activeCard = cards.find((card) => card.id === activeCardId);
  const expandedListCard = cards.find(
    (card) => card.id === expandedListCardId && card.kind === 'list',
  );
  const isListSheetOpen = Boolean(expandedListCard);
  const firstCardCreatedAt = useMemo(() => {
    const earliestTimestamp = [...cards, ...archivedCards].reduce<number | null>(
      (earliest, card) => {
        const timestamp = new Date(card.createdAt).getTime();

        if (!Number.isFinite(timestamp)) {
          return earliest;
        }

        return earliest === null ? timestamp : Math.min(earliest, timestamp);
      },
      null,
    );

    return earliestTimestamp === null
      ? undefined
      : new Date(earliestTimestamp).toISOString();
  }, [archivedCards, cards]);
  const completedTodayCount = useMemo(
    () =>
      archivedCards.filter(
        (card) => {
          const completedAt = card.completedAt;

          return (
            completedAt !== undefined &&
            getLocalDayKey(new Date(completedAt)) === currentDayKey
          );
        },
      ).length,
    [archivedCards, currentDayKey],
  );
  // The completed-day count remains part of the archive/completion state, but
  // V2 deliberately replaces its former card-back rendering with CardStack.
  void completedTodayCount;
  const currentCardExitX = Math.max(520, viewportWidth * 0.72);
  const switcherRows = Math.min(4, Math.max(1, cards.length));
  const switcherBottom =
    SWITCHER_TOP +
    INITIAL_CARD_SWITCHER_CONFIG.positionY +
    SWITCHER_CHROME +
    switcherRows * INITIAL_CARD_SWITCHER_CONFIG.rowHeight +
    (switcherRows - 1) * SWITCHER_ROW_GAP;
  const sceneTopReserve = switcherBottom + SCENE_TOP_OVERHANG;
  const sceneBottomReserve = ARCHIVE_NAVIGATION_HEIGHT + SCENE_BOTTOM_OVERHANG;
  const sceneScale = getCardScale(
    viewportWidth - SCENE_SIDE_OVERHANG * 2,
    viewportHeight - sceneTopReserve - sceneBottomReserve,
    INITIAL_TASK_CARD_V2_CONFIG.width,
    INITIAL_TASK_CARD_V2_CONFIG.height,
  );
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
    (draftStep === 'series-target' &&
      Number.isInteger(Number(seriesTargetInput)) &&
      Number(seriesTargetInput) >= 1) ||
    (draftStep === 'list-items' && draftListItems.length >= 1) ||
    draftStep === 'date' ||
    (draftStep === 'clock' && isSelectedDateTimeValid);

  const resetDraft = useCallback(() => {
    const initialSlot = getNextFiveMinuteSlot();
    const initialDate = startOfLocalDay(initialSlot);

    setDraftTitle('');
    setSeriesTargetInput('');
    setDraftListItems([]);
    setDraftListInput('');
    setSelectedKind(null);
    setDraftStep('kind');
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

  const createTransientOutgoing = useCallback(
    (card: VisualCard, kind: TransientOutgoingKind) => {
      transientSequenceRef.current += 1;
      setTransientOutgoing({
        key: transientSequenceRef.current,
        card,
        kind,
      });
    },
    [],
  );

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        ACTIVE_CARDS_STORAGE_KEY,
        JSON.stringify(cards.filter((card) => !card.completedAt)),
      );
    } catch {
      // The active scene must remain usable when browser storage is unavailable.
    }
  }, [cards]);

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

      if (completedRemovalTimerRef.current !== null) {
        window.clearTimeout(completedRemovalTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (expandedListCardId && !expandedListCard) {
      setExpandedListCardId(null);
    }
  }, [expandedListCard, expandedListCardId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        ARCHIVE_STORAGE_KEY,
        JSON.stringify(archivedCards),
      );
    } catch {
      // The active scene must remain usable when browser storage is unavailable.
    }
  }, [archivedCards]);

  useEffect(() => {
    let rolloverTimer: number | null = null;

    const scheduleNextRollover = () => {
      const now = new Date();
      const nextDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      const delay = Math.max(1, nextDay.getTime() - now.getTime() + 50);

      rolloverTimer = window.setTimeout(() => {
        setCurrentDayKey(getLocalDayKey(new Date()));
        scheduleNextRollover();
      }, delay);
    };

    scheduleNextRollover();

    return () => {
      if (rolloverTimer !== null) {
        window.clearTimeout(rolloverTimer);
      }
    };
  }, []);

  const clearCompletedRemovalTimer = useCallback(() => {
    if (completedRemovalTimerRef.current !== null) {
      window.clearTimeout(completedRemovalTimerRef.current);
      completedRemovalTimerRef.current = null;
    }
  }, []);

  const removePendingCompletedCard = useCallback(
    (requestedCardId?: string) => {
      const completedCardId = pendingCompletedCardIdRef.current;

      if (!completedCardId) {
        return;
      }

      const completedIndex = cards.findIndex(
        (card) => card.id === completedCardId,
      );
      const completedCard = cards[completedIndex];

      if (!completedCard) {
        clearCompletedRemovalTimer();
        pendingCompletedCardIdRef.current = null;
        pendingCompletedRemovalArmedRef.current = false;
        setPendingCompletedCardId(null);
        return;
      }

      const requestedCard = cards.find(
        (card) =>
          card.id === requestedCardId &&
          card.id !== completedCardId &&
          !card.completedAt,
      );
      let nextCardId = requestedCard?.id ?? '';

      if (!nextCardId) {
        for (let offset = 1; offset < cards.length; offset += 1) {
          const candidate =
            cards[(completedIndex + offset) % cards.length];

          if (candidate && !candidate.completedAt) {
            nextCardId = candidate.id;
            break;
          }
        }
      }

      clearCompletedRemovalTimer();
      pendingCompletedCardIdRef.current = null;
      pendingCompletedRemovalArmedRef.current = false;
      setPendingCompletedCardId(null);
      createTransientOutgoing(completedCard, 'completion');
      setCards((previous) =>
        previous.filter((card) => card.id !== completedCardId),
      );
      setActiveCardId(nextCardId);
    },
    [cards, clearCompletedRemovalTimer, createTransientOutgoing],
  );

  useEffect(() => {
    const pendingCompletedCard = cards.find(
      (card) => card.id === pendingCompletedCardId,
    );

    if (
      !pendingCompletedCardId ||
      !pendingCompletedRemovalArmedRef.current ||
      !pendingCompletedCard?.completedAt
    ) {
      return;
    }

    completedRemovalTimerRef.current = window.setTimeout(() => {
      if (
        pendingCompletedRemovalArmedRef.current &&
        pendingCompletedCardIdRef.current === pendingCompletedCardId
      ) {
        removePendingCompletedCard();
      }
    }, 2_500);

    return clearCompletedRemovalTimer;
  }, [
    clearCompletedRemovalTimer,
    cards,
    pendingCompletedCardId,
    removePendingCompletedCard,
  ]);

  const handleSelectCard = useCallback(
    (cardId: string) => {
      if (cardId === activeCard?.id) {
        return;
      }

      if (activeCard?.id === pendingCompletedCardIdRef.current) {
        removePendingCompletedCard(cardId);
        return;
      }

      if (activeCard) {
        createTransientOutgoing(activeCard, 'switch');
      }

      setActiveCardId(cardId);
    },
    [activeCard, createTransientOutgoing, removePendingCompletedCard],
  );

  const moveActiveCard = useCallback(
    (direction: -1 | 1) => {
      if (cards.length <= 1) {
        return;
      }

      const currentIndex = cards.findIndex(
        (card) => card.id === activeCardId,
      );
      const activeIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex =
        (activeIndex + direction + cards.length) % cards.length;

      handleSelectCard(cards[nextIndex]!.id);
    },
    [activeCardId, cards, handleSelectCard],
  );

  const handleNextCard = useCallback(
    () => moveActiveCard(1),
    [moveActiveCard],
  );

  const handlePreviousCard = useCallback(
    () => moveActiveCard(-1),
    [moveActiveCard],
  );

  const handleScenePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      isArchiveOpen ||
      isListSheetOpen ||
      isCreating ||
      (event.pointerType === 'mouse' && event.button !== 0) ||
      !isSceneGestureTarget(event.target)
    ) {
      return;
    }

    scenePointerRef.current = { id: event.pointerId, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleScenePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = scenePointerRef.current;

    if (!gesture || gesture.id !== event.pointerId) {
      return;
    }

    scenePointerRef.current = null;
    const deltaY = event.clientY - gesture.y;

    if (Math.abs(deltaY) < 48) {
      return;
    }

    if (deltaY < 0) {
      handleNextCard();
    } else {
      handlePreviousCard();
    }
  };

  const handleScenePointerCancel = () => {
    scenePointerRef.current = null;
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        isListSheetOpen
      ) {
        if (event.key === 'Escape' && isListSheetOpen) {
          setExpandedListCardId(null);
        }
        return;
      }

      if (
        isArchiveOpen ||
        isCreating ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault();
        handleNextCard();
      } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault();
        handlePreviousCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNextCard,
    handlePreviousCard,
    isArchiveOpen,
    isCreating,
    isListSheetOpen,
  ]);

  const handleStartCreating = () => {
    if (
      creationState !== 'idle' ||
      pendingCompletedCardId !== null
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
    if (kind === 'series') {
      setSelectedKind('series');
      setTimeMode('none');
      setDateTimeValue('');
      setDraftStep('title');
      return;
    }

    if (kind !== 'single') {
      if (kind === 'list') {
        setSelectedKind('list');
        setTimeMode(null);
        setDateTimeValue('');
        setDraftStep('list-items');
      }
      return;
    }

    setSelectedKind('single');
    setTimeMode(null);
    setDateTimeValue('');
    setDraftStep('title');
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
    const seriesTargetCount = Number(seriesTargetInput);
    const isValidSeriesTarget =
      Number.isInteger(seriesTargetCount) && seriesTargetCount >= 1;
    const isList = selectedKind === 'list';
    const listTitle = draftListItems[0]?.text.trim() || 'Список';
    const isReadyToCreate =
      creationState === 'editing' &&
      ((selectedKind === 'series' &&
        Boolean(draftTitle.trim()) &&
        isValidSeriesTarget) ||
        (isList && draftListItems.length >= 1) ||
        (selectedKind === 'single' &&
          Boolean(draftTitle.trim()) &&
          Boolean(creationTimeMode) &&
          (creationTimeMode === 'none' || Boolean(creationDateTimeValue))));

    if (!isReadyToCreate) {
      return;
    }

    setCreationState('committing');

    commitTimerRef.current = window.setTimeout(() => {
      const storedDate = creationDateTimeValue
        ? new Date(creationDateTimeValue).toISOString()
        : undefined;

      const now = new Date().toISOString();
      const isSeries = selectedKind === 'series';
      const newCard: VisualCard = {
        id: createId(),
        title: isList ? listTitle : draftTitle.trim(),
        kind: isSeries ? 'series' : isList ? 'list' : 'single',
        timeMode: isSeries ? 'none' : creationTimeMode!,
        deadlineAt:
          !isSeries && creationTimeMode === 'deadline' ? storedDate : undefined,
        reminderAt:
          !isSeries && creationTimeMode === 'reminder' ? storedDate : undefined,
        createdAt: now,
        series: isSeries
          ? {
              targetCount: seriesTargetCount,
              entries: [],
              startedAt: now,
              timingAnchorAt: now,
            }
          : undefined,
        list: isList ? { items: draftListItems } : undefined,
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

  const handleAddDraftListItem = () => {
    const text = draftListInput.trim();
    if (!text) {
      return;
    }
    setDraftListItems((previous) => [...previous, { id: createId(), text }]);
    setDraftListInput('');
  };

  const handleRemoveDraftListItem = (itemId: string) => {
    setDraftListItems((previous) =>
      previous.filter((item) => item.id !== itemId),
    );
  };

  const handleDraftBack = () => {
    if (draftStep === 'title') {
      setSelectedKind(null);
      setSeriesTargetInput('');
      setDraftStep('kind');
      return;
    }

    if (draftStep === 'time') {
      setTimeMode(null);
      setDateTimeValue('');
      setDraftStep(selectedKind === 'list' ? 'list-items' : 'title');
      return;
    }

    if (draftStep === 'series-target') {
      setSeriesTargetInput('');
      setDraftStep('title');
      return;
    }

    if (draftStep === 'list-items') {
      setSelectedKind(null);
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
      setDraftStep(
        selectedKind === 'series'
          ? 'series-target'
          : selectedKind === 'list'
            ? 'list-items'
            : 'time',
      );
      return;
    }

    if (draftStep === 'list-items' && draftListItems.length >= 1) {
      handleCreateCard(undefined, 'none');
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

    if (
      draftStep === 'series-target' &&
      selectedKind === 'series' &&
      Number.isInteger(Number(seriesTargetInput)) &&
      Number(seriesTargetInput) >= 1
    ) {
      setDraftStep('confirm');
      commitTimerRef.current = window.setTimeout(() => {
        handleCreateCard();
      }, 110);
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

  const handleCompleteCard = (
    couponBounds: DOMRect,
    cardToComplete: VisualCard | undefined = activeCard,
  ) => {
    if (
      !cardToComplete ||
      cardToComplete.completedAt ||
      couponFlightInProgressRef.current
    ) {
      return;
    }

    couponFlightInProgressRef.current = true;
    const completedAt = new Date().toISOString();

    const completedCard: VisualCard = {
      ...cardToComplete,
      completedAt,
    };
    detachedCouponLayerRef.current?.launch({
      id: completedCard.id,
      left: couponBounds.left,
      top: couponBounds.top,
      width: couponBounds.width,
      height: couponBounds.height,
      palette: getCardPalette(completedCard),
      label: completedCard.kind === 'series' ? 'Засчитать +1' : undefined,
    });
    const nextCards = cardsRef.current.map((card) =>
        card.id === completedCard.id ? completedCard : card,
      );
    cardsRef.current = nextCards;
    setCards(nextCards);
    setArchivedCards((previous) => [
      completedCard,
      ...previous.filter((card) => card.id !== completedCard.id),
    ]);
    pendingCompletedCardIdRef.current = completedCard.id;
    pendingCompletedRemovalArmedRef.current = true;
    setPendingCompletedCardId(completedCard.id);
  };

  const recordSeriesStep = (couponBounds: DOMRect) => {
    const currentCard = cardsRef.current.find(
      (card) => card.id === activeCardId,
    );
    const series = currentCard?.kind === 'series' ? currentCard.series : undefined;

    if (!currentCard || !series || currentCard.completedAt || couponFlightInProgressRef.current) {
      return;
    }

    const completedCount = series.entries.length;
    if (completedCount >= series.targetCount) {
      return;
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const anchorTime = new Date(series.timingAnchorAt).getTime();
    const durationMs = Number.isFinite(anchorTime)
      ? Math.max(0, now.getTime() - anchorTime)
      : 0;
    const entries = [
      ...series.entries,
      { completedAt: nowIso, durationMs },
    ];
    const isFinished = entries.length >= series.targetCount;
    const updatedCard: VisualCard = {
      ...currentCard,
      series: {
        ...series,
        entries,
        timingAnchorAt: nowIso,
        ...(isFinished
          ? { finishedAt: nowIso, finishReason: 'completed' as const }
          : {}),
      },
    };
    const nextCards = cardsRef.current.map((card) =>
      card.id === updatedCard.id ? updatedCard : card,
    );
    cardsRef.current = nextCards;
    setCards(nextCards);

    if (isFinished) {
      handleCompleteCard(couponBounds, updatedCard);
    }
  };

  const finishSeries = (couponBounds: DOMRect) => {
    const currentCard = cardsRef.current.find(
      (card) => card.id === activeCardId,
    );
    const series = currentCard?.kind === 'series' ? currentCard.series : undefined;

    if (!currentCard || !series || currentCard.completedAt || couponFlightInProgressRef.current) {
      return;
    }

    const nowIso = new Date().toISOString();
    const completedCard: VisualCard = {
      ...currentCard,
      series: {
        ...series,
        finishedAt: nowIso,
        finishReason: 'manual',
      },
    };
    handleCompleteCard(couponBounds, completedCard);
  };

  const toggleListItem = (itemId: string) => {
    setCards((previous) =>
      previous.map((card) => {
        if (card.id !== activeCardId || card.kind !== 'list' || !card.list || card.completedAt) {
          return card;
        }
        return {
          ...card,
          list: {
            items: card.list.items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    completedAt: item.completedAt
                      ? undefined
                      : new Date().toISOString(),
                  }
                : item,
            ),
          },
        };
      }),
    );
  };

  const addListItem = (cardId: string, rawText: string) => {
    const text = rawText.trim();

    if (
      !text ||
      cardId !== activeCardId ||
      pendingCompletedCardIdRef.current === cardId
    ) {
      return;
    }

    setCards((previous) =>
      previous.map((card) => {
        if (
          card.id !== cardId ||
          card.kind !== 'list' ||
          !card.list ||
          card.completedAt
        ) {
          return card;
        }

        return {
          ...card,
          list: {
            items: [...card.list.items, { id: createId(), text }],
          },
        };
      }),
    );
  };

  const handleDeleteCard = (cardId: string) => {
    const currentCards = cardsRef.current;
    const index = currentCards.findIndex((card) => card.id === cardId);
    const cardToDelete = currentCards[index];

    if (
      !cardToDelete ||
      cardToDelete.completedAt ||
      isCreating ||
      pendingCompletedCardIdRef.current !== null ||
      couponFlightInProgressRef.current
    ) {
      return;
    }

    const nextCard =
      currentCards.length > 1
        ? currentCards[(index + 1) % currentCards.length]
        : undefined;

    createTransientOutgoing(cardToDelete, 'discard');
    setCards((previous) => previous.filter((card) => card.id !== cardId));
    setActiveCardId(nextCard?.id ?? '');
  };

  // Applies an edit made on the card's edit face. Identity-defining fields and
  // completion state always come from the stored card, never from the edit.
  const handleSaveCard = (edited: VisualCard) => {
    setCards((previous) =>
      previous.map((card) =>
        card.id === edited.id && !card.completedAt
          ? {
              ...edited,
              id: card.id,
              kind: card.kind,
              timeMode: card.timeMode,
              createdAt: card.createdAt,
              completedAt: undefined,
            }
          : card,
      ),
    );
  };

  const handleCornerOpened = () => {
    if (isCornerHintDismissed) {
      return;
    }

    setIsCornerHintDismissed(true);

    try {
      window.localStorage.setItem(CORNER_HINT_STORAGE_KEY, '1');
    } catch {
      // The hint simply shows again next time when storage is unavailable.
    }
  };

  const handleExportBackup = () => {
    downloadTextFile(
      getBackupFilename(),
      serializeBackup(cardsRef.current, archivedCards),
    );
  };

  // Import only adds cards whose ids are not present yet, so it never
  // overwrites or removes anything that already exists on this device.
  const handleImportBackup = (text: string): BackupImportResult => {
    const backup = parseBackup(text);

    if (!backup) {
      return { ok: false, message: 'Файл не похож на копию Card Tracker' };
    }

    const knownIds = new Set(
      [...cardsRef.current, ...archivedCards].map((card) => card.id),
    );
    const takeNew = (incoming: VisualCard[]) =>
      incoming.filter((card) => {
        if (knownIds.has(card.id)) {
          return false;
        }

        knownIds.add(card.id);
        return true;
      });
    const newActive = takeNew(backup.cards);
    const newArchive = takeNew(backup.archive);

    if (newActive.length > 0) {
      const hasActiveCard = cardsRef.current.some(
        (card) => card.id === activeCardId,
      );

      setCards((previous) => [...previous, ...newActive]);

      if (!hasActiveCard) {
        setActiveCardId(newActive[0]!.id);
      }
    }

    if (newArchive.length > 0) {
      setArchivedCards((previous) =>
        [...previous, ...newArchive].sort(
          (left, right) =>
            new Date(right.completedAt ?? 0).getTime() -
            new Date(left.completedAt ?? 0).getTime(),
        ),
      );
    }

    return {
      ok: true,
      addedActive: newActive.length,
      addedArchive: newArchive.length,
    };
  };

  const handleCouponFlightComplete = useCallback(() => {
    couponFlightInProgressRef.current = false;
  }, []);

  const handleTransientOutgoingFinish = useCallback(
    (_kind: TransientOutgoingKind) => {
      setTransientOutgoing(null);
    },
    [],
  );

  return (
    <main className="relative h-full w-full overflow-hidden">
      <ArchiveView
        isOpen={isArchiveOpen}
        archivedCards={archivedCards}
        firstCardCreatedAt={firstCardCreatedAt}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
      />

      <div className="absolute inset-0 z-20 h-full w-full">
        <TableBackground />

        <div className="absolute inset-x-3 top-4 z-30 flex justify-center">
          <CardSwitcher
            cards={cards}
            activeCardId={activeCardId}
            onSelectCard={handleSelectCard}
            onNextCard={handleNextCard}
            onPreviousCard={handlePreviousCard}
          />
        </div>

      <div
        className="relative z-10 flex h-full w-full items-center justify-center px-4"
        style={{
          touchAction: 'pan-x',
          paddingTop: sceneTopReserve,
          paddingBottom: sceneBottomReserve,
        }}
        onPointerDown={handleScenePointerDown}
        onPointerUp={handleScenePointerEnd}
        onPointerCancel={handleScenePointerCancel}
      >
        <div
          className="relative shrink-0"
          style={{
            width: INITIAL_TASK_CARD_V2_CONFIG.width * sceneScale,
            height: INITIAL_TASK_CARD_V2_CONFIG.height * sceneScale,
          }}
        >
        <div
          className="absolute left-0 top-0"
          style={{
            width: INITIAL_TASK_CARD_V2_CONFIG.width,
            height: INITIAL_TASK_CARD_V2_CONFIG.height,
            transform: `scale(${sceneScale})`,
            transformOrigin: 'top left',
          }}
        >
          {activeCard && (
            <CardStack cards={cards} activeCardId={activeCardId} />
          )}

          <AnimatePresence initial={false} mode="popLayout">
            {activeCard && (
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
                  pointerEvents: isCreating ? 'none' : 'auto',
                }}
              >
                <TaskCard
                  card={activeCard}
                  onComplete={handleCompleteCard}
                  onRecordSeriesStep={recordSeriesStep}
                  onFinishSeries={finishSeries}
                  onToggleListItem={toggleListItem}
                  onSave={handleSaveCard}
                  onDelete={() => handleDeleteCard(activeCard.id)}
                  showCornerHint={
                    !isCornerHintDismissed &&
                    activeCard.id === cards[0]?.id
                  }
                  onCornerOpened={handleCornerOpened}
                  onOpenList={
                    activeCard.kind === 'list'
                      ? () => setExpandedListCardId(activeCard.id)
                      : undefined
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>

          {transientOutgoing && (
            <TransientTaskCardOverlay
              key={transientOutgoing.key}
              card={transientOutgoing.card}
              kind={transientOutgoing.kind}
              onFinish={handleTransientOutgoingFinish}
            />
          )}

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
                    className="absolute right-[18px] top-[13px] flex select-none items-center gap-2 whitespace-nowrap text-left"
                  >
                    {/* Stamped into the ghost sheet: a dark edge up-left and a
                        light one down-right, as before. The ink itself is light
                        because the ghost is a translucent sheet over the dark
                        table, where dark ink on it disappears. Sits at the right
                        end of the ghost's top edge, where most of it sticks out
                        above the card. */}
                    <span
                      className="font-serif text-[22px] font-medium leading-none"
                      style={{
                        color: 'rgba(214,205,186,0.8)',
                        textShadow: `
                          -1px -1px 1px rgba(0,0,0,0.72),
                          1px 1px 1px rgba(255,255,255,0.42)
                        `,
                      }}
                    >
                      +
                    </span>

                    <span
                      className="font-mono text-[10px] font-bold uppercase leading-none tracking-[0.16em]"
                      style={{
                        color: 'rgba(214,205,186,0.78)',
                        textShadow: `
                          -1px -1px 1px rgba(0,0,0,0.72),
                          1px 1px 1px rgba(255,255,255,0.4)
                        `,
                      }}
                    >
                      Добавить карту
                    </span>
                  </motion.span>
                </button>
              </motion.div>
            ) : (
              <div
                className="absolute inset-0 z-40"
              >
                <DraftCard
                  creationCycle={creationCycle}
                  creationState={creationState}
                  palette={draftPalette}
                  draftStep={draftStep}
                  canAdvanceDraft={canAdvanceDraft}
                  titleInputRef={titleInputRef}
                  draftTitle={draftTitle}
                  seriesTargetInput={seriesTargetInput}
                  draftListItems={draftListItems}
                  draftListInput={draftListInput}
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
                  onSeriesTargetChange={setSeriesTargetInput}
                  onListInputChange={setDraftListInput}
                  onAddListItem={handleAddDraftListItem}
                  onRemoveListItem={handleRemoveDraftListItem}
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
              </div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>

      <DetachedCompletionCoupon
        ref={detachedCouponLayerRef}
        onFlightComplete={handleCouponFlightComplete}
      />

      {expandedListCard && (
        <FullListSheet
          card={expandedListCard}
          onToggleItem={toggleListItem}
          onAddItem={addListItem}
          onClose={() => setExpandedListCardId(null)}
        />
      )}
      </div>

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
