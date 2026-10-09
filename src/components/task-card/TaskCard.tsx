import React from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import { formatHumanDate, formatShortDate } from '../../app/dateTimeUtils';
import { getListCompletedCount, getListProgress } from '../../app/listUtils';
import { formatSeriesDuration } from '../../app/seriesUtils';
import { CompletionCoupon } from './CompletionCoupon';
import { CountdownPanel } from './CountdownPanel';
import { INITIAL_TASK_CARD_V2_CONFIG } from './taskCardV2Config';
import { TaskListContent } from './TaskListContent';

interface TaskCardProps {
  card: VisualCard;
  onComplete: (couponBounds: DOMRect) => void;
  onRecordSeriesStep?: (couponBounds: DOMRect) => void;
  onFinishSeries?: (couponBounds: DOMRect) => void;
  onToggleListItem?: (itemId: string) => void;
  onOpenList?: () => void;
  isStatic?: boolean;
  hideCoupon?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  card,
  onComplete,
  onRecordSeriesStep,
  onFinishSeries,
  onToggleListItem,
  onOpenList,
  isStatic = false,
  hideCoupon = false,
}) => {
  const palette = getCardPalette(card);
  const config = INITIAL_TASK_CARD_V2_CONFIG;
  const targetAt =
    card.timeMode === 'deadline'
      ? card.deadlineAt
      : card.timeMode === 'reminder'
        ? card.reminderAt
        : undefined;
  const timeLabel = card.timeMode === 'deadline' ? 'Срок' : 'Напоминание';
  const series = card.kind === 'series' ? card.series : undefined;
  const lastSeriesEntry = series?.entries.at(-1);
  const list = card.kind === 'list' ? card.list : undefined;
  const listCompletedCount = list ? getListCompletedCount(list) : 0;
  const listReady = Boolean(list && list.items.length > 0 && listCompletedCount === list.items.length);
  const seriesAction = (couponBounds: DOMRect) => {
    onRecordSeriesStep?.(couponBounds);
  };

  const handleManualSeriesFinish = () => {
    if (!series || !onFinishSeries) {
      return;
    }

    if (window.confirm(`Завершить серию на ${series.entries.length} из ${series.targetCount}?`)) {
      const coupon = document.querySelector<HTMLButtonElement>('[data-series-coupon="true"]');
      const bounds = coupon?.getBoundingClientRect();
      if (bounds) {
        onFinishSeries(bounds);
      }
    }
  };

  return (
    <article
      className="absolute inset-0 flex flex-col overflow-hidden border"
      style={{
        borderRadius: config.borderRadius,
        padding: config.contentPadding,
        backgroundColor: config.paperTint,
        borderColor: 'rgba(91,76,59,0.16)',
        boxShadow: `${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px rgba(20,17,14,${config.shadowOpacity}), inset 0 1px 0 rgba(255,255,255,0.88), inset 0 -1px 2px rgba(79,61,42,0.08)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url(${cardboardTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mixBlendMode: 'multiply',
          opacity: config.paperTextureOpacity,
        }}
      />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{
              color: palette.accentDark,
              backgroundColor: `${palette.accent}1d`,
            }}
          >
            {series ? 'Серия' : list ? 'Список' : 'Одна задача'}
          </span>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
            style={{
              color: palette.accentDark,
              backgroundColor: `${palette.accent}18`,
            }}
            aria-hidden="true"
          >
            ◔
          </span>
        </div>

        {!list && (
          <h2
            className="shrink-0 font-semibold leading-[1.08]"
            style={{
              marginTop: config.titleGap,
              fontSize: config.titleSize,
              color: '#28231D',
              letterSpacing: '-0.025em',
            }}
          >
            {card.title}
          </h2>
        )}

        {list ? (
          <div
            className="mt-5 flex min-h-0 flex-1 flex-col"
            style={{
              paddingBottom:
                config.couponBottom + config.couponHeight + 4,
            }}
          >
            <TaskListContent
              list={list}
              palette={palette}
              disabled={Boolean(card.completedAt)}
              onToggle={(itemId) => onToggleListItem?.(itemId)}
              maxItems={5}
              onOpenList={onOpenList}
            />
          </div>
        ) : series ? (
          <div
            className="shrink-0 border-t pt-4"
            style={{
              marginTop: config.infoGap,
              borderColor: 'rgba(69,57,44,0.13)',
            }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6B6258]">
              Выполнено
            </p>
            <p className="mt-2 font-mono text-[25px] font-semibold tracking-[-0.04em] text-[#28231D]">
              {series.entries.length} / {series.targetCount}
            </p>
            {lastSeriesEntry ? (
              <div className="mt-3 font-mono text-[10px] leading-relaxed text-[#776E63]">
                <p>Последняя · {new Date(lastSeriesEntry.completedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
                <p>За · {formatSeriesDuration(lastSeriesEntry.durationMs)}</p>
              </div>
            ) : (
              <p className="mt-3 font-mono text-[10px] text-[#776E63]">
                Начато · {new Date(series.startedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            {!card.completedAt && onFinishSeries && (
              <button
                type="button"
                onClick={handleManualSeriesFinish}
                className="mt-3 border-0 bg-transparent p-0 font-mono text-[8px] uppercase tracking-[0.12em]"
                style={{ color: palette.accentDark }}
              >
                Завершить серию
              </button>
            )}
          </div>
        ) : targetAt ? (
          <div
            className="shrink-0 border-t pt-4"
            style={{
              marginTop: config.infoGap,
              borderColor: 'rgba(69,57,44,0.13)',
            }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6B6258]">
              {timeLabel}
            </p>
            <div className="mt-2">
              <CountdownPanel
                targetAt={targetAt}
                mode={card.timeMode === 'deadline' ? 'deadline' : 'reminder'}
                completedAt={card.completedAt}
                palette={palette}
                isStatic={isStatic}
              />
            </div>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-[#776E63]">
              {formatHumanDate(targetAt)}
            </p>
          </div>
        ) : (
          <p
            className="shrink-0 border-t pt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[#776E63]"
            style={{
              marginTop: config.infoGap,
              borderColor: 'rgba(69,57,44,0.13)',
            }}
          >
            Без срока
          </p>
        )}

        {(!hideCoupon || card.completedAt) && (
          <div
            className="absolute left-0 right-0"
            style={{
              bottom: config.couponBottom,
              height: config.couponHeight,
            }}
          >
            <CompletionCoupon
              completedAt={card.completedAt}
              palette={palette}
              onComplete={series && !card.completedAt ? seriesAction : onComplete}
              actionLabel={series ? 'Засчитать +1' : list && !card.completedAt && !listReady ? `${listCompletedCount} / ${list.items.length}` : undefined}
              series={series}
              progress={list ? getListProgress(list) : undefined}
              isReady={list && !card.completedAt ? listReady : true}
              completedLabel={list ? `${listCompletedCount} / ${list.items.length}` : undefined}
              height={config.couponHeight}
              paperTint={config.paperTint}
            />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.15em] text-black/30">
          <span>Task</span>
          <span>{formatShortDate(card.createdAt)}</span>
        </div>
      </div>
    </article>
  );
};
