import React, { useEffect, useRef, useState } from 'react';

import cardboardTexture from '../../assets/cardboard.svg';
import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import { formatHumanDate } from '../../app/dateTimeUtils';
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
import { getCouponSeed } from '../../app/couponEdge';
import { PAPER_GRAIN } from '../../app/paperGrain';
import { STAMP_RED_DOT_BACKGROUND } from '../../app/stampRed';
import { MeasuredPerforation } from './CouponPerforation';
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
import { PinStar } from './PinStar';
import { FOLD_CUT_PATH, FOLD_SIZE, FoldedFlap } from './FoldedCorner';
import { playSound } from '../../app/sounds';
import { CountdownPanel } from './CountdownPanel';
import { SeriesTicks } from './SeriesTicks';
import { setIsEditingCard } from '../../app/fileFold';
import { INITIAL_TASK_CARD_V2_CONFIG } from './taskCardV2Config';
import { TaskListContent } from './TaskListContent';
import { getLocale, t } from '../../app/i18n';

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
  /** Pins the card to the head of the deck, or takes the pin out. */
  onTogglePin?: () => void;
  /** Shows the first-run arrow pointing at the folded corner. */
  showCornerHint?: boolean;
  /** Fired the first time the folded corner is used. */
  onCornerOpened?: () => void;
  isStatic?: boolean;
  hideCoupon?: boolean;
  /** The card is overdue: a red dot sits in front of its kind label. */
  isOverdue?: boolean;
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
  onTogglePin,
  showCornerHint = false,
  onCornerOpened,
  isStatic = false,
  hideCoupon = false,
  isOverdue = false,
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

  // The table folds the card file away while this card is being edited.
  useEffect(() => {
    if (face !== 'edit' || isStatic) {
      return;
    }

    setIsEditingCard(true);
    return () => setIsEditingCard(false);
  }, [face, isStatic]);

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
    playSound('flap');

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
  // The countdown line says what it counts; only a repeating card keeps a
  // small caption of its own.
  const timeLabel = recurrence ? t('Следующий раз') : null;
  const series = card.kind === 'series' ? card.series : undefined;
  const lastSeriesEntry = series?.entries.at(-1);
  const list = card.kind === 'list' ? card.list : undefined;
  const listCompletedCount = list ? getListCompletedCount(list) : 0;
  const listReady = Boolean(list && list.items.length > 0 && listCompletedCount === list.items.length);

  // A list whose last item was just checked tears its coupon off by itself,
  // after a short pause in which unchecking (or adding an item) cancels it.
  // From the "all items" face the card first turns back to its front.
  const hasList = list !== undefined;
  const faceRef = useRef(face);
  const onCompleteRef = useRef(onComplete);
  const previousListReadyRef = useRef<{ cardId: string; ready: boolean } | null>(
    null,
  );

  useEffect(() => {
    faceRef.current = face;
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    const previous = previousListReadyRef.current;
    previousListReadyRef.current = { cardId: card.id, ready: listReady };

    const justCompleted =
      hasList &&
      listReady &&
      previous !== null &&
      previous.cardId === card.id &&
      !previous.ready;

    if (!justCompleted || card.completedAt || isStatic) {
      return;
    }

    const cardIdAtStart = card.id;
    let tearTimer: number | null = null;

    const tearOff = () => {
      if (currentCardIdRef.current !== cardIdAtStart) {
        return;
      }

      const bounds = articleRef.current
        ?.querySelector<HTMLButtonElement>('[data-coupon="true"]')
        ?.getBoundingClientRect();

      if (bounds) {
        onCompleteRef.current(bounds);
      }
    };

    const graceTimer = window.setTimeout(() => {
      if (faceRef.current === 'view') {
        tearOff();
        return;
      }

      setFaceState({ cardId: cardIdAtStart, face: 'view', direction: -1 });
      tearTimer = window.setTimeout(tearOff, FINISH_WIPE_WAIT_MS);
    }, LIST_AUTO_COMPLETE_DELAY_MS);

    return () => {
      window.clearTimeout(graceTimer);

      if (tearTimer !== null) {
        window.clearTimeout(tearTimer);
      }
    };
  }, [card.id, card.completedAt, isStatic, hasList, listReady]);
  const kindLabel = series
    ? t('Серия')
    : list
      ? t('Список')
      : recurrence
        ? describeRecurrence(recurrence)
        : t('Одна задача');
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

  const isTypeOverdue = isOverdue && !card.completedAt;
  // A short, soft letterpress rule: it parts the title from the facts without
  // a line across the whole card.
  const softRule = (
    <div
      aria-hidden="true"
      style={{
        width: 72,
        height: 2,
        borderRadius: 1,
        backgroundColor: 'rgba(69,57,44,0.24)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.75)',
      }}
    />
  );

  const viewFace = (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center gap-2.5 font-mono text-[11.5px] font-bold uppercase tracking-[0.16em]"
          style={{ color: palette.accentDark }}
        >
          {/* The kind's dot; red in front of the label when overdue. */}
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={
              isTypeOverdue
                ? {
                    background: STAMP_RED_DOT_BACKGROUND,
                    boxShadow: '0 1px 2px rgba(40,12,8,0.4)',
                  }
                : {
                    backgroundColor: palette.accent,
                    boxShadow: '0 1px 1.5px rgba(40,30,20,0.28)',
                  }
            }
            role={isTypeOverdue ? 'img' : undefined}
            aria-label={isTypeOverdue ? t('Просрочено') : undefined}
            aria-hidden={isTypeOverdue ? undefined : true}
          />
          {kindLabel}
        </span>
      </div>

      {!list && (
        <h2
          className="shrink-0 font-semibold leading-[1.1]"
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
          className="mt-6 flex min-h-0 flex-1 flex-col"
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
            maxItems={4}
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
          className="shrink-0"
          style={{ marginTop: config.infoGap }}
          role="group"
          aria-label={t('Выполнено {done} из {target}', {
            done: series.entries.length,
            target: series.targetCount,
          })}
        >
          {softRule}
          <p
            className="mt-5 font-mono font-semibold text-[#28231D]"
            style={{ fontSize: 40, lineHeight: 1, letterSpacing: '-0.04em' }}
          >
            {series.entries.length}
            <span className="mx-1.5" style={{ opacity: 0.4 }}>/</span>
            {series.targetCount}
          </p>
          <div className="mt-4">
            <SeriesTicks
              done={series.entries.length}
              target={series.targetCount}
              palette={palette}
            />
          </div>
          {lastSeriesEntry ? (
            <p className="mt-3 font-mono text-[12.5px] leading-snug text-[#776E63]">{t('Последняя · {toLocaleTimeString} · за {v}', { toLocaleTimeString: new Date(lastSeriesEntry.completedAt).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' }), v: formatSeriesDuration(lastSeriesEntry.durationMs) })}</p>
          ) : (
            <p className="mt-3 font-mono text-[12.5px] text-[#776E63]">{t('Начато · {toLocaleTimeString}', { toLocaleTimeString: new Date(series.startedAt).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' }) })}</p>
          )}
        </div>
      ) : targetAt ? (
        <div className="shrink-0" style={{ marginTop: config.infoGap }}>
          {softRule}
          {timeLabel && (
            <p className="mt-5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-[#8A8074]">
              {timeLabel}
            </p>
          )}
          <div className={timeLabel ? 'mt-2' : 'mt-5'}>
            <CountdownPanel
              targetAt={targetAt}
              mode={card.timeMode === 'deadline' ? 'deadline' : 'reminder'}
              completedAt={card.completedAt}
              palette={palette}
              isStatic={isStatic}
            />
          </div>
          <p className="mt-1.5 font-mono text-[13px] leading-relaxed text-[#8A8074]">
            {formatHumanDate(targetAt)}
          </p>
        </div>
      ) : (
        <div className="shrink-0" style={{ marginTop: config.infoGap }}>
          {softRule}
          <p className="mt-5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-[#8A8074]">
            {t('Без срока')}
          </p>
        </div>
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
            actionLabel={series ? t('Засчитать +1') : list && !card.completedAt && !listReady ? `${listCompletedCount} / ${list.items.length}` : recurrence && !isSheetAvailable && card.reminderAt ? describeNextSheet(card.reminderAt) : undefined}
            series={series}
            progress={list ? getListProgress(list) : undefined}
            isReady={list && !card.completedAt ? listReady : isSheetAvailable}
            completedLabel={list ? `${listCompletedCount} / ${list.items.length}` : undefined}
            height={config.couponHeight}
            paperTint={palette.paper}
            seed={getCouponSeed(card)}
          />
        </div>
      )}
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
          boxShadow: 'var(--shadow-1)',
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
        {/* The fine tooth of the paper, sharp at any density. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: PAPER_GRAIN,
            backgroundSize: '240px 240px',
            mixBlendMode: 'multiply',
            opacity: 0.55,
          }}
          aria-hidden="true"
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
                onPostpone && card.kind !== 'series' && !card.pinned
                  ? () => goToFace('postpone', 1)
                  : undefined
              }
              // Finishing a series early lives on the card's back, not on its face.
              onFinishSeries={
                series && !card.completedAt && onFinishSeries
                  ? () => goToFace('finish', 1)
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

        {/* Pulled sideways (see MainApp): the card's contents go, and the word
            for what letting go will do lights up on that side. */}
        {canOpenMenu && (
          <div className="swipe-cover" aria-hidden="true">
            <div
              className="absolute inset-0"
              style={{ backgroundColor: palette.paper }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${cardboardTexture})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                mixBlendMode: 'multiply',
                opacity: config.paperTextureOpacity,
              }}
            />
            {/* Rough edges for the stamp's ink. */}
            <svg width="0" height="0" className="absolute" aria-hidden="true">
              <filter id="swipe-ink" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.9"
                  numOctaves="2"
                  seed="4"
                  result="grain"
                />
                <feDisplacementMap in="SourceGraphic" in2="grain" scale="2.2" />
              </filter>
            </svg>

            {/* Style "stamp". */}
            <div className="swipe-stamp swipe-stamp--complete">
              <span>{t('Готово')}</span>
            </div>
            <div className="swipe-stamp swipe-stamp--delete">
              <span>{t('Убрать')}</span>
            </div>

            {/* Style "coupon". */}
            <div className="swipe-coupon swipe-coupon--complete">
              <i className="swipe-coupon__fill" />
              <MeasuredPerforation seed="swipe-complete" hole={3.2} pitch={7} radius={8} />
              <span>{t('✓ Готово')}</span>
            </div>
            <div className="swipe-coupon swipe-coupon--delete">
              <i className="swipe-coupon__fill" />
              <MeasuredPerforation seed="swipe-delete" hole={3.2} pitch={7} radius={8} />
              <span>{t('Убрать')}</span>
            </div>
          </div>
        )}
      </article>

      {/* The favourite star, left of the folded corner; pressed it becomes a
          gold pin with the star for a head. */}
      {onTogglePin && canOpenMenu && (
        <PinStar
          pinned={Boolean(card.pinned)}
          showStar={face === 'view'}
          onToggle={onTogglePin}
        />
      )}

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
                ? t('Действия с карточкой')
                : t('Вернуть карточку')
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
              showPencil
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

// Pause between the last list item being checked and the coupon tearing off.
const LIST_AUTO_COMPLETE_DELAY_MS = 1_200;
