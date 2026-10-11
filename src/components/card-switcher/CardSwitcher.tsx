import React, { useEffect, useRef, useState } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import { CardSwitcherDebugPanel } from './CardSwitcherDebugPanel';
import {
  getSwitcherMetrics,
  INITIAL_CARD_SWITCHER_CONFIG,
  type CardSwitcherConfig,
} from './cardSwitcherConfig';
import { useWheelNavigation } from '../../app/useWheelNavigation';
import { OverdueBadge } from './OverdueBadge';

interface CardSwitcherProps {
  cards: VisualCard[];
  activeCardId: string;
  /** `direction` is given when the list itself was scrolled to the card. */
  onSelectCard: (cardId: string, direction?: 1 | -1) => void;
  onNextCard: () => void;
  onPreviousCard: () => void;
  mode?: 'main' | 'archive';
  /** A phone: taller rows, three of them, scrolled by a finger. */
  isPhone?: boolean;
  /** Cards that are overdue: marked red, and counted in the corner. */
  overdueIds?: ReadonlySet<string>;
}


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
  const switcherRef = useRef<HTMLDivElement | null>(null);

  const visibleRows = Math.min(metrics.visibleRows, Math.max(1, cards.length));
  const listHeight = visibleRows * metrics.rowHeight + (visibleRows - 1) * 2;

  // The list picks by itself: the row at the top is the chosen card, so
  // scrolling the list chooses cards, and a card chosen any other way is
  // scrolled up to the top. The last few cards cannot all reach the top (the
  // list ends); they stay visible and are chosen by a tap.
  const rowStep = metrics.rowHeight + 2;
  const canScroll = cards.length > metrics.visibleRows;
  const maxScroll = Math.max(0, (cards.length - metrics.visibleRows) * rowStep);
  const isTouchingRef = useRef(false);
  const lastUserScrollAtRef = useRef(0);
  const ignoreScrollUntilRef = useRef(0);
  const hasAlignedRef = useRef(false);

  useEffect(() => {
    const list = listRef.current;
    const index = cards.findIndex((card) => card.id === activeCardId);

    if (!list || index < 0) {
      return;
    }

    // While a finger (or its momentum) is moving the list, the list leads.
    if (
      isTouchingRef.current ||
      performance.now() - lastUserScrollAtRef.current < 220
    ) {
      return;
    }

    const target = canScroll ? Math.min(index * rowStep, maxScroll) : 0;

    if (Math.abs(list.scrollTop - target) < 1) {
      return;
    }

    const isFirst = !hasAlignedRef.current;

    hasAlignedRef.current = true;
    ignoreScrollUntilRef.current = performance.now() + (isFirst ? 80 : 520);
    list.scrollTo({ top: target, behavior: isFirst ? 'auto' : 'smooth' });
  }, [activeCardId, cards, canScroll, rowStep, maxScroll]);

  // Scrolled by a finger: the card at the top becomes the active one.
  const handleListScroll = () => {
    const list = listRef.current;

    if (
      !list ||
      !canScroll ||
      performance.now() < ignoreScrollUntilRef.current
    ) {
      return;
    }

    lastUserScrollAtRef.current = performance.now();

    const index = Math.min(
      cards.length - 1,
      Math.max(0, Math.round(list.scrollTop / rowStep)),
    );
    const card = cards[index];

    if (card && card.id !== activeCardId) {
      const from = cards.findIndex((entry) => entry.id === activeCardId);
      onSelectCard(card.id, index > from ? 1 : -1);
    }
  };

  useWheelNavigation(switcherRef, {
    onNext: onNextCard,
    onPrevious: onPreviousCard,
    isEnabled: cards.length > 1,
  });

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
                scrollSnapType: canScroll ? 'y mandatory' : undefined,
              }}
              onScroll={handleListScroll}
              onTouchStart={() => {
                isTouchingRef.current = true;
                ignoreScrollUntilRef.current = 0;
              }}
              onTouchEnd={() => {
                isTouchingRef.current = false;
              }}
              onTouchCancel={() => {
                isTouchingRef.current = false;
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
                      scrollSnapAlign: 'start',
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
