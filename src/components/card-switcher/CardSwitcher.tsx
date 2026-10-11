import React, { useEffect, useRef, useState } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import { CardSwitcherDebugPanel } from './CardSwitcherDebugPanel';
import {
  getSwitcherMetrics,
  INITIAL_CARD_SWITCHER_CONFIG,
  type CardSwitcherConfig,
} from './cardSwitcherConfig';
import { OverdueBadge } from './OverdueBadge';

interface CardSwitcherProps {
  cards: VisualCard[];
  activeCardId: string;
  onSelectCard: (cardId: string) => void;
  onNextCard: () => void;
  onPreviousCard: () => void;
  mode?: 'main' | 'archive';
  /** A phone: taller rows, three of them, scrolled by a finger. */
  isPhone?: boolean;
  /** Cards that are overdue: marked red, and counted in the corner. */
  overdueIds?: ReadonlySet<string>;
}


const WHEEL_INTENT_THRESHOLD = 6;
const WHEEL_GESTURE_END_MS = 90;
const SHOW_CARD_SWITCHER_DEBUG = false;

const getCardDisplayLabel = (card: VisualCard) => {
  if (card.kind !== 'list' || !card.list?.items.length) {
    return card.title;
  }

  const [firstItem] = card.list.items;
  const remainingCount = card.list.items.length - 1;

  return remainingCount > 0
    ? `${firstItem.text} · +${remainingCount}`
    : firstItem.text;
};

export const CardSwitcher: React.FC<CardSwitcherProps> = ({
  cards,
  activeCardId,
  onSelectCard,
  onNextCard,
  onPreviousCard,
  mode = 'main',
  isPhone = false,
  overdueIds,
}) => {
  const metrics = getSwitcherMetrics(isPhone);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [config, setConfig] = useState<CardSwitcherConfig>(() => ({
    ...INITIAL_CARD_SWITCHER_CONFIG,
  }));
  const wheelAccumulatorRef = useRef(0);
  const wheelGestureActiveRef = useRef(false);
  const wheelLastEventAtRef = useRef(0);
  const switcherRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef(cards);
  const onNextCardRef = useRef(onNextCard);
  const onPreviousCardRef = useRef(onPreviousCard);

  useEffect(() => {
    cardsRef.current = cards;
    onNextCardRef.current = onNextCard;
    onPreviousCardRef.current = onPreviousCard;
  }, [cards, onNextCard, onPreviousCard]);

  const visibleRows = Math.min(metrics.visibleRows, Math.max(1, cards.length));
  const listHeight = visibleRows * metrics.rowHeight + (visibleRows - 1) * 2;

  // The active card is always brought into view, whichever way it was chosen
  // (a tap, the wheel, a swipe on the card).
  useEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(
      `[data-card-id="${CSS.escape(activeCardId)}"]`,
    );

    if (!list || !row) {
      return;
    }

    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;

    if (top < list.scrollTop) {
      list.scrollTo({ top, behavior: 'smooth' });
    } else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: bottom - list.clientHeight, behavior: 'smooth' });
    }
  }, [activeCardId, cards.length, metrics.rowHeight]);
  useEffect(() => {
    const switcher = switcherRef.current;

    if (!switcher) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const currentCards = cardsRef.current;
      if (currentCards.length <= 1) {
        return;
      }

      const normalizedDelta =
        event.deltaMode === 1
          ? event.deltaY * 16
          : event.deltaMode === 2
            ? event.deltaY * window.innerHeight
            : event.deltaY;

      if (normalizedDelta === 0) {
        return;
      }

      const now = performance.now();
      const isNewGesture =
        now - wheelLastEventAtRef.current > WHEEL_GESTURE_END_MS;

      wheelLastEventAtRef.current = now;

      if (isNewGesture) {
        wheelGestureActiveRef.current = false;
        wheelAccumulatorRef.current = 0;
      }

      if (wheelGestureActiveRef.current) {
        return;
      }

      if (
        wheelAccumulatorRef.current !== 0 &&
        Math.sign(wheelAccumulatorRef.current) !== Math.sign(normalizedDelta)
      ) {
        wheelAccumulatorRef.current = 0;
      }

      wheelAccumulatorRef.current += normalizedDelta;

      if (
        Math.abs(wheelAccumulatorRef.current) < WHEEL_INTENT_THRESHOLD
      ) {
        return;
      }

      const direction = wheelAccumulatorRef.current > 0 ? 1 : -1;

      wheelAccumulatorRef.current = 0;
      wheelGestureActiveRef.current = true;

      if (direction > 0) {
        onNextCardRef.current();
      } else {
        onPreviousCardRef.current();
      }
    };

    switcher.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      switcher.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <>
      <div
        ref={switcherRef}
        className="relative"
        style={{
          // Sized by the container (not 100vw) so it can never overflow the
          // window, whatever the page zoom or scrollbar situation.
          width: `min(${config.width}px, 100%)`,
          display: cards.length > 0 ? 'block' : 'none',
          transform:
            mode === 'archive'
              ? 'translate3d(0, 0, 0)'
              : `translate3d(${config.positionX}px, ${config.positionY}px, 0)`,
        }}
      >
        <div
          className="engraved relative w-full overflow-hidden border"
          style={{
            borderRadius: config.borderRadius,
            padding: '6px 8px',
            backgroundColor: 'rgba(247,242,232,0.84)',
            borderColor: 'rgba(103,86,65,0.2)',
            boxShadow:
              '0 10px 24px rgba(20,17,14,0.18), inset 0 1px 0 rgba(255,255,255,0.72)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url(${cardboardTexture})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              mixBlendMode: 'multiply',
              opacity: 0.08,
            }}
          />

          <div className="relative">
            {/* Scrolls under a finger (and by wheel through the cards). */}
            <div
              ref={listRef}
              className="no-scrollbar relative flex flex-col gap-0.5 overflow-y-auto"
              style={{
                height: listHeight,
                overscrollBehavior: 'contain',
                touchAction: 'pan-y',
              }}
            >
              {cards.map((card) => {
                const isActive = card.id === activeCardId;
                const palette = getCardPalette(card);
                const isOverdue = Boolean(overdueIds?.has(card.id));

                return (
                  <button
                    key={card.id}
                    type="button"
                    data-card-id={card.id}
                    onClick={() => onSelectCard(card.id)}
                    className="relative flex w-full shrink-0 items-center overflow-hidden border-0 px-2.5 text-left"
                    style={{
                      height: metrics.rowHeight,
                      borderRadius: 8,
                      backgroundColor: isActive
                        ? `${palette.accent}1f`
                        : 'transparent',
                    }}
                    aria-pressed={isActive}
                  >
                    <span
                      className="relative z-10 block min-w-0 flex-1 truncate font-mono font-semibold"
                      style={{
                        color: isActive
                          ? palette.accentDark
                          : 'rgba(40,35,29,0.68)',
                        fontSize: metrics.fontSize,
                        lineHeight: `${metrics.rowHeight}px`,
                      }}
                    >
                      {card.pinned && (
                        <span
                          className="mr-1.5"
                          style={{ color: '#C9972A' }}
                          role="img"
                          aria-label="Закреплена"
                        >
                          ★
                        </span>
                      )}
                      {/* Overdue: a red dot in front of the name. */}
                      {isOverdue && (
                        <span
                          className="mr-2 inline-block h-[9px] w-[9px] rounded-full align-middle"
                          style={{
                            background:
                              'radial-gradient(circle at 32% 28%, #E0705F 0%, #B8483A 55%, #8F3025 100%)',
                            boxShadow: '0 1px 2px rgba(40,12,8,0.4)',
                          }}
                          role="img"
                          aria-label="Просрочено"
                        />
                      )}
                      {getCardDisplayLabel(card)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Overdue: a red dot on the corner of the list, saying what it is. */}
        <OverdueBadge
          count={overdueIds?.size ?? 0}
          label="просрочено"
          className="absolute -right-2 -top-2 z-10"
        />
      </div>

      {import.meta.env.DEV && SHOW_CARD_SWITCHER_DEBUG && (
        <CardSwitcherDebugPanel config={config} onChange={setConfig} />
      )}
    </>
  );
};
