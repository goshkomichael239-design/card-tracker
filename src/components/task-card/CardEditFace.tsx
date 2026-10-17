import React, { useRef, useState } from 'react';

import cardboardTexture from '../../assets/cardboard.svg';
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
import {
  formatHumanDate,
  MONTH_NAMES_RU,
  padNumber,
} from '../../app/dateTimeUtils';
import { INITIAL_TASK_CARD_V2_CONFIG } from './taskCardV2Config';
import { CouponButton } from './CouponButton';
import { EmbossedArrow } from '../shared/EmbossedArrow';
import { t } from '../../app/i18n';

interface CardEditFaceProps {
  card: VisualCard;
  palette: CardPalette;
  paperTint: string;
  onSave: (card: VisualCard) => void;
  onCancel: () => void;
}

const FIELD_LABEL_CLASS =
  'font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]';

/** Start offset (ms) of the left-to-right "drawing" of a block on this face. */
const drawDelay = (ms: number): React.CSSProperties =>
  ({ ['--draw-delay' as string]: `${ms}ms` }) as React.CSSProperties;

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
      aria-label={t('{label}: меньше', { label })}
      className={ARROW_BUTTON_CLASS}
      style={{ color: canPrevious ? 'rgba(63,57,50,0.78)' : 'rgba(63,57,50,0.2)' }}
    >
      <EmbossedArrow direction="left" size={15} />
    </button>
    <div className="flex items-baseline justify-center gap-3 font-mono">
      <span
        className="text-[11.5px] uppercase tracking-[0.14em]"
        style={{ color: 'rgba(61,55,48,0.55)' }}
      >
        {label}
      </span>
      <span
        className="text-[16px] font-bold uppercase tracking-[0.06em]"
        style={{ color: '#3F3932' }}
      >
        {value}
      </span>
    </div>
    <button
      type="button"
      onClick={onNext}
      disabled={!canNext}
      aria-label={t('{label}: больше', { label })}
      className={ARROW_BUTTON_CLASS}
      style={{ color: canNext ? 'rgba(63,57,50,0.78)' : 'rgba(63,57,50,0.2)' }}
    >
      <EmbossedArrow direction="right" size={15} />
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
  <div className="draw-in shrink-0" style={drawDelay(150)}>
    <p className={FIELD_LABEL_CLASS} style={{ color: palette.accentDark }}>{t('Название')}</p>
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
      aria-label={t('Название карточки')}
      className="mt-1 block w-full resize-none border-0 bg-transparent p-0 font-semibold leading-[1.12] outline-none"
      style={
        {
          fontSize: 28,
          color: '#28231D',
          letterSpacing: '-0.02em',
          fieldSizing: 'content',
          maxHeight: 28 * 1.12 * 2,
          borderBottom: '1px dashed rgba(69,57,44,0.42)',
          fontFamily: 'inherit',
        } as React.CSSProperties
      }
    />
  </div>
);

const DATE_ROWS: Array<{ part: DateTimePart; label: string }> = [
  { part: 'day', label: t('День') },
  { part: 'month', label: t('Месяц') },
  { part: 'hour', label: t('Часы') },
  { part: 'minute', label: t('Минуты') },
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

export const DateTimeEditor: React.FC<DateTimeEditorProps> = ({
  value,
  label,
  palette,
  onChange,
}) => (
  <div className="draw-in mt-4 shrink-0" style={drawDelay(250)}>
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
    <div
      className="draw-in flex min-h-0 flex-1 flex-col"
      style={drawDelay(150)}
    >
      <p className={FIELD_LABEL_CLASS} style={{ color: palette.accentDark }}>{t('Пункты списка')}</p>
      <div
        ref={scrollRef}
        className="mt-1.5 min-h-0 flex-1 overflow-y-auto rounded-[12px] border"
        style={{ ...TRAY_STYLE, overscrollBehavior: 'contain' }}
      >
        {items.length === 0 && (
          <p className="px-4 py-3 text-[16px]" style={{ color: 'rgba(40,35,29,0.45)' }}>{t('Добавьте хотя бы один пункт')}</p>
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
              aria-label={t('Текст пункта')}
              className="h-[40px] min-w-0 flex-1 border-0 bg-transparent p-0 text-[18px] outline-none"
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
              aria-label={t('Убрать пункт')}
              className="h-[40px] w-[40px] shrink-0 cursor-pointer border-0 bg-transparent font-mono text-[17px]"
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
          placeholder={t('Новый пункт')}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addItem();
            }
          }}
          aria-label={t('Новый пункт')}
          className="h-[38px] min-w-0 flex-1 border-0 bg-transparent p-0 text-[18px] outline-none"
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
          className="h-[38px] shrink-0 cursor-pointer border-0 bg-transparent px-1 font-mono text-[12.5px] font-bold uppercase tracking-[0.12em] disabled:cursor-default disabled:opacity-40"
          style={{ color: palette.accentDark }}
        >{t('Добавить')}</button>
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
  <div className="draw-in mt-4 shrink-0" style={drawDelay(250)}>
    <p className={FIELD_LABEL_CLASS} style={{ color: palette.accentDark }}>{t('Цель серии')}</p>
    <div
      className="mt-1.5 overflow-hidden rounded-[12px] border"
      style={TRAY_STYLE}
    >
      <StepperRow
        label={t('Раз')}
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
        className="mt-2 font-mono text-[11.5px] uppercase tracking-[0.12em]"
        style={{ color: 'rgba(0,0,0,0.38)' }}
      >{t('Уже засчитано · {completed}', { completed })}</p>
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
          className="rounded-full px-3 py-1.5 font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]"
          style={{
            color: palette.accentDark,
            backgroundColor: `${palette.accent}1d`,
          }}
        >{t('Правка')}</span>
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
                  label={card.timeMode === 'deadline' ? t('Срок') : t('Напоминание')}
                  palette={palette}
                  onChange={setTargetAt}
                />
              )
            )}
          </>
        )}

        {/* When the card was made (it no longer sits on the card's face). */}
        <p
          className="mt-auto pt-3 text-[11px] uppercase tracking-[0.12em]"
          style={{ color: 'rgba(40,35,29,0.4)' }}
        >{t('Создана · {v}', { v: formatHumanDate(card.createdAt) })}</p>
      </div>

      <div
        className="draw-in absolute left-0 right-0 grid grid-cols-[1fr_2fr] gap-2.5"
        style={{
          ...drawDelay(340),
          bottom: config.couponBottom,
          height: config.couponHeight,
        }}
      >
        <CouponButton
          label={t('Отмена')}
          color="rgba(40,35,29,0.7)"
          paperTint={paperTint}
          height={config.couponHeight}
          onClick={onCancel}
        />
        <CouponButton
          label={t('Сохранить')}
          color={palette.accentDark}
          paperTint={paperTint}
          height={config.couponHeight}
          disabled={!canSave}
          onClick={handleSave}
        />
      </div>
    </div>
  );
};
