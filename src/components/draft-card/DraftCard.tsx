import type { FormEvent, RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import cardboardTexture from '../../assets/cardboard.avif';
import {
  CARD_SHADOW,
  DRAFT_SHADOW,
  GHOST_SETTINGS,
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

export function DraftCard(props: DraftCardProps) {
  const disabled = props.creationState === 'committing';
  const config = INITIAL_TASK_CARD_V2_CONFIG;

  return (
    <motion.form
      key={`draft-${props.creationCycle}`}
      onSubmit={props.onSubmit}
      initial={{
        x: GHOST_SETTINGS.x,
        y: GHOST_SETTINGS.y,
        rotate: GHOST_SETTINGS.rotate,
        scale: GHOST_SETTINGS.scale,
        opacity: GHOST_SETTINGS.opacity,
        filter: 'saturate(0.45) brightness(0.96)',
      }}
      animate={
        props.creationState === 'committing'
          ? {
              x: 0,
              y: 4,
              rotate: 0,
              scale: 0.988,
              opacity: 1,
              filter: 'saturate(1) brightness(1)',
            }
          : {
              x: 0,
              y: 0,
              rotate: 0,
              scale: 1,
              opacity: 1,
              filter: 'saturate(1) brightness(1)',
            }
      }
      exit={{ opacity: 0, scale: 0.985 }}
      transition={PHYSICAL_SPRING}
      className="absolute inset-0"
      style={{ zIndex: 40, transformOrigin: 'center center' }}
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
        transition={{ duration: 0.3 }}
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
            exit={{ opacity: 0, y: -3, transition: { duration: 0.1, ease: 'easeOut' } }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute inset-0 flex flex-col"
          >
            {props.draftStep === 'title' && (
              <DraftTitleStep titleInputRef={props.titleInputRef} value={props.draftTitle} disabled={disabled} palette={props.palette} onChange={props.onTitleChange} />
            )}
            {props.draftStep === 'kind' && (
              <DraftKindStep selectedKind={props.selectedKind} palette={props.palette} onSelectKind={props.onSelectKind} />
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
                  ? 'Создать'
                  : undefined
              }
              onBack={props.onBack}
              onNext={props.onNext}
            />
          </motion.div>
        </AnimatePresence>
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
          aria-label="Отменить создание"
          title="Отменить создание"
          className="absolute inset-0 cursor-pointer border-0 bg-transparent p-0 outline-none disabled:cursor-default disabled:opacity-40"
        >
          <FoldedFlap lifted={false} paperTint={props.palette.paper} />
        </button>
      </div>
    </motion.form>
  );
}
