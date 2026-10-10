import React, { useEffect, useMemo, useRef, useState } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import { CardSwitcherDebugPanel } from './CardSwitcherDebugPanel';
import {
  INITIAL_CARD_SWITCHER_CONFIG,
  type CardSwitcherConfig,
} from './cardSwitcherConfig';

interface CardSwitcherProps {
  cards: VisualCard[];
  activeCardId: string;
  onSelectCard: (cardId: string) => void;
  onNextCard: () => void;
  onPreviousCard: () => void;
  mode?: 'main' | 'archive';
}

const MAX_VISIBLE_ROWS = 4;
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
}) => {
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

  const activeIndex = Math.max(
    0,
    cards.findIndex((card) => card.id === activeCardId),
  );
  const windowStart = Math.min(
    Math.max(0, activeIndex - (MAX_VISIBLE_ROWS - 1)),
    Math.max(0, cards.length - MAX_VISIBLE_ROWS),
  );
  const visibleCards = useMemo(
    () => cards.slice(windowStart, windowStart + MAX_VISIBLE_ROWS),
    [cards, windowStart],
  );

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
            <div className="flex flex-col gap-0.5">
              {visibleCards.map((card) => {
                const isActive = card.id === activeCardId;
                const palette = getCardPalette(card);

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => onSelectCard(card.id)}
                    className="relative flex w-full items-center overflow-hidden border-0 px-2.5 text-left"
                    style={{
                      height: config.rowHeight,
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
                        fontSize: config.fontSize,
                        lineHeight: `${config.rowHeight}px`,
                      }}
                    >
                      {getCardDisplayLabel(card)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {import.meta.env.DEV && SHOW_CARD_SWITCHER_DEBUG && (
        <CardSwitcherDebugPanel config={config} onChange={setConfig} />
      )}
    </>
  );
};
