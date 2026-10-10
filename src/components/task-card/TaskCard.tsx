import React, { useEffect, useRef, useState } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import { formatHumanDate, formatShortDate } from '../../app/dateTimeUtils';
import { getListCompletedCount, getListProgress } from '../../app/listUtils';
import { formatSeriesDuration } from '../../app/seriesUtils';
import { CardActionsFace } from './CardActionsFace';
import { CardEditFace } from './CardEditFace';
import { CardFinishFace } from './CardFinishFace';
import {
  CardFaceStage,
  type CardFace,
  type FaceDirection,
} from './CardFaceStage';
import { CompletionCoupon } from './CompletionCoupon';
import { CornerHint } from './CornerHint';
import { CardPostponeFace } from './CardPostponeFace';
import { PostponeStamps } from './PostponeStamps';
import { getCardTargetAt } from '../../app/timeOps';
import {
  describeNextSheet,
  describeRecurrence,
  isOccurrenceAvailable,
} from '../../app/recurrence';

/** A custom "put off" date starts at the card's own time if it is ahead, else tomorrow 9:00. */
const getCustomPostponeStart = (card: VisualCard): Date => {
  const target = getCardTargetAt(card);
  const targetTime = target ? new Date(target).getTime() : NaN;

  if (Number.isFinite(targetTime) && targetTime > Date.now()) {
    return new Date(targetTime);
  }

  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0);
};
import { CardListFace } from './CardListFace';
import { CountdownPanel } from './CountdownPanel';
import { INITIAL_TASK_CARD_V2_CONFIG } from './taskCardV2Config';
import { TaskListContent } from './TaskListContent';

interface TaskCardProps {
  card: VisualCard;
  onComplete: (couponBounds: DOMRect) => void;
  onRecordSeriesStep?: (couponBounds: DOMRect) => void;
  onFinishSeries?: (couponBounds: DOMRect) => void;
  onToggleListItem?: (itemId: string) => void;
  /** Adds an item to the end of the list. */
  onAddListItem?: (text: string) => void;
  /** Receives the edited card; its id never changes. */
  onSave?: (card: VisualCard) => void;
  /** Puts the card off until the given moment. */
  onPostpone?: (until: Date) => void;
  onDelete?: () => void;
  /** Shows the first-run arrow pointing at the folded corner. */
  showCornerHint?: boolean;
  /** Fired the first time the folded corner is used. */
  onCornerOpened?: () => void;
  isStatic?: boolean;
  hideCoupon?: boolean;
}

interface FaceState {
  cardId: string;
  face: CardFace;
  direction: FaceDirection;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  card,
  onComplete,
  onRecordSeriesStep,
  onFinishSeries,
  onToggleListItem,
  onAddListItem,
  onSave,
  onPostpone,
  onDelete,
  showCornerHint = false,
  onCornerOpened,
  isStatic = false,
  hideCoupon = false,
}) => {
  const palette = getCardPalette(card);
  const config = INITIAL_TASK_CARD_V2_CONFIG;
  // The same TaskCard instance is reused while the active card changes, so the
  // face is remembered together with the id of the card it belongs to.
  const [faceState, setFaceState] = useState<FaceState>({
    cardId: '',
    face: 'view',
    direction: 1,
  });
  const [isCornerKeyboardFocused, setIsCornerKeyboardFocused] =
    useState(false);
  const articleRef = useRef<HTMLElement | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const currentCardIdRef = useRef(card.id);

  useEffect(() => {
    currentCardIdRef.current = card.id;
  }, [card.id]);

  useEffect(
    () => () => {
      if (finishTimerRef.current !== null) {
        window.clearTimeout(finishTimerRef.current);
      }
    },
    [],
  );
  const canOpenMenu =
    Boolean(onSave || onDelete) && !card.completedAt && !isStatic;
  const face: CardFace =
    canOpenMenu && faceState.cardId === card.id ? faceState.face : 'view';

  const goToFace = (next: CardFace, direction: FaceDirection) =>
    setFaceState({ cardId: card.id, face: next, direction });

  useEffect(() => {
    if (face === 'view') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFaceState({ cardId: card.id, face: 'view', direction: -1 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [card.id, face]);

  const handleCornerClick = () => {
    if (face === 'view') {
      goToFace('actions', 1);
      onCornerOpened?.();
      return;
    }

    goToFace('view', -1);
  };

  const targetAt =
    card.timeMode === 'deadline'
      ? card.deadlineAt
      : card.timeMode === 'reminder'
        ? card.reminderAt
        : undefined;
  const recurrence = card.recurrence;
  // A repeating sheet can only be torn off on its day (or later, if missed).
  const isSheetAvailable = isOccurrenceAvailable(card);
  const timeLabel = recurrence
    ? 'Следующий раз'
    : card.timeMode === 'deadline'
      ? 'Срок'
      : 'Напоминание';
  const series = card.kind === 'series' ? card.series : undefined;
  const lastSeriesEntry = series?.entries.at(-1);
  const list = card.kind === 'list' ? card.list : undefined;
  const listCompletedCount = list ? getListCompletedCount(list) : 0;
  const listReady = Boolean(list && list.items.length > 0 && listCompletedCount === list.items.length);
  const kindLabel = series
    ? 'Серия'
    : list
      ? 'Список'
      : recurrence
        ? describeRecurrence(recurrence)
        : 'Одна задача';
  const seriesAction = (couponBounds: DOMRect) => {
    onRecordSeriesStep?.(couponBounds);
  };

  // Confirmed on the "finish anyway?" face: turn back to the card first, so the
  // coupon is seen in its place, then tear it off. The card id is re-checked
  // because the user may switch cards during that short wait.
  const handleConfirmFinish = () => {
    if (!series || !onFinishSeries || finishTimerRef.current !== null) {
      return;
    }

    const cardIdAtConfirm = card.id;

    goToFace('view', -1);
    finishTimerRef.current = window.setTimeout(() => {
      finishTimerRef.current = null;

      if (currentCardIdRef.current !== cardIdAtConfirm) {
        return;
      }

      const coupon = articleRef.current?.querySelector<HTMLButtonElement>(
        '[data-series-coupon="true"]',
      );
      const bounds = coupon?.getBoundingClientRect();

      if (bounds) {
        onFinishSeries(bounds);
      }
    }, FINISH_WIPE_WAIT_MS);
  };

  const viewFace = (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span
          className="rounded-full px-3 py-1.5 font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]"
          style={{
            color: palette.accentDark,
            backgroundColor: `${palette.accent}1d`,
          }}
        >
          {kindLabel}
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
            // The whole list opens on the card itself, as a face of its own.
            onOpenList={
              canOpenMenu && onAddListItem
                ? () => goToFace('list', 1)
                : undefined
            }
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
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-[#6B6258]">
            Выполнено
          </p>
          <p className="mt-1 font-mono text-[27px] font-semibold tracking-[-0.04em] text-[#28231D]">
            {series.entries.length} / {series.targetCount}
          </p>
          {lastSeriesEntry ? (
            <div className="mt-2 font-mono text-[12.5px] leading-snug text-[#776E63]">
              <p>Последняя · {new Date(lastSeriesEntry.completedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
              <p>За · {formatSeriesDuration(lastSeriesEntry.durationMs)}</p>
            </div>
          ) : (
            <p className="mt-2 font-mono text-[12.5px] text-[#776E63]">
              Начато · {new Date(series.startedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {!card.completedAt && onFinishSeries && canOpenMenu && (
            <button
              type="button"
              onClick={() => goToFace('finish', 1)}
              onTouchStart={() => undefined}
              className="pill-action mt-3"
              style={
                {
                  ['--pill-bg' as string]: `${palette.accent}1d`,
                  ['--pill-ink' as string]: palette.accentDark,
                  ['--pill-glow' as string]: palette.glow,
                } as React.CSSProperties
              }
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
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-[#6B6258]">
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
          <p className="mt-2 font-mono text-[13.5px] leading-relaxed text-[#776E63]">
            {formatHumanDate(targetAt)}
          </p>
        </div>
      ) : (
        <p
          className="shrink-0 border-t pt-4 font-mono text-[11.5px] uppercase tracking-[0.12em] text-[#776E63]"
          style={{
            marginTop: config.infoGap,
            borderColor: 'rgba(69,57,44,0.13)',
          }}
        >
          Без срока
        </p>
      )}

      {card.postponements && !card.completedAt && (
        <PostponeStamps postponements={card.postponements} />
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
            actionLabel={series ? 'Засчитать +1' : list && !card.completedAt && !listReady ? `${listCompletedCount} / ${list.items.length}` : recurrence && !isSheetAvailable && card.reminderAt ? describeNextSheet(card.reminderAt) : undefined}
            series={series}
            progress={list ? getListProgress(list) : undefined}
            isReady={list && !card.completedAt ? listReady : isSheetAvailable}
            completedLabel={list ? `${listCompletedCount} / ${list.items.length}` : undefined}
            height={config.couponHeight}
            paperTint={palette.paper}
          />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.15em] text-black/30">
        <span>Задача</span>
        <span>{formatShortDate(card.createdAt)}</span>
      </div>
    </div>
  );

  return (
    <div className="engraved absolute inset-0">
      {/* A repeating card is a tear-off pad: the next sheets peek out below. */}
      {recurrence && !card.completedAt && (
        <>
          {[2, 1].map((depth) => (
            <div
              key={depth}
              className="pointer-events-none absolute"
              style={{
                left: 6 + depth * 4,
                right: 6 + depth * 4,
                bottom: -4 * depth,
                height: 40,
                borderRadius: `0 0 ${config.borderRadius}px ${config.borderRadius}px`,
                backgroundColor: palette.paper,
                backgroundImage: `linear-gradient(180deg, rgba(60,40,20,${0.06 + depth * 0.05}), rgba(60,40,20,${0.1 + depth * 0.06})), url(${cardboardTexture})`,
                backgroundSize: '100% 100%, cover',
                backgroundBlendMode: 'normal, multiply',
                boxShadow: '0 2px 3px rgba(20,17,14,0.25)',
              }}
              aria-hidden="true"
            />
          ))}
        </>
      )}
      {/* Cast shadow lives on its own layer: the article below is clipped to
          cut the folded corner, which would otherwise clip the shadow too. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: config.borderRadius,
          boxShadow: `${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px rgba(20,17,14,${config.shadowOpacity})`,
        }}
        aria-hidden="true"
      />
      <article
        ref={articleRef}
        className="absolute inset-0 overflow-hidden border"
        style={{
          borderRadius: config.borderRadius,
          backgroundColor: palette.paper,
          borderColor: 'rgba(91,76,59,0.16)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.88), inset 0 -1px 2px rgba(79,61,42,0.08)',
          clipPath: FOLD_CUT_PATH,
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

        <CardFaceStage
          face={face}
          subjectId={card.id}
          direction={faceState.direction}
          paperTint={palette.paper}
        >
          {face === 'view' ? (
            viewFace
          ) : face === 'finish' && series ? (
            <CardFinishFace
              title={card.title}
              done={series.entries.length}
              target={series.targetCount}
              palette={palette}
              onConfirm={handleConfirmFinish}
              onCancel={() => goToFace('view', -1)}
            />
          ) : face === 'list' && list ? (
            <CardListFace
              list={list}
              palette={palette}
              onToggle={(itemId) => onToggleListItem?.(itemId)}
              onAdd={(text) => onAddListItem?.(text)}
              onBack={() => goToFace('view', -1)}
            />
          ) : face === 'postpone' ? (
            <CardPostponeFace
              title={card.title}
              palette={palette}
              initialCustom={getCustomPostponeStart(card)}
              onBack={() => goToFace('actions', -1)}
              onPostpone={(until) => {
                setFaceState({ cardId: '', face: 'view', direction: -1 });
                onPostpone?.(until);
              }}
            />
          ) : face === 'actions' ? (
            <CardActionsFace
              title={card.title}
              kindLabel={kindLabel}
              palette={palette}
              onEdit={() => goToFace('edit', 1)}
              // A series is a run of steps, not a dated task; it is not put off.
              onPostpone={
                onPostpone && card.kind !== 'series'
                  ? () => goToFace('postpone', 1)
                  : undefined
              }
              onDelete={() => {
                setFaceState({ cardId: '', face: 'view', direction: -1 });
                onDelete?.();
              }}
            />
          ) : (
            <CardEditFace
              card={card}
              palette={palette}
              paperTint={palette.paper}
              onCancel={() => goToFace('view', -1)}
              onSave={(updated) => {
                onSave?.(updated);
                goToFace('view', -1);
              }}
            />
          )}
        </CardFaceStage>
      </article>

      {showCornerHint && face === 'view' && canOpenMenu && (
        <CornerHint
          palette={palette}
          // "Seen" is the same state as having used the corner.
          onDismiss={() => onCornerOpened?.()}
        />
      )}

      {/* Folded top-right corner. The article above is cut along the crease; the
          flap lying on the face is the cut corner mirrored across it. When the
          card has actions, the whole corner is the handle for them. */}
      <div
        className="absolute right-0 top-0 z-30"
        style={{ width: FOLD_SIZE + 10, height: FOLD_SIZE + 10 }}
      >
        {canOpenMenu ? (
          <button
            type="button"
            onClick={handleCornerClick}
            aria-expanded={face !== 'view'}
            aria-label={
              face === 'view'
                ? 'Действия с карточкой'
                : 'Вернуть карточку'
            }
            // The flap is a drawn object, so the browser's rectangular focus
            // ring would look wrong around it; keyboard focus lifts the flap.
            onFocus={(event) =>
              setIsCornerKeyboardFocused(
                event.currentTarget.matches(':focus-visible'),
              )
            }
            onBlur={() => setIsCornerKeyboardFocused(false)}
            className="absolute inset-0 cursor-pointer border-0 bg-transparent p-0 outline-none"
          >
            <FoldedFlap
              lifted={face !== 'view' || isCornerKeyboardFocused}
              paperTint={palette.paper}
            />
          </button>
        ) : (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <FoldedFlap lifted={false} paperTint={palette.paper} />
          </div>
        )}
      </div>
    </div>
  );
};

// How long the wipe back to the card face takes (see CardFaceStage), plus a
// beat, before the coupon is torn off.
const FINISH_WIPE_WAIT_MS = 560;

// Size of the folded corner and the clip that removes it from the card body.
const FOLD_SIZE = 46;
const FOLD_CUT_PATH = `polygon(0 0, calc(100% - ${FOLD_SIZE}px) 0, 100% ${FOLD_SIZE}px, 100% 100%, 0 100%)`;

const FoldedFlap: React.FC<{ lifted: boolean; paperTint: string }> = ({
  lifted,
  paperTint,
}) => (
  <span
    className="absolute right-0 top-0 block"
    style={{
      width: FOLD_SIZE,
      height: FOLD_SIZE,
      filter: lifted
        ? 'drop-shadow(-2px 4px 3.5px rgba(38,27,16,0.5))'
        : 'drop-shadow(-1px 2px 2px rgba(38,27,16,0.36))',
      transition: 'filter 160ms ease-out',
    }}
  >
    <span
      className="absolute inset-0 block"
      style={{
        clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
        backgroundColor: paperTint,
        backgroundImage: `linear-gradient(to bottom left, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 50%, rgba(70,55,38,0.3) 100%), url(${cardboardTexture})`,
        backgroundSize: '100% 100%, cover',
        backgroundBlendMode: 'normal, multiply',
      }}
    />
  </span>
);
