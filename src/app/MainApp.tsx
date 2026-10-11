import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import cardboardTexture from '../assets/cardboard.avif';

import {
  CARD_RADIUS,
  GHOST_SETTINGS,
  GHOST_SHADOW,
  getCardPalette,
  PALETTES,
  PHYSICAL_SPRING,
  type VisualCard,
} from './cardTheme';
import {
  downloadTextFile,
  getBackupFilename,
  parseBackup,
  serializeBackup,
  type BackupImportResult,
} from './backupUtils';
import {
  loadCornerHintDismissed,
  saveCornerHintDismissed,
} from './persistence';
import {
  appendListItem,
  applyEdit,
  applySeriesStep,
  buildCompletedCard,
  createId,
  finishSeriesByHand,
  insertAt,
  pickNeighbourId,
  sortArchive,
  toggleListItem as toggleItem,
} from './cardOps';
import {
  getDeckState,
  setArchivedCards,
  setCards,
  setTrash,
  snapshotBeforeImport,
  useDeckStore,
} from './deckStore';
import { DEBUG_CARD_ID_PREFIX } from './debugCards';
import { getListProgress } from './listUtils';
import { reviveCard } from './archiveUtils';
import { formatPostponeMoment, getDueBucket, postponeCard } from './timeOps';
import { advanceRecurringCard } from './recurrence';
import { useCardDraft } from './useCardDraft';
import { purgeExpiredTrash } from './trash';
import { DebugCardsPanel } from '../components/DebugCardsPanel';
import { TrashBin } from '../components/trash/TrashBin';
import { CouponSpike } from '../components/table/CouponSpike';
import { TableSurface } from '../components/table/TableSurface';
import { TrashSheet } from '../components/trash/TrashSheet';
import { StorageNotice } from '../components/StorageNotice';
import { UndoTicket } from '../components/UndoTicket';
import { DraftCard } from '../components/draft-card/DraftCard';
import { ArchiveNavigation } from '../components/archive/ArchiveNavigation';
import { ArchiveView } from '../components/archive/ArchiveView';
import { CardStack } from '../components/card-stack/CardStack';
import { CardSwitcher } from '../components/card-switcher/CardSwitcher';
import { INITIAL_CARD_SWITCHER_CONFIG } from '../components/card-switcher/cardSwitcherConfig';
import { ARCHIVE_NAVIGATION_HEIGHT } from '../components/archive/ArchiveNavigation';
import { getCardScale, useViewportSize } from './viewportScale';
import { haptic } from './haptics';
import { useWheelNavigation } from './useWheelNavigation';
import { DeckDots } from '../components/card-stack/DeckDots';
import { getSwitcherMetrics } from '../components/card-switcher/cardSwitcherConfig';
import {
  DetachedCompletionCoupon,
  type DetachedCompletionCouponHandle,
} from '../components/task-card/DetachedCompletionCoupon';
import { TaskCard } from '../components/task-card/TaskCard';
import { TransientTaskCardOverlay } from '../components/task-card/TransientTaskCardOverlay';
import { INITIAL_TASK_CARD_V2_CONFIG } from '../components/task-card/taskCardV2Config';
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

interface TransientOutgoingCard {
  key: number;
  card: VisualCard;
  kind: TransientOutgoingKind;
}

/** Below this width the scene is a phone's: cards a little smaller. */
const PHONE_WIDTH_PX = 640;
const PHONE_SCENE_FACTOR = 0.9;
/** The stack stands this share of the screen's width left of the middle. */
const STACK_SHIFT_RATIO = 0.03;
/**
 * Finger travel (px) over the card for one card turned: slower than over the
 * dots, so the card can be scrubbed through with some care.
 */
const CARD_SCRUB_STEP_PX = 70;

interface SceneGesture {
  id: number;
  y: number;
  startIndex: number;
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
// The overview tabs hanging under the card list.
const SWITCHER_TOP = 16;
const SWITCHER_CHROME = 14;
const SWITCHER_ROW_GAP = 2;

const MainApp: React.FC = () => {
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  // The data layer (deckStore.ts) owns the cards, the archive and the bin.
  const cards = useDeckStore((state) => state.cards);
  const archivedCards = useDeckStore((state) => state.archivedCards);
  const trash = useDeckStore((state) => state.trash);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [trashBumpKey, setTrashBumpKey] = useState(0);
  const [spikeBumpKey, setSpikeBumpKey] = useState(0);
  // Coarse clock for the overview: deadlines become overdue as time passes.
  const [clockNow, setClockNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const [undoEntry, setUndoEntry] = useState<UndoEntry | null>(null);
  const undoSequenceRef = useRef(0);
  const [isCornerHintDismissed, setIsCornerHintDismissed] = useState(
    loadCornerHintDismissed,
  );

  const [activeCardId, setActiveCardId] = useState(() => cards[0]?.id ?? '');

  const [isGhostHovered, setIsGhostHovered] = useState(false);
  const [transientOutgoing, setTransientOutgoing] =
    useState<TransientOutgoingCard | null>(null);
  const [pendingCompletedCardId, setPendingCompletedCardId] =
    useState<string | null>(null);
  const [currentDayKey, setCurrentDayKey] = useState(() =>
    getLocalDayKey(new Date()),
  );

  const draft = useCardDraft({
    pendingCompletedCardId,
    onCreate: (card) => {
      setCards((previous) => [...previous, card]);
      setActiveCardId(card.id);
    },
  });

  const couponFlightInProgressRef = useRef(false);
  const detachedCouponLayerRef =
    useRef<DetachedCompletionCouponHandle | null>(null);
  const completedRemovalTimerRef = useRef<number | null>(null);
  const pendingCompletedCardIdRef = useRef<string | null>(null);
  const pendingCompletedRemovalArmedRef = useRef(false);
  const transientSequenceRef = useRef(0);
  const scenePointerRef = useRef<SceneGesture | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);

  const isCreating = draft.isCreating;
  const activeCard = cards.find((card) => card.id === activeCardId);
  // Any sheet lying over the table blocks the table's own gestures and keys.
  const isOverlayOpen = isTrashOpen;
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

  // Overdue cards: marked red in the list, and counted on the deck.
  const overdueIds = useMemo(
    () =>
      new Set(
        cards
          .filter((card) => getDueBucket(card, clockNow) === 'overdue')
          .map((card) => card.id),
      ),
    [cards, clockNow],
  );

  const isPhone = viewportWidth < PHONE_WIDTH_PX;
  const switcherMetrics = getSwitcherMetrics(isPhone);
  const switcherRows = Math.min(
    switcherMetrics.visibleRows,
    Math.max(1, cards.length),
  );
  const switcherBottom =
    SWITCHER_TOP +
    INITIAL_CARD_SWITCHER_CONFIG.positionY +
    SWITCHER_CHROME +
    switcherRows * switcherMetrics.rowHeight +
    (switcherRows - 1) * SWITCHER_ROW_GAP;
  const sceneTopReserve = switcherBottom + SCENE_TOP_OVERHANG;
  const sceneBottomReserve = ARCHIVE_NAVIGATION_HEIGHT + SCENE_BOTTOM_OVERHANG;
  const sceneScale =
    getCardScale(
      viewportWidth - sceneSideOverhang * 2,
      viewportHeight - sceneTopReserve - sceneBottomReserve,
      INITIAL_TASK_CARD_V2_CONFIG.width,
      INITIAL_TASK_CARD_V2_CONFIG.height,
    ) * (isPhone ? PHONE_SCENE_FACTOR : 1);
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
    return () => {
      if (completedRemovalTimerRef.current !== null) {
        window.clearTimeout(completedRemovalTimerRef.current);
      }
    };
  }, []);

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
      const nextCardId =
        requestedCard?.id ??
        pickNeighbourId(cards, completedIndex, completedCardId);

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

      haptic(7);
      setActiveCardId(cardId);
    },
    [activeCard, createTransientOutgoing, removePendingCompletedCard],
  );

  const moveActiveCard = useCallback(
    (direction: -1 | 1) => {
      if (cards.length <= 1) {
        return;
      }

      const currentIndex = cards.findIndex((card) => card.id === activeCardId);
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
      cards.length < 2 ||
      (event.pointerType === 'mouse' && event.button !== 0) ||
      !isSceneGestureTarget(event.target)
    ) {
      return;
    }

    scenePointerRef.current = {
      id: event.pointerId,
      y: event.clientY,
      startIndex: Math.max(
        0,
        cards.findIndex((card) => card.id === activeCardId),
      ),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  // Dragging up leafs forward through the deck, down leafs back, one card for
  // every CARD_SCRUB_STEP_PX, and the list follows card by card.
  const handleScenePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = scenePointerRef.current;

    if (!gesture || gesture.id !== event.pointerId) {
      return;
    }

    const steps = Math.trunc(
      (gesture.y - event.clientY) / CARD_SCRUB_STEP_PX,
    );
    const target = cards[
      Math.min(cards.length - 1, Math.max(0, gesture.startIndex + steps))
    ];

    if (target && target.id !== activeCardId) {
      handleSelectCard(target.id);
    }
  };

  const handleScenePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (scenePointerRef.current?.id === event.pointerId) {
      scenePointerRef.current = null;
    }
  };

  const handleSelectCardIndex = (index: number) => {
    const target = cards[index];

    if (target) {
      handleSelectCard(target.id);
    }
  };

  // The wheel over the stack turns the cards, as it does over the list and
  // the dots (a long list on the card keeps the wheel for its own scrolling).
  useWheelNavigation(sceneRef, {
    onNext: handleNextCard,
    onPrevious: handlePreviousCard,
    isEnabled: cards.length > 1 && !isArchiveOpen && !isOverlayOpen && !isCreating,
    ignoreWithin: '.overflow-y-auto, input, textarea',
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOverlayOpen) {
        if (event.key === 'Escape' && isTrashOpen) {
          setIsTrashOpen(false);
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
    const completedCard = buildCompletedCard(
      cardToComplete,
      new Date().toISOString(),
      createId(),
    );

    showUndo(
      cardToComplete.kind === 'series' ? 'Серия завершена' : 'Выполнено',
      {
        kind: 'complete',
        before: cardBefore ?? cardToComplete,
        index: getDeckState().cards.findIndex(
          (card) => card.id === cardToComplete.id,
        ),
        archivedId: completedCard.id,
      },
    );
    couponFlightInProgressRef.current = true;
    haptic([14, 36, 10]);

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
      const nextCards = getDeckState().cards.map((card) =>
        card.id === advanced.id ? advanced : card,
      );

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
      // shows the share counted before this press, a list its checked share.
      progress: completedCard.series
        ? Math.min(
            1,
            (cardBefore?.series ?? completedCard.series).entries.length /
              completedCard.series.targetCount,
          )
        : completedCard.list
          ? getListProgress(completedCard.list)
          : undefined,
    });
    const nextCards = getDeckState().cards.map((card) =>
        card.id === completedCard.id ? completedCard : card,
      );
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
    const currentCard = getDeckState().cards.find(
      (card) => card.id === activeCardId,
    );

    if (
      !currentCard ||
      currentCard.completedAt ||
      couponFlightInProgressRef.current
    ) {
      return;
    }

    const result = applySeriesStep(currentCard, new Date());

    if (!result) {
      return;
    }

    if (result.isFinished) {
      handleCompleteCard(couponBounds, result.card, currentCard);
      return;
    }

    setCards((previous) =>
      previous.map((card) => (card.id === result.card.id ? result.card : card)),
    );
  };

  const finishSeries = (couponBounds: DOMRect) => {
    const currentCard = getDeckState().cards.find(
      (card) => card.id === activeCardId,
    );

    if (
      !currentCard ||
      currentCard.completedAt ||
      couponFlightInProgressRef.current
    ) {
      return;
    }

    const finished = finishSeriesByHand(currentCard, new Date());

    if (finished) {
      handleCompleteCard(couponBounds, finished, currentCard);
    }
  };

  const toggleListItem = (itemId: string) => {
    const now = new Date();

    setCards((previous) =>
      previous.map((card) =>
        card.id === activeCardId ? toggleItem(card, itemId, now) : card,
      ),
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

    const item = { id: createId(), text };

    setCards((previous) =>
      previous.map((card) =>
        card.id === cardId ? appendListItem(card, item) : card,
      ),
    );
  };

  // Pins or unpins a card; the data layer keeps pinned cards at the head.
  const handleTogglePin = (cardId: string) => {
    haptic(12);
    setCards((previous) =>
      previous.map((card) =>
        card.id === cardId && !card.completedAt
          ? { ...card, pinned: card.pinned ? undefined : true }
          : card,
      ),
    );
  };

  const handleDeleteCard = (cardId: string) => {
    const currentCards = getDeckState().cards;
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

    const nextCardId = pickNeighbourId(currentCards, index, cardId);

    // Not destroyed: crumpled and thrown into the basket, from where it can be
    // put back for a while.
    createTransientOutgoing(cardToDelete, 'trash');
    setCards((previous) => previous.filter((card) => card.id !== cardId));
    setActiveCardId(nextCardId);
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

    const current = getDeckState().cards;
    const next = current.some((card) => card.id === before.id)
      ? current.map((card) => (card.id === before.id ? before : card))
      : insertAt(current, before, index);

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
      const current = getDeckState().cards;

      if (!current.some((card) => card.id === before.id)) {
        return;
      }

      const next = insertAt(
        current.filter((card) => card.id !== before.id),
        before,
        index,
      );

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
        index: getDeckState().cards.length,
      },
      ...previous.filter((item) => item.card.id !== cardId),
    ]);
    setTrashBumpKey((previous) => previous + 1);
    showUndo('Карточка в корзине', { kind: 'trash-archived', card: archived });
  };

  // Puts a card off: it gets its stamp and new time, slips to the back of the
  // deck, and the next card comes forward.
  const handlePostponeCard = (cardId: string, until: Date) => {
    const current = getDeckState().cards;
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
    const nextActiveId = pickNeighbourId(current, index, cardId) || cardId;

    setCards(next);

    if (nextActiveId !== cardId) {
      createTransientOutgoing(before, 'postpone');
    }

    setActiveCardId(nextActiveId);
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
        card.id === edited.id ? applyEdit(card, edited) : card,
      ),
    );
  };

  const handleCornerOpened = () => {
    if (isCornerHintDismissed) {
      return;
    }

    setIsCornerHintDismissed(true);
    saveCornerHintDismissed();
  };

  const handleExportBackup = () => {
    downloadTextFile(
      getBackupFilename(),
      serializeBackup(getDeckState().cards, archivedCards, trash),
    );
  };

  // Import only adds cards whose ids are not present yet, so it never
  // overwrites or removes anything that already exists on this device.
  const handleImportBackup = (text: string): BackupImportResult => {
    const backup = parseBackup(text);

    if (!backup) {
      return { ok: false, message: 'Файл не похож на копию Card Tracker' };
    }

    // Whatever the import does, the state just before it is kept.
    snapshotBeforeImport();

    const knownIds = new Set(
      [
        ...getDeckState().cards,
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
      const hasActiveCard = getDeckState().cards.some(
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
    const remaining = getDeckState().cards.filter(
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
      <StorageNotice />

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
            isPhone={isPhone}
            overdueIds={overdueIds}
          />
        </div>

      <div
        ref={sceneRef}
        className="relative z-10 flex h-full w-full items-center justify-center px-4"
        style={{
          touchAction: 'none',
          paddingTop: sceneTopReserve,
          paddingBottom: sceneBottomReserve,
        }}
        onPointerDown={handleScenePointerDown}
        onPointerMove={handleScenePointerMove}
        onPointerUp={handleScenePointerEnd}
        onPointerCancel={handleScenePointerEnd}
      >
        <div
          className="relative shrink-0"
          style={{
            width: INITIAL_TASK_CARD_V2_CONFIG.width * sceneScale,
            height: INITIAL_TASK_CARD_V2_CONFIG.height * sceneScale,
            // The stack stands a little left of the middle, leaving room for
            // the dots on its right.
            transform: `translateX(${-viewportWidth * STACK_SHIFT_RATIO}px)`,
          }}
        >
          <DeckDots
            cards={cards}
            activeCardId={activeCardId}
            overdueIds={overdueIds}
            onSelectIndex={handleSelectCardIndex}
            onNext={handleNextCard}
            onPrevious={handlePreviousCard}
          />
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
                key={draft.creationCycle}
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
                  onTogglePin={() => handleTogglePin(activeCard.id)}
                  showCornerHint={
                    !isCornerHintDismissed &&
                    activeCard.id === cards[0]?.id
                  }
                  onCornerOpened={handleCornerOpened}
                  onAddListItem={(text) =>
                    addListItem(activeCard.id, text)
                  }
                  isOverdue={overdueIds.has(activeCard.id)}
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
            {draft.creationState === 'idle' && (
              <motion.div
                key={`ghost-border-${draft.creationCycle}`}
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
            {draft.creationState === 'idle' ? (
              <motion.div
                key={`ghost-${draft.creationCycle}`}
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
                  onClick={() => {
                    if (draft.startCreating()) {
                      setIsGhostHovered(false);
                    }
                  }}
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
                <DraftCard {...draft.draftCardProps} />
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


const TableBackground: React.FC = () => <TableSurface />;

export default MainApp;
