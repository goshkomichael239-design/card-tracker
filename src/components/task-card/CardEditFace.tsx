import React, { useRef, useState } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import {
  canShiftDateTime,
  cleanListItems,
  createItemId,
  getEditableTargetAt,
  getListTitle,
  shiftDateTime,
  type DateTimePart,
} from '../../app/cardEdit';
import type {
  CardPalette,
  TaskListItem,
  VisualCard,
} from '../../app/cardTheme';
import { MONTH_NAMES_RU, padNumber } from '../../app/dateTimeUtils';
import { INITIAL_TASK_CARD_V2_CONFIG } from './taskCardV2Config';
import { CouponButton } from './CouponButton';

interface CardEditFaceProps {
  card: VisualCard;
  palette: CardPalette;
  paperTint: string;
  onSave: (card: VisualCard) => void;
  onCancel: () => void;
}

const FIELD_LABEL_CLASS =
  'font-mono text-[9px] font-bold uppercase tracking-[0.12em]';

const TRAY_STYLE: React.CSSProperties = {
  borderColor: 'rgba(82,69,56,0.2)',
  backgroundColor: 'rgba(235,229,214,0.72)',
  backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.35), transparent 58%), url(${cardboardTexture})`,
  backgroundSize: '100% 100%, cover',
  backgroundBlendMode: 'soft-light, multiply',
  boxShadow: 'inset 0 1px rgba(255,255,255,0.65), 0 3px 7px rgba(67,56,43,0.12)',
};

const ARROW_BUTTON_CLASS =
  'h-full cursor-pointer border-0 bg-transparent font-mono text-xl transition-opacity disabled:cursor-default';

interface StepperRowProps {
  label: string;
  value: string;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
  isLast?: boolean;
}

const StepperRow: React.FC<StepperRowProps> = ({
  label,
  value,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
  isLast = false,
}) => (
  <div
    className={`grid h-[36px] grid-cols-[44px_1fr_44px] items-center ${isLast ? '' : 'border-b'}`}
    style={{ borderColor: 'rgba(82,69,56,0.14)' }}
  >
    <button
      type="button"
      onClick={onPrevious}
      disabled={!canPrevious}
      aria-label={`${label}: меньше`}
      className={ARROW_BUTTON_CLASS}
      style={{ color: canPrevious ? 'rgba(63,57,50,0.78)' : 'rgba(63,57,50,0.2)' }}
    >
      ‹
    </button>
    <div className="flex items-baseline justify-center gap-3 font-mono">
      <span
        className="text-[9px] uppercase tracking-[0.14em]"
        style={{ color: 'rgba(61,55,48,0.55)' }}
      >
        {label}
      </span>
      <span
        className="text-[14px] font-bold uppercase tracking-[0.06em]"
        style={{ color: '#3F3932' }}
      >
        {value}
      </span>
    </div>
    <button
      type="button"
      onClick={onNext}
      disabled={!canNext}
      aria-label={`${label}: больше`}
      className={ARROW_BUTTON_CLASS}
      style={{ color: canNext ? 'rgba(63,57,50,0.78)' : 'rgba(63,57,50,0.2)' }}
    >
      ›
    </button>
  </div>
);

interface TitleFieldProps {
  value: string;
  palette: CardPalette;
  onChange: (value: string) => void;
}

const TitleField: React.FC<TitleFieldProps> = ({
  value,
  palette,
  onChange,
}) => (
  <div className="shrink-0">
    <p className={FIELD_LABEL_CLASS} style={{ color: palette.accentDark }}>
      Название
    </p>
    <textarea
      value={value}
      rows={1}
      maxLength={120}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      aria-label="Название карточки"
      className="mt-1 block w-full resize-none border-0 bg-transparent p-0 font-semibold leading-[1.12] outline-none"
      style={
        {
          fontSize: 26,
          color: '#28231D',
          letterSpacing: '-0.02em',
          fieldSizing: 'content',
          maxHeight: 26 * 1.12 * 2,
          borderBottom: '1px dashed rgba(69,57,44,0.42)',
          fontFamily: 'inherit',
        } as React.CSSProperties
      }
    />
  </div>
);

const DATE_ROWS: Array<{ part: DateTimePart; label: string }> = [
  { part: 'day', label: 'День' },
  { part: 'month', label: 'Месяц' },
  { part: 'hour', label: 'Часы' },
  { part: 'minute', label: 'Минуты' },
];

const formatPart = (value: Date, part: DateTimePart): string => {
  switch (part) {
    case 'day':
      return padNumber(value.getDate());
    case 'month':
      return MONTH_NAMES_RU[value.getMonth()]!;
    case 'hour':
      return padNumber(value.getHours());
    case 'minute':
      return padNumber(value.getMinutes());
  }
};

interface DateTimeEditorProps {
  value: Date;
  label: string;
  palette: CardPalette;
  onChange: (value: Date) => void;
}

const DateTimeEditor: React.FC<DateTimeEditorProps> = ({
  value,
  label,
  palette,
  onChange,
}) => (
  <div className="mt-4 shrink-0">
    <p className={FIELD_LABEL_CLASS} style={{ color: palette.accentDark }}>
      {label}
    </p>
    <div
      className="mt-1.5 overflow-hidden rounded-[12px] border"
      style={TRAY_STYLE}
    >
      {DATE_ROWS.map((row, index) => (
        <StepperRow
          key={row.part}
          label={row.label}
          value={formatPart(value, row.part)}
          canPrevious={canShiftDateTime(value, row.part, -1)}
          canNext={canShiftDateTime(value, row.part, 1)}
          onPrevious={() => onChange(shiftDateTime(value, row.part, -1))}
          onNext={() => onChange(shiftDateTime(value, row.part, 1))}
          isLast={index === DATE_ROWS.length - 1}
        />
      ))}
    </div>
  </div>
);

interface ListEditorProps {
  items: TaskListItem[];
  palette: CardPalette;
  onChange: (items: TaskListItem[]) => void;
}

const ListEditor: React.FC<ListEditorProps> = ({
  items,
  palette,
  onChange,
}) => {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const addItem = () => {
    const text = draft.trim();

    if (!text) {
      return;
    }

    onChange([...items, { id: createItemId(), text }]);
    setDraft('');
    window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className={FIELD_LABEL_CLASS} style={{ color: palette.accentDark }}>
        Пункты списка
      </p>
      <div
        ref={scrollRef}
        className="mt-1.5 min-h-0 flex-1 overflow-y-auto rounded-[12px] border"
        style={{ ...TRAY_STYLE, overscrollBehavior: 'contain' }}
      >
        {items.length === 0 && (
          <p className="px-4 py-3 text-[14px]" style={{ color: 'rgba(40,35,29,0.45)' }}>
            Добавьте хотя бы один пункт
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 border-b pl-4 pr-1"
            style={{ borderColor: 'rgba(82,69,56,0.14)' }}
          >
            <input
              value={item.text}
              maxLength={120}
              onChange={(event) =>
                onChange(
                  items.map((current) =>
                    current.id === item.id
                      ? { ...current, text: event.target.value }
                      : current,
                  ),
                )
              }
              aria-label="Текст пункта"
              className="h-[40px] min-w-0 flex-1 border-0 bg-transparent p-0 text-[16px] outline-none"
              style={{
                color: item.completedAt ? 'rgba(40,35,29,0.5)' : '#28231D',
                textDecoration: item.completedAt ? 'line-through' : 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              type="button"
              onClick={() =>
                onChange(items.filter((current) => current.id !== item.id))
              }
              aria-label="Убрать пункт"
              className="h-[40px] w-[40px] shrink-0 cursor-pointer border-0 bg-transparent font-mono text-[15px]"
              style={{ color: 'rgba(40,35,29,0.5)' }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex shrink-0 items-center gap-2">
        <input
          value={draft}
          maxLength={120}
          placeholder="Новый пункт"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addItem();
            }
          }}
          aria-label="Новый пункт"
          className="h-[38px] min-w-0 flex-1 border-0 bg-transparent p-0 text-[16px] outline-none"
          style={{
            borderBottom: '1px dashed rgba(69,57,44,0.42)',
            color: '#28231D',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!draft.trim()}
          className="h-[38px] shrink-0 cursor-pointer border-0 bg-transparent px-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] disabled:cursor-default disabled:opacity-40"
          style={{ color: palette.accentDark }}
        >
          Добавить
        </button>
      </div>
    </div>
  );
};

interface TargetCountEditorProps {
  value: number;
  minimum: number;
  completed: number;
  palette: CardPalette;
  onChange: (value: number) => void;
}

const TargetCountEditor: React.FC<TargetCountEditorProps> = ({
  value,
  minimum,
  completed,
  palette,
  onChange,
}) => (
  <div className="mt-4 shrink-0">
    <p className={FIELD_LABEL_CLASS} style={{ color: palette.accentDark }}>
      Цель серии
    </p>
    <div
      className="mt-1.5 overflow-hidden rounded-[12px] border"
      style={TRAY_STYLE}
    >
      <StepperRow
        label="Раз"
        value={String(value)}
        canPrevious={value > minimum}
        canNext={value < 999}
        onPrevious={() => onChange(Math.max(minimum, value - 1))}
        onNext={() => onChange(Math.min(999, value + 1))}
        isLast
      />
    </div>
    {completed > 0 && (
      <p
        className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em]"
        style={{ color: 'rgba(0,0,0,0.38)' }}
      >
        Уже засчитано · {completed}
      </p>
    )}
  </div>
);

/**
 * Edit face. What can be changed depends on what the card is: a single task
 * keeps its title and its deadline/reminder, a series its title and target,
 * a list its items.
 */
export const CardEditFace: React.FC<CardEditFaceProps> = ({
  card,
  palette,
  paperTint,
  onSave,
  onCancel,
}) => {
  const config = INITIAL_TASK_CARD_V2_CONFIG;
  const isList = card.kind === 'list';
  const isSeries = card.kind === 'series';
  const initialTargetAt = getEditableTargetAt(card);

  const [title, setTitle] = useState(card.title);
  const [targetAt, setTargetAt] = useState<Date | null>(() =>
    initialTargetAt ? new Date(initialTargetAt) : null,
  );
  const [targetCount, setTargetCount] = useState(
    card.series?.targetCount ?? 1,
  );
  const [items, setItems] = useState<TaskListItem[]>(
    () => card.list?.items.map((item) => ({ ...item })) ?? [],
  );

  const completedCount = card.series?.entries.length ?? 0;
  const minimumTarget = Math.max(1, completedCount + 1);
  const hasValidTarget = targetAt === null || Number.isFinite(targetAt.getTime());
  const cleanedItems = cleanListItems(items);
  const canSave = isList
    ? cleanedItems.length >= 1
    : title.trim().length > 0 && hasValidTarget;

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    if (isList) {
      onSave({
        ...card,
        title: getListTitle(cleanedItems),
        list: { items: cleanedItems },
      });
      return;
    }

    if (isSeries && card.series) {
      onSave({
        ...card,
        title: title.trim(),
        series: {
          ...card.series,
          targetCount: Math.max(minimumTarget, targetCount),
        },
      });
      return;
    }

    onSave({
      ...card,
      title: title.trim(),
      deadlineAt:
        card.timeMode === 'deadline' && targetAt
          ? targetAt.toISOString()
          : card.deadlineAt,
      reminderAt:
        card.timeMode === 'reminder' && targetAt
          ? targetAt.toISOString()
          : card.reminderAt,
    });
  };

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span
          className="rounded-full px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
          style={{
            color: palette.accentDark,
            backgroundColor: `${palette.accent}1d`,
          }}
        >
          Правка
        </span>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{
          marginTop: 20,
          paddingBottom: config.couponBottom + config.couponHeight + 14,
        }}
      >
        {isList ? (
          <ListEditor items={items} palette={palette} onChange={setItems} />
        ) : (
          <>
            <TitleField value={title} palette={palette} onChange={setTitle} />
            {isSeries ? (
              <TargetCountEditor
                value={targetCount}
                minimum={minimumTarget}
                completed={completedCount}
                palette={palette}
                onChange={setTargetCount}
              />
            ) : (
              targetAt && (
                <DateTimeEditor
                  value={targetAt}
                  label={card.timeMode === 'deadline' ? 'Срок' : 'Напоминание'}
                  palette={palette}
                  onChange={setTargetAt}
                />
              )
            )}
          </>
        )}
      </div>

      <div
        className="absolute left-0 right-0 grid grid-cols-[1fr_2fr] gap-2.5"
        style={{ bottom: config.couponBottom, height: config.couponHeight }}
      >
        <CouponButton
          label="Отмена"
          color="rgba(40,35,29,0.7)"
          paperTint={paperTint}
          height={config.couponHeight}
          onClick={onCancel}
        />
        <CouponButton
          label="Сохранить"
          color={palette.accent}
          paperTint={paperTint}
          height={config.couponHeight}
          disabled={!canSave}
          onClick={handleSave}
        />
      </div>
    </div>
  );
};
