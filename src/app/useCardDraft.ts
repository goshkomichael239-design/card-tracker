import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from 'react';

import type { DraftCard } from '../components/draft-card/DraftCard';
import { createId } from './cardOps';
import {
  getCardPalette,
  getColorSchemeById,
  pickNewCardColorId,
  type CardKind,
  type CreationState,
  type DraftStep,
  type RecurrenceRule,
  type TaskListItem,
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
import { getDeckState } from './deckStore';
import { parseQuickEntry, type QuickEntry } from './parseQuickEntry';
import { firstOccurrence, isRecurrenceComplete } from './recurrence';
import { t } from './i18n';

/** The colour scheme of the last card in the deck (the new one sits next to it). */
const pickLastColorId = (): string | undefined => {
  const last = getDeckState().cards.at(-1);
  return last ? getCardPalette(last).id : undefined;
};

interface UseCardDraftOptions {
  /** A completion is still settling on the table: a new card must wait. */
  pendingCompletedCardId: string | null;
  /** The card is ready: the deck adds it at the end and shows it. */
  onCreate: (card: VisualCard) => void;
}

/**
 * Everything about making a new card: the steps of the draft (kind, title,
 * time, repeat, date, clock), their validation and the creation itself.
 * `draftCardProps` is what the draft card's form needs, ready to spread.
 */
export function useCardDraft({
  pendingCompletedCardId,
  onCreate,
}: UseCardDraftOptions) {
  // "Now" while a draft is open, so validity is worked out in render without
  // reading the clock there; it is refreshed when a draft starts and while open.
  const [clockMs, setClockMs] = useState(() => Date.now());
  // The colour the new card will have: chosen when the draft opens, so the
  // paper is already that colour while it is being filled in.
  const [draftColorId, setDraftColorId] = useState(() =>
    pickNewCardColorId(pickLastColorId()),
  );
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
  // "Нет, выберу сам": the line was understood, the person wants the choices.
  const [isManualKind, setIsManualKind] = useState(false);
  // The title was written on the first step (not on a step of its own), so
  // "back" returns there.
  const [isTitleFromKindStep, setIsTitleFromKindStep] = useState(false);

  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const commitTimerRef = useRef<number | null>(null);

  const draftPalette = getColorSchemeById(draftColorId);

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
    selectedDraftDateTime.getTime() >= clockMs;
  const selectedDateLabel = getDraftDateLabel(
    selectedDraftDate,
    currentDraftDay,
  );
  const datePresets = [
    {
      label: t('Завтра'),
      date: addLocalDays(currentDraftDay, 1),
    },
    {
      label: t('Послезавтра'),
      date: addLocalDays(currentDraftDay, 2),
    },
    {
      label: t('В понедельник'),
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
  // What the app made of the line typed on the first step.
  const quickEntry: QuickEntry | null = useMemo(
    () =>
      creationState === 'editing' && draftStep === 'kind' && !isManualKind
        ? parseQuickEntry(draftTitle, new Date(clockMs))
        : null,
    [creationState, draftStep, isManualKind, draftTitle, clockMs],
  );
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
    setIsManualKind(false);
    setIsTitleFromKindStep(false);
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


  useEffect(() => {
    if (
      creationState !== 'editing' ||
      (draftStep !== 'title' && draftStep !== 'kind')
    ) {
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
    if (creationState === 'idle') {
      return;
    }

    const timer = window.setInterval(() => setClockMs(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, [creationState]);

  useEffect(
    () => () => {
      if (commitTimerRef.current !== null) {
        window.clearTimeout(commitTimerRef.current);
      }
    },
    [],
  );

  /** Opens a blank draft; false when it cannot be started right now. */
  const handleStartCreating = (): boolean => {
    if (creationState !== 'idle' || pendingCompletedCardId !== null) {
      return false;
    }

    resetDraft();
    setClockMs(Date.now());
    setDraftColorId(pickNewCardColorId(pickLastColorId()));
    setCreationState('editing');
    return true;
  };

  const handleCancelCreating = () => {
    if (creationState !== 'editing') {
      return;
    }

    resetDraft();
    setCreationState('idle');
  };

  const handleSelectKind = (kind: CardKind) => {
    // A line was already written on the first step: it is the title.
    const typed = draftTitle.trim();

    if (typed && draftStep === 'kind') {
      setIsTitleFromKindStep(true);
      setDateTimeValue('');

      if (kind === 'series') {
        setSelectedKind('series');
        setTimeMode('none');
        setDraftStep('series-target');
        return;
      }

      if (kind === 'list') {
        setSelectedKind('list');
        setTimeMode(null);
        setDraftListItems((items) =>
          items.length > 0 ? items : [{ id: createId(), text: typed }],
        );
        setDraftStep('list-items');
        return;
      }

      setSelectedKind('single');
      setTimeMode(null);
      setDraftStep('time');
      return;
    }

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
    const listTitle = draftListItems[0]?.text.trim() || t('Список');
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
        // The scheme the paper already had while it was being filled in.
        colorId: draftColorId,
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

      onCreate(newCard);

      resetDraft();
      setCreationCycle((previous) => previous + 1);
      setCreationState('idle');
    }, 340);
  };

  // The line was understood and the person said yes: the card is made at once.
  const handleQuickCreate = () => {
    const entry = quickEntry;

    if (!entry || creationState !== 'editing') {
      return;
    }

    setCreationState('committing');

    commitTimerRef.current = window.setTimeout(() => {
      const now = new Date().toISOString();
      const base = {
        id: createId(),
        colorId: draftColorId,
        createdAt: now,
      };
      let newCard: VisualCard;

      if (entry.kind === 'series') {
        newCard = {
          ...base,
          title: entry.title,
          kind: 'series',
          timeMode: 'none',
          series: {
            targetCount: entry.target,
            entries: [],
            startedAt: now,
            timingAnchorAt: now,
          },
        };
      } else if (entry.kind === 'list') {
        newCard = {
          ...base,
          title: entry.title,
          kind: 'list',
          timeMode: 'none',
          list: {
            items: entry.items.map((text) => ({ id: createId(), text })),
          },
        };
      } else {
        const due = entry.recurrence
          ? firstOccurrence(
              entry.recurrence,
              entry.at.getHours(),
              entry.at.getMinutes(),
            )
          : entry.at;

        newCard = {
          ...base,
          title: entry.title,
          kind: 'single',
          timeMode: entry.timeMode,
          deadlineAt:
            entry.timeMode === 'deadline' ? due.toISOString() : undefined,
          reminderAt:
            entry.timeMode === 'reminder' ? due.toISOString() : undefined,
          recurrence: entry.recurrence,
        };
      }

      onCreate(newCard);

      resetDraft();
      setCreationCycle((previous) => previous + 1);
      setCreationState('idle');
    }, 340);
  };

  // Enter in the first field: make it as understood; otherwise carry on as a
  // plain task with the line as its title (the likeliest choice).
  const handleKindEnter = () => {
    if (quickEntry) {
      handleQuickCreate();
      return;
    }

    if (draftTitle.trim()) {
      handleSelectKind('single');
    }
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
      setIsManualKind(true);
      setDraftStep('kind');
      return;
    }

    if (draftStep === 'time') {
      setTimeMode(null);
      setDateTimeValue('');

      if (isTitleFromKindStep && selectedKind !== 'list') {
        setSelectedKind(null);
        setIsTitleFromKindStep(false);
        setIsManualKind(true);
        setDraftStep('kind');
        return;
      }

      setDraftStep(selectedKind === 'list' ? 'list-items' : 'title');
      return;
    }

    if (draftStep === 'series-target') {
      setSeriesTargetInput('');

      if (isTitleFromKindStep) {
        setSelectedKind(null);
        setIsTitleFromKindStep(false);
        setIsManualKind(true);
        setDraftStep('kind');
        return;
      }

      setDraftStep('title');
      return;
    }

    if (draftStep === 'list-items') {
      setSelectedKind(null);
      setIsTitleFromKindStep(false);
      setIsManualKind(true);
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


  const isCreating = creationState !== 'idle';

  const draftCardProps: ComponentProps<typeof DraftCard> = {
    creationCycle,
    creationState,
    palette: draftPalette,
    draftStep,
    canAdvanceDraft,
    titleInputRef,
    draftTitle,
    seriesTargetInput,
    draftListItems,
    draftListInput,
    selectedKind,
    timeMode,
    draftRecurrence,
    selectedDateLabel,
    selectedDraftDate,
    isManualCalendarOpen,
    datePresets,
    calendarView,
    calendarCells,
    currentDraftDay,
    canGoToPreviousYear,
    canGoToPreviousMonth,
    draftHourInput,
    draftMinuteInput,
    isSelectedDateTimeValid,
    onSubmit: handleCreateCard,
    onCancel: handleCancelCreating,
    onTitleChange: (value: string) => {
      setDraftTitle(value);
      setIsManualKind(false);
    },
    quickEntry,
    onQuickCreate: handleQuickCreate,
    onChooseManually: () => setIsManualKind(true),
    onKindEnter: handleKindEnter,
    onSeriesTargetChange: setSeriesTargetInput,
    onListInputChange: setDraftListInput,
    onAddListItem: handleAddDraftListItem,
    onRemoveListItem: handleRemoveDraftListItem,
    onSelectKind: handleSelectKind,
    onSelectTimeMode: handleSelectTimeMode,
    onSelectRepeat: handleSelectRepeat,
    onRecurrenceChange: setDraftRecurrence,
    onSelectDate: handleSelectDraftDate,
    onOpenManualCalendar: handleOpenManualCalendar,
    onChangeYear: handleChangeCalendarYear,
    onChangeMonth: handleChangeCalendarMonth,
    onTimeInputChange: handleDraftTimeInputChange,
    onCommitTimeInput: handleCommitDraftTimeInput,
    onAdjustHour: handleAdjustDraftHour,
    onAdjustMinute: handleAdjustDraftMinute,
    onBack: handleDraftBack,
    onNext: handleDraftNext,
  };

  return {
    creationState,
    creationCycle,
    isCreating,
    startCreating: handleStartCreating,
    draftCardProps,
  };
}
