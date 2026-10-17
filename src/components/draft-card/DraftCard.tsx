import type { FormEvent, RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import cardboardTexture from '../../assets/cardboard.svg';
import {
  CARD_SHADOW,
  DRAFT_SHADOW,
  GHOST_SHADOW,
  PHYSICAL_SPRING,
  type CardKind,
  type CardPalette,
  type CreationState,
  type DraftStep,
  type TimeMode,
} from '../../app/cardTheme';
import { INITIAL_TASK_CARD_V2_CONFIG } from '../task-card/taskCardV2Config';
import {
  FOLD_CUT_PATH,
  FOLD_SIZE,
  FoldedFlap,
} from '../task-card/FoldedCorner';
import { DraftCardHeader } from './DraftCardHeader';
import { DraftClockStep } from './DraftClockStep';
import { DraftDateStep } from './DraftDateStep';
import { DraftKindStep } from './DraftKindStep';
import { DraftNavigation } from './DraftNavigation';
import { DraftSeriesTargetStep } from './DraftSeriesTargetStep';
import { DraftListItemsStep } from './DraftListItemsStep';
import type { TaskListItem } from '../../app/cardTheme';
import { DraftTimeModeStep } from './DraftTimeModeStep';
import { DraftTitleStep } from './DraftTitleStep';
import { DraftRepeatStep } from './DraftRepeatStep';
import type { RecurrenceRule } from '../../app/cardTheme';
import type { QuickEntry } from '../../app/parseQuickEntry';
import { t } from '../../app/i18n';

export interface DraftCardProps {
  creationCycle: number;
  creationState: CreationState;
  palette: CardPalette;
  draftStep: DraftStep;
  canAdvanceDraft: boolean;
  titleInputRef: RefObject<HTMLTextAreaElement | null>;
  draftTitle: string;
  seriesTargetInput: string;
  draftListItems: TaskListItem[];
  draftListInput: string;
  selectedKind: CardKind | null;
  timeMode: TimeMode | null;
  draftRecurrence: RecurrenceRule | null;
  selectedDateLabel: string;
  selectedDraftDate: Date;
  isManualCalendarOpen: boolean;
  datePresets: Array<{ label: string; date: Date }>;
  calendarView: Date;
  calendarCells: Array<number | null>;
  currentDraftDay: Date;
  canGoToPreviousYear: boolean;
  canGoToPreviousMonth: boolean;
  draftHourInput: string;
  draftMinuteInput: string;
  isSelectedDateTimeValid: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onTitleChange: (value: string) => void;
  quickEntry: QuickEntry | null;
  onQuickCreate: () => void;
  onChooseManually: () => void;
  onKindEnter: () => void;
  onSeriesTargetChange: (value: string) => void;
  onListInputChange: (value: string) => void;
  onAddListItem: () => void;
  onRemoveListItem: (id: string) => void;
  onSelectKind: (kind: CardKind) => void;
  onSelectTimeMode: (mode: TimeMode) => void;
  onSelectRepeat: () => void;
  onRecurrenceChange: (rule: RecurrenceRule) => void;
  onSelectDate: (date: Date) => void;
  onOpenManualCalendar: () => void;
  onChangeYear: (direction: -1 | 1) => void;
  onChangeMonth: (direction: -1 | 1) => void;
  onTimeInputChange: (part: 'hour' | 'minute', value: string) => void;
  onCommitTimeInput: (part: 'hour' | 'minute') => void;
  onAdjustHour: (direction: -1 | 1) => void;
  onAdjustMinute: (direction: -5 | 5) => void;
  onBack: () => void;
  onNext: () => void;
}

/**
 * A clean sheet lies under the working stack (its tab is what peeks out). Pulled
 * out, it slides from under the cards up and to the left, clear of them, and
 * then lays itself on top of the stack, straight. Until it is on top it is
 * below the cards (z-index 10, the stack is 14 and up).
 */
const SHEET_START = { x: 0, y: -16, rotate: -2, scale: 1, opacity: 1, zIndex: 10 };
const SHEET_SLIDE_OUT = {
  x: [0, -38, 0],
  y: [-16, -54, 0],
  rotate: [-2, -7, 0],
  scale: 1,
  opacity: 1,
  zIndex: [10, 10, 40, 40],
};
const SHEET_COMMIT = {
  x: 0,
  y: 4,
  rotate: 0,
  scale: 0.988,
  opacity: 1,
  zIndex: 40,
};
const SHEET_SLIDE_TRANSITION = {
  duration: 0.82,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  x: { times: [0, 0.52, 1] },
  y: { times: [0, 0.52, 1] },
  rotate: { times: [0, 0.52, 1] },
  zIndex: { times: [0, 0.52, 0.54, 1], ease: 'linear' as const },
};

export function DraftCard(props: DraftCardProps) {
  const disabled = props.creationState === 'committing';
  const config = INITIAL_TASK_CARD_V2_CONFIG;

  return (
    <motion.form
      key={`draft-${props.creationCycle}`}
      onSubmit={props.onSubmit}
      initial={SHEET_START}
      animate={props.creationState === 'committing' ? SHEET_COMMIT : SHEET_SLIDE_OUT}
      exit={{ opacity: 0, scale: 0.985 }}
      transition={
        props.creationState === 'committing'
          ? PHYSICAL_SPRING
          : SHEET_SLIDE_TRANSITION
      }
      className="absolute inset-0"
      style={{ transformOrigin: 'center center' }}
    >
      {/* The cast shadow has its own layer: the paper above is cut along the
          crease of the folded corner, which would clip it. */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ boxShadow: GHOST_SHADOW }}
        animate={{
          boxShadow:
            props.creationState === 'committing' ? CARD_SHADOW : DRAFT_SHADOW,
        }}
        transition={PHYSICAL_SPRING}
        style={{ borderRadius: `${config.borderRadius}px` }}
        aria-hidden="true"
      />

      {/* The paper itself, laid out like a finished card (same padding, the
          same cut corner), already in the colour the card will have. */}
      <motion.div
        className="engraved absolute inset-0 flex flex-col overflow-hidden"
        initial={{ backgroundColor: config.paperTint }}
        animate={{ backgroundColor: props.palette.paper }}
        transition={{ duration: 0.42 }}
        style={{
        borderRadius: `${config.borderRadius}px`,
        padding: `${config.contentPadding}px`,
        clipPath: FOLD_CUT_PATH,
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
        border: '1px solid rgba(91,76,59,0.16)',
      }}
    >
      <div className="draft-content-in flex min-h-0 flex-1 flex-col">
      <DraftCardHeader
        palette={props.palette}
        selectedKind={props.selectedKind}
      />

      <div className="relative mt-5 min-h-0 flex-1 overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={props.draftStep}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3, transition: { duration: 0.15, ease: 'easeOut' } }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="absolute inset-0 flex flex-col"
          >
            {props.draftStep === 'title' && (
              <DraftTitleStep titleInputRef={props.titleInputRef} value={props.draftTitle} disabled={disabled} palette={props.palette} onChange={props.onTitleChange} />
            )}
            {props.draftStep === 'kind' && (
              <DraftKindStep
                selectedKind={props.selectedKind}
                palette={props.palette}
                titleInputRef={props.titleInputRef}
                value={props.draftTitle}
                disabled={disabled}
                quickEntry={props.quickEntry}
                onChange={props.onTitleChange}
                onSelectKind={props.onSelectKind}
                onQuickCreate={props.onQuickCreate}
                onChooseManually={props.onChooseManually}
                onEnter={props.onKindEnter}
              />
            )}
            {props.draftStep === 'series-target' && (
              <DraftSeriesTargetStep
                value={props.seriesTargetInput}
                disabled={disabled}
                palette={props.palette}
                onChange={props.onSeriesTargetChange}
              />
            )}
            {props.draftStep === 'list-items' && (
              <DraftListItemsStep
                items={props.draftListItems}
                input={props.draftListInput}
                disabled={disabled}
                palette={props.palette}
                onInputChange={props.onListInputChange}
                onAdd={props.onAddListItem}
                onRemove={props.onRemoveListItem}
              />
            )}
            {props.draftStep === 'time' && (
              <DraftTimeModeStep
                timeMode={props.timeMode}
                isRepeating={props.draftRecurrence !== null}
                palette={props.palette}
                onSelectTimeMode={props.onSelectTimeMode}
                onSelectRepeat={props.onSelectRepeat}
              />
            )}
            {props.draftStep === 'date' && (
              <DraftDateStep
                palette={props.palette}
                selectedDateLabel={props.selectedDateLabel}
                selectedDraftDate={props.selectedDraftDate}
                isManualCalendarOpen={props.isManualCalendarOpen}
                datePresets={props.datePresets}
                calendarView={props.calendarView}
                calendarCells={props.calendarCells}
                currentDraftDay={props.currentDraftDay}
                canGoToPreviousYear={props.canGoToPreviousYear}
                canGoToPreviousMonth={props.canGoToPreviousMonth}
                onSelectDate={props.onSelectDate}
                onOpenManualCalendar={props.onOpenManualCalendar}
                onChangeYear={props.onChangeYear}
                onChangeMonth={props.onChangeMonth}
              />
            )}
            {props.draftStep === 'repeat' && props.draftRecurrence && (
              <DraftRepeatStep
                rule={props.draftRecurrence}
                palette={props.palette}
                onChange={props.onRecurrenceChange}
              />
            )}
            {props.draftStep === 'clock' && (
              <DraftClockStep
                palette={props.palette}
                draftHourInput={props.draftHourInput}
                draftMinuteInput={props.draftMinuteInput}
                isSelectedDateTimeValid={props.isSelectedDateTimeValid}
                onTimeInputChange={props.onTimeInputChange}
                onCommitTimeInput={props.onCommitTimeInput}
                onAdjustHour={props.onAdjustHour}
                onAdjustMinute={props.onAdjustMinute}
              />
            )}
            <DraftNavigation
              draftStep={props.draftStep}
              canAdvanceDraft={props.canAdvanceDraft}
              disabled={disabled}
              nextLabel={
                props.draftStep === 'list-items' &&
                props.selectedKind === 'list'
                  ? t('Создать')
                  : undefined
              }
              onBack={props.onBack}
              onNext={props.onNext}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      </div>
      </motion.div>

      {/* The folded corner is the way out, as on every card. */}
      <div
        className="absolute right-0 top-0 z-30"
        style={{ width: FOLD_SIZE + 10, height: FOLD_SIZE + 10 }}
      >
        <button
          type="button"
          onClick={props.onCancel}
          disabled={disabled}
          aria-label={t('Отменить создание')}
          title={t('Отменить создание')}
          className="absolute inset-0 cursor-pointer border-0 bg-transparent p-0 outline-none disabled:cursor-default disabled:opacity-40"
        >
          <FoldedFlap lifted={false} paperTint={props.palette.paper} />
        </button>
      </div>
    </motion.form>
  );
}
