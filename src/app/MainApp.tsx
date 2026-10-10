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
  pickNewCardColorId,
  PALETTES,
  PHYSICAL_SPRING,
  type CardKind,
  type CreationState,
  type DraftStep,
  type TimeMode,
  type VisualCard,
  type RecurrenceRule,
  type TaskListItem,
} from './cardTheme';
import {
  downloadTextFile,
  getBackupFilename,
  parseBackup,
  serializeBackup,
  type BackupImportResult,
} from './backupUtils';
import {
  loadActiveCards,
  loadArchivedCards,
  saveActiveCards,
  saveArchivedCards,
} from './persistence';
import { DEBUG_CARD_ID_PREFIX } from './debugCards';
import { getListProgress } from './listUtils';
import { reviveCard } from './archiveUtils';
import { formatPostponeMoment, postponeCard } from './timeOps';
import {
  advanceRecurringCard,
  firstOccurrence,
  isRecurrenceComplete,
} from './recurrence';
import {
  loadTrash,
  purgeExpiredTrash,
  saveTrash,
  type TrashedCard,
} from './trash';
import { DebugCardsPanel } from '../components/DebugCardsPanel';
import { TrashBin } from '../components/trash/TrashBin';
import { CouponSpike } from '../components/table/CouponSpike';
import { TrashSheet } from '../components/trash/TrashSheet';
import { UndoTicket } from '../components/UndoTicket';
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

type TransientOutgoingKind =
  | 'switch'
  | 'completion'
  | 'discard'
  | 'trash'
  | 'postpone';

/** The last destructive action, which the undo ticket can take back. */
type UndoAction =
  | { kind: 'trash'; cardId: string }
  | {
      kind: 'complete';
      before: VisualCard;
      index: number;
      /** Id of the card that went to the archive (a copy for a repeating card). */
      archivedId: string;
    }
  /** A card thrown away from the archive; undo files it back there. */
  | { kind: 'trash-archived'; card: VisualCard }
  /** A card put off; undo returns it as it was, to its old place. */
  | { kind: 'postpone'; before: VisualCard; index: number };

interface UndoEntry {
  key: number;
  message: string;
  action: UndoAction;
}

const UNDO_DURATION_MS = 6_000;

/** Whether the pending undo is about a card now in the bin (any, or `cardId`). */
const undoIsAboutTrashedCard = (
  action: UndoAction | undefined,
  cardId?: string,
): boolean =>
  (action?.kind === 'trash' &&
    (cardId === undefined || action.cardId === cardId)) ||
  (action?.kind === 'trash-archived' &&
    (cardId === undefined || action.card.id === cardId));

const sortArchive = (cards: VisualCard[]): VisualCard[] =>
  [...cards].sort(
    (left, right) =>
      new Date(right.completedAt ?? 0).getTime() -
      new Date(left.completedAt ?? 0).getTime(),
  );

const insertAt = <T,>(items: T[], item: T, index: number): T[] => {
  const next = [...items];
  next.splice(Math.max(0, Math.min(index, next.length)), 0, item);
  return next;
};

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
const NARROW_SCENE_SIDE_OVERHANG = 64;
const SWITCHER_TOP = 16;
const SWITCHER_CHROME = 14;
const SWITCHER_ROW_GAP = 2;

const MainApp: React.FC = () => {
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [trash, setTrash] = useState<TrashedCard[]>(loadTrash);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [trashBumpKey, setTrashBumpKey] = useState(0);
  const [spikeBumpKey, setSpikeBumpKey] = useState(0);
  const [undoEntry, setUndoEntry] = useState<UndoEntry | null>(null);
  const undoSequenceRef = useRef(0);
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
  // Set while creating a repeating card ("Регулярно" in the time step).
  const [draftRecurrence, setDraftRecurrence] =
    useState<RecurrenceRule | null>(null);
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
  // Any sheet lying over the table blocks the table's own gestures and keys.
  const isOverlayOpen = isListSheetOpen || isTrashOpen;
  // Coupons torn off today, as paper colours for the slips on the spike.
  const todaySlipPapers = useMemo(
    () =>
      archivedCards
        .filter(
          (card) =>
            card.completedAt !== undefined &&
            getLocalDayKey(new Date(card.completedAt)) === currentDayKey,
        )
        .map((card) => getCardPalette(card).paper),
    [archivedCards, currentDayKey],
  );
  // On narrow screens the basket and the spike stand right beside the card, so
  // the card keeps a little more room at its sides.
  const sceneSideOverhang =
    viewportWidth < 640 ? NARROW_SCENE_SIDE_OVERHANG : SCENE_SIDE_OVERHANG;
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
    viewportWidth - sceneSideOverhang * 2,
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
    (draftStep === 'repeat' && isRecurrenceComplete(draftRecurrence)) ||
    // Any time of day is fine for a repeating card: its first sheet is
    // simply the next day that time is still ahead.
    (draftStep === 'clock' &&
      (isSelectedDateTimeValid || draftRecurrence !== null));

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
    setDraftRecurrence(null);
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
    saveActiveCards(cards);
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
    saveTrash(trash);
  }, [trash]);

  useEffect(() => {
    saveArchivedCards(archivedCards);
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
      isOverlayOpen ||
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
      if (isOverlayOpen) {
        if (event.key === 'Escape') {
          if (isTrashOpen) {
            setIsTrashOpen(false);
          } else {
            setExpandedListCardId(null);
          }
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
    isOverlayOpen,
    isTrashOpen,
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
      const lastCard = cardsRef.current.at(-1);
      const newCard: VisualCard = {
        id: createId(),
        // Pastel scheme that differs from the card it will sit next to.
        colorId: pickNewCardColorId(
          lastCard ? getCardPalette(lastCard).id : undefined,
        ),
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
        recurrence:
          !isSeries && !isList && creationTimeMode === 'reminder' && draftRecurrence
            ? draftRecurrence
            : undefined,
      };

      setCards((previous) => [...previous, newCard]);
      setActiveCardId(newCard.id);

      resetDraft();
      setCreationCycle((previous) => previous + 1);
      setCreationState('idle');
    }, 340);
  };

  // "Регулярно": a repeating card is a reminder whose time moves on to the
  // next sheet each time it is torn off. First choose how often.
  const handleSelectRepeat = () => {
    setTimeMode('reminder');
    setDateTimeValue('');
    setDraftRecurrence((current) => current ?? { kind: 'daily' });
    setDraftStep('repeat');
  };

  const handleSelectTimeMode = (mode: TimeMode) => {
    setTimeMode(mode);
    setDraftRecurrence(null);

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

    if (draftStep === 'repeat') {
      setTimeMode(null);
      setDraftRecurrence(null);
      setDraftStep('time');
      return;
    }

    if (draftStep === 'clock') {
      setDraftStep(draftRecurrence ? 'repeat' : 'date');
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

    if (draftStep === 'repeat' && isRecurrenceComplete(draftRecurrence)) {
      // The clock works on tomorrow's date so every time of day is allowed;
      // the real first sheet is worked out when the card is created.
      const tomorrow = addLocalDays(startOfLocalDay(new Date()), 1);

      setSelectedDraftDate(tomorrow);
      setDraftHour(9);
      setDraftMinute(0);
      setDraftHourInput(padNumber(9));
      setDraftMinuteInput(padNumber(0));
      setDraftStep('clock');
      return;
    }

    if (draftStep === 'clock' && draftRecurrence) {
      const first = firstOccurrence(draftRecurrence, draftHour, draftMinute);
      const firstValue = createLocalDateTimeValue(
        first,
        first.getHours(),
        first.getMinutes(),
      );

      setDateTimeValue(firstValue);
      setDraftStep('confirm');
      commitTimerRef.current = window.setTimeout(() => {
        handleCreateCard(undefined, 'reminder', firstValue);
      }, 110);
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

  // `cardBefore` is the card exactly as it was before the press that completed
  // it (for a series that is before its last step was counted); undo returns
  // the card to that state.
  const handleCompleteCard = (
    couponBounds: DOMRect,
    cardToComplete: VisualCard | undefined = activeCard,
    cardBefore: VisualCard | undefined = cardToComplete,
  ) => {
    if (
      !cardToComplete ||
      cardToComplete.completedAt ||
      couponFlightInProgressRef.current
    ) {
      return;
    }

    // A repeating card is a tear-off pad: today's sheet goes to the archive as
    // its own card, the pad stays on the table showing the next sheet.
    const isRepeating = Boolean(cardToComplete.recurrence);
    const completedAt = new Date().toISOString();
    const completedCard: VisualCard = isRepeating
      ? {
          ...cardToComplete,
          id: createId(),
          completedAt,
          recurrence: undefined,
          postponements: undefined,
        }
      : { ...cardToComplete, completedAt };

    showUndo(
      cardToComplete.kind === 'series' ? 'Серия завершена' : 'Выполнено',
      {
        kind: 'complete',
        before: cardBefore ?? cardToComplete,
        index: cardsRef.current.findIndex(
          (card) => card.id === cardToComplete.id,
        ),
        archivedId: completedCard.id,
      },
    );
    couponFlightInProgressRef.current = true;

    if (isRepeating) {
      detachedCouponLayerRef.current?.launch({
        id: completedCard.id,
        left: couponBounds.left,
        top: couponBounds.top,
        width: couponBounds.width,
        height: couponBounds.height,
        palette: getCardPalette(cardToComplete),
      });

      const advanced = advanceRecurringCard(cardToComplete);
      const nextCards = cardsRef.current.map((card) =>
        card.id === advanced.id ? advanced : card,
      );

      cardsRef.current = nextCards;
      setCards(nextCards);
      setArchivedCards((previous) => [completedCard, ...previous]);
      // The torn sheet slides away and uncovers the next one underneath.
      createTransientOutgoing(cardToComplete, 'completion');
      return;
    }

    detachedCouponLayerRef.current?.launch({
      id: completedCard.id,
      left: couponBounds.left,
      top: couponBounds.top,
      width: couponBounds.width,
      height: couponBounds.height,
      palette: getCardPalette(completedCard),
      label: completedCard.kind === 'series' ? 'Засчитать +1' : undefined,
      // The fill the on-card coupon was showing when it was pressed: a series
      // shows the share before this step counted (unless it is finished by
      // hand), a list its checked share.
      progress: completedCard.series
        ? Math.min(
            1,
            (completedCard.series.finishReason === 'manual'
              ? completedCard.series.entries.length
              : Math.max(0, completedCard.series.entries.length - 1)) /
              completedCard.series.targetCount,
          )
        : completedCard.list
          ? getListProgress(completedCard.list)
          : undefined,
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
      handleCompleteCard(couponBounds, updatedCard, currentCard);
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
    handleCompleteCard(couponBounds, completedCard, currentCard);
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

    // Not destroyed: crumpled and thrown into the basket, from where it can be
    // put back for a while.
    createTransientOutgoing(cardToDelete, 'trash');
    setCards((previous) => previous.filter((card) => card.id !== cardId));
    setActiveCardId(nextCard?.id ?? '');
    setTrash((previous) => [
      { card: cardToDelete, trashedAt: new Date().toISOString(), index },
      ...previous.filter((item) => item.card.id !== cardId),
    ]);
    showUndo('Карточка в корзине', { kind: 'trash', cardId });
  };

  function showUndo(message: string, action: UndoAction) {
    undoSequenceRef.current += 1;
    setUndoEntry({ key: undoSequenceRef.current, message, action });
  }

  const handleUndoExpire = useCallback(() => setUndoEntry(null), []);

  // Puts a card from the basket back into the deck at the place it had and
  // brings it to the front.
  const restoreFromTrash = (cardId: string) => {
    const item = trash.find((entry) => entry.card.id === cardId);

    if (!item) {
      return;
    }

    // A completion still settling on the table is finished first, so the two
    // transitions do not fight over the active card.
    const isSettling = pendingCompletedCardIdRef.current !== null;

    if (isSettling) {
      removePendingCompletedCard();
    }

    setTrash((previous) =>
      previous.filter((entry) => entry.card.id !== cardId),
    );
    setCards((previous) =>
      previous.some((card) => card.id === cardId)
        ? previous
        : insertAt(previous, item.card, item.index),
    );

    if (!isSettling && activeCard && activeCard.id !== cardId) {
      createTransientOutgoing(activeCard, 'switch');
    }

    setActiveCardId(cardId);
    setUndoEntry((current) =>
      undoIsAboutTrashedCard(current?.action, cardId)
        ? null
        : current,
    );
  };

  const deleteFromTrashForever = (cardId: string) => {
    setTrash((previous) =>
      previous.filter((entry) => entry.card.id !== cardId),
    );
    setUndoEntry((current) =>
      undoIsAboutTrashedCard(current?.action, cardId)
        ? null
        : current,
    );
  };

  const emptyTrash = () => {
    setTrash([]);
    setUndoEntry((current) =>
      undoIsAboutTrashedCard(current?.action) ? null : current,
    );
  };

  // Takes a completion back: the coupon is taken out of the air, the card
  // leaves the archive and returns to the deck exactly as it was before.
  const undoCompletion = (
    before: VisualCard,
    index: number,
    archivedId: string,
  ) => {
    clearCompletedRemovalTimer();
    pendingCompletedCardIdRef.current = null;
    pendingCompletedRemovalArmedRef.current = false;
    setPendingCompletedCardId(null);
    detachedCouponLayerRef.current?.cancel();
    couponFlightInProgressRef.current = false;

    setArchivedCards((previous) =>
      previous.filter((card) => card.id !== archivedId),
    );
    setTransientOutgoing((current) =>
      current?.card.id === before.id ? null : current,
    );

    const current = cardsRef.current;
    const next = current.some((card) => card.id === before.id)
      ? current.map((card) => (card.id === before.id ? before : card))
      : insertAt(current, before, index);

    cardsRef.current = next;
    setCards(next);

    if (activeCard && activeCard.id !== before.id && !activeCard.completedAt) {
      createTransientOutgoing(activeCard, 'switch');
    }

    setActiveCardId(before.id);
  };

  const handleUndo = () => {
    const entry = undoEntry;

    if (!entry) {
      return;
    }

    setUndoEntry(null);

    if (entry.action.kind === 'trash') {
      restoreFromTrash(entry.action.cardId);
    } else if (entry.action.kind === 'postpone') {
      const { before, index } = entry.action;
      const current = cardsRef.current;

      if (!current.some((card) => card.id === before.id)) {
        return;
      }

      const next = insertAt(
        current.filter((card) => card.id !== before.id),
        before,
        index,
      );

      cardsRef.current = next;
      setCards(next);

      if (activeCard && activeCard.id !== before.id) {
        createTransientOutgoing(activeCard, 'switch');
      }

      setActiveCardId(before.id);
    } else if (entry.action.kind === 'trash-archived') {
      const archived = entry.action.card;

      setTrash((previous) =>
        previous.filter((item) => item.card.id !== archived.id),
      );
      setArchivedCards((previous) =>
        previous.some((card) => card.id === archived.id)
          ? previous
          : sortArchive([archived, ...previous]),
      );
    } else {
      undoCompletion(
        entry.action.before,
        entry.action.index,
        entry.action.archivedId,
      );
    }
  };

  // Takes a card out of the archive and puts it back on the table as a live
  // card, at the end of the deck, and shows it.
  const handleReturnFromArchive = (cardId: string) => {
    const archived = archivedCards.find((card) => card.id === cardId);

    if (!archived || pendingCompletedCardIdRef.current === cardId) {
      return;
    }

    const revived = reviveCard(archived);

    setArchivedCards((previous) =>
      previous.filter((card) => card.id !== cardId),
    );
    setCards((previous) =>
      previous.some((card) => card.id === cardId)
        ? previous
        : [...previous, revived],
    );
    setActiveCardId(cardId);
    setIsArchiveOpen(false);
  };

  // Throws an archived card into the basket; undo files it back into the
  // archive, while "Вернуть" in the basket puts it on the table.
  const handleTrashFromArchive = (cardId: string) => {
    const archived = archivedCards.find((card) => card.id === cardId);

    if (!archived || pendingCompletedCardIdRef.current === cardId) {
      return;
    }

    setArchivedCards((previous) =>
      previous.filter((card) => card.id !== cardId),
    );
    setTrash((previous) => [
      {
        card: reviveCard(archived),
        trashedAt: new Date().toISOString(),
        index: cardsRef.current.length,
      },
      ...previous.filter((item) => item.card.id !== cardId),
    ]);
    setTrashBumpKey((previous) => previous + 1);
    showUndo('Карточка в корзине', { kind: 'trash-archived', card: archived });
  };

  // Puts a card off: it gets its stamp and new time, slips to the back of the
  // deck, and the next card comes forward.
  const handlePostponeCard = (cardId: string, until: Date) => {
    const current = cardsRef.current;
    const index = current.findIndex((card) => card.id === cardId);
    const before = current[index];

    if (
      !before ||
      before.completedAt ||
      pendingCompletedCardIdRef.current !== null ||
      couponFlightInProgressRef.current
    ) {
      return;
    }

    const postponed = postponeCard(before, until);
    const next = [...current.filter((card) => card.id !== cardId), postponed];
    const nextActive =
      next.length > 1 ? next[Math.min(index, next.length - 2)]! : postponed;

    cardsRef.current = next;
    setCards(next);

    if (nextActive.id !== cardId) {
      createTransientOutgoing(before, 'postpone');
    }

    setActiveCardId(nextActive.id);
    showUndo(`Отложено: ${formatPostponeMoment(until)}`, {
      kind: 'postpone',
      before,
      index,
    });
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
      serializeBackup(cardsRef.current, archivedCards, trash),
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
      [
        ...cardsRef.current,
        ...archivedCards,
        ...trash.map((item) => item.card),
      ].map((card) => card.id),
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
    const newTrashCards = new Set(
      takeNew(backup.trash.map((item) => item.card)).map((card) => card.id),
    );
    const newTrash = backup.trash.filter((item) =>
      newTrashCards.has(item.card.id),
    );

    if (newTrash.length > 0) {
      setTrash((previous) =>
        purgeExpiredTrash([...previous, ...newTrash]).sort(
          (left, right) =>
            new Date(right.trashedAt).getTime() -
            new Date(left.trashedAt).getTime(),
        ),
      );
    }

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
      addedTrash: newTrash.length,
    };
  };

  // DEV-only: append test cards (never replaces existing data) and select the
  // first of them; the second handler removes only what the first one added.
  const handleAddDebugCards = (created: VisualCard[]) => {
    if (created.length === 0) {
      return;
    }

    setCards((previous) => [...previous, ...created]);
    setActiveCardId(created[0]!.id);
  };

  const handleRemoveDebugCards = () => {
    const remaining = cardsRef.current.filter(
      (card) => !card.id.startsWith(DEBUG_CARD_ID_PREFIX),
    );

    setCards(remaining);
    setTrash((previous) =>
      previous.filter(
        (item) => !item.card.id.startsWith(DEBUG_CARD_ID_PREFIX),
      ),
    );
    setActiveCardId(
      remaining.some((card) => card.id === activeCardId)
        ? activeCardId
        : (remaining[0]?.id ?? ''),
    );
  };

  const handleCouponFlightComplete = useCallback((landed: boolean) => {
    couponFlightInProgressRef.current = false;

    if (landed) {
      // The coupon has just been speared: the spike gives a little bump.
      setSpikeBumpKey((previous) => previous + 1);
    }
  }, []);

  const handleTransientOutgoingFinish = useCallback(
    (kind: TransientOutgoingKind) => {
      setTransientOutgoing(null);

      if (kind === 'trash') {
        // The crumpled card has just landed: the basket gives a little bump.
        setTrashBumpKey((previous) => previous + 1);
      }
    },
    [],
  );

  return (
    <main className="relative h-full w-full overflow-hidden">
      <ArchiveView
        isOpen={isArchiveOpen}
        archivedCards={archivedCards}
        liveCards={cards}
        settlingCardId={pendingCompletedCardId}
        onReturnCard={handleReturnFromArchive}
        onTrashCard={handleTrashFromArchive}
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
                  onPostpone={(until) =>
                    handlePostponeCard(activeCard.id, until)
                  }
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
                      className="font-serif text-[24px] font-medium leading-none"
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
                      className="font-mono text-[12.5px] font-bold uppercase leading-none tracking-[0.16em]"
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
                  onSelectRepeat={handleSelectRepeat}
                  onRecurrenceChange={setDraftRecurrence}
                  draftRecurrence={draftRecurrence}
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

      {/* The basket stands on the table, in the corner just above the edge. */}
      <TrashBin
        count={trash.length}
        bumpKey={trashBumpKey}
        onOpen={() => setIsTrashOpen(true)}
        style={{ left: 12, bottom: ARCHIVE_NAVIGATION_HEIGHT + 12 }}
      />

      {/* Opposite the basket: today's torn coupons, and a way into the archive. */}
      <CouponSpike
        slipPapers={todaySlipPapers}
        bumpKey={spikeBumpKey}
        onOpen={() => setIsArchiveOpen(true)}
        style={{ right: 12, bottom: ARCHIVE_NAVIGATION_HEIGHT + 12 }}
      />

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

      {isTrashOpen && (
        <TrashSheet
          items={trash}
          canRestore={!isCreating}
          onRestore={(cardId) => {
            restoreFromTrash(cardId);
            setIsTrashOpen(false);
          }}
          onDeleteForever={deleteFromTrashForever}
          onEmpty={emptyTrash}
          onClose={() => setIsTrashOpen(false)}
        />
      )}
      </div>

      <ArchiveNavigation
        isArchiveOpen={isArchiveOpen}
        onToggle={() => setIsArchiveOpen((previous) => !previous)}
      />

      {/* Rides over the bottom edge of the table, never over the card. */}
      {undoEntry && (
        <UndoTicket
          key={undoEntry.key}
          message={undoEntry.message}
          onUndo={handleUndo}
          onExpire={handleUndoExpire}
          durationMs={UNDO_DURATION_MS}
          style={{ bottom: 14 }}
        />
      )}

      {import.meta.env.DEV && (
        <DebugCardsPanel
          disabled={isCreating || pendingCompletedCardId !== null}
          onAddCards={handleAddDebugCards}
          onRemoveDebugCards={handleRemoveDebugCards}
        />
      )}

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
