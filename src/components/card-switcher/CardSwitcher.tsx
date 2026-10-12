import React, { useEffect, useRef } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import type { Deck } from '../../app/decks';
import {
  CARD_FILE_DIVIDER_HEIGHT,
  CARD_FILE_MAX_WIDTH,
  CARD_FILE_TAB_ROW_HEIGHT,
  getEdgesHeight,
  getSwitcherMetrics,
} from './cardSwitcherConfig';
import { CardFileTabs } from './CardFileTabs';
import { useWheelNavigation } from '../../app/useWheelNavigation';
import { haptic } from '../../app/haptics';
import { OverdueBadge } from './OverdueBadge';

interface CardSwitcherProps {
  cards: VisualCard[];
  activeCardId: string;
  /** `direction` is given when the list itself was scrolled to the card. */
  onSelectCard: (cardId: string, direction?: 1 | -1) => void;
  onNextCard: () => void;
  onPreviousCard: () => void;
  mode?: 'main' | 'archive';
  /** A phone: taller edges, scrolled by a finger. */
  isPhone?: boolean;
  /** The window's height: a tall one shows one more edge. */
  viewportHeight?: number;
  /** Cards that are overdue: marked red, and counted in the corner. */
  overdueIds?: ReadonlySet<string>;

  // The deck tabs the file carries.
  decks: Deck[];
  activeDeckId: string;
  overdueDeckIds: ReadonlySet<string>;
  /** Hits per deck while searching with "on the tabs"; null otherwise. */
  hitCounts: Readonly<Record<string, number>> | null;
  canCreateDeck: boolean;
  onSelectDeck: (deckId: string) => void;
  onEditDeck: (deckId: string) => void;
  onCreateDeck: () => void;
}

const hashOf = (text: string): number => {
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

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

/**
 * The card file at the top of the table: a row of deck tabs, the divider they
 * stand on and, from under it, the top edges of the deck's cards laid one over
 * another like a fan, each in its card's paper. The edge at the top is the
 * card on the table.
 */
export const CardSwitcher: React.FC<CardSwitcherProps> = ({
  cards,
  activeCardId,
  onSelectCard,
  onNextCard,
  onPreviousCard,
  isPhone = false,
  viewportHeight = 800,
  overdueIds,
  decks,
  activeDeckId,
  overdueDeckIds,
  hitCounts,
  canCreateDeck,
  onSelectDeck,
  onEditDeck,
  onCreateDeck,
}) => {
  const metrics = getSwitcherMetrics(isPhone, viewportHeight);
  const listRef = useRef<HTMLDivElement | null>(null);
  const edgesRef = useRef<HTMLDivElement | null>(null);
  const switcherRef = useRef<HTMLDivElement | null>(null);
  const previousDeckIdRef = useRef(activeDeckId);

  // The red dot jumps to the next overdue card after the current one, round
  // the deck, with a light tap.
  const goToNextOverdue = () => {
    const activeIndex = cards.findIndex((card) => card.id === activeCardId);

    for (let step = 1; step <= cards.length; step += 1) {
      const candidate = cards[(activeIndex + step) % cards.length];

      if (candidate && overdueIds?.has(candidate.id)) {
        if (candidate.id !== activeCardId) {
          haptic(8);
          onSelectCard(candidate.id, 1);
        }
        return;
      }
    }
  };

  const count = cards.length;
  const listHeight = getEdgesHeight(metrics, count);

  // The list picks by itself: the edge at the top is the chosen card, so
  // scrolling the list chooses cards, and a card chosen any other way is
  // scrolled up to the top.
  //
  // It is also a loop: past the last card come the first ones again. To get
  // that from an ordinary scrolling box the deck is drawn several times end to
  // end and the scroll position is kept in the middle copy: when the scrolling
  // settles, the list is moved back by whole copies, which looks the same.
  const rowStep = metrics.rowStep;
  const canScroll = count > metrics.visibleRows;
  const copies = !canScroll ? 1 : count <= 100 ? 7 : 3;
  const middleOffsetRows = canScroll ? Math.floor(copies / 2) * count : 0;
  const isTouchingRef = useRef(false);
  const lastUserScrollAtRef = useRef(0);
  const ignoreScrollUntilRef = useRef(0);
  const hasAlignedRef = useRef(false);
  const recentreTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (recentreTimerRef.current !== null) {
        window.clearTimeout(recentreTimerRef.current);
      }
    },
    [],
  );

  // A changed deck: its edges slide out from under the divider.
  useEffect(() => {
    if (previousDeckIdRef.current === activeDeckId) {
      return;
    }

    previousDeckIdRef.current = activeDeckId;
    edgesRef.current?.animate?.(
      [
        { transform: 'translate3d(0, -22px, 0)', opacity: 0 },
        { transform: 'translate3d(0, 0, 0)', opacity: 1 },
      ],
      { duration: 300, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
    );
  }, [activeDeckId]);

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

    let target = 0;

    if (canScroll) {
      // The copy of this card that is nearest to where the list is now, so
      // going from the last card to the first is one step forward.
      const middle = index + middleOffsetRows;
      // The first time the list is placed it goes to the middle copy.
      const copyShift = hasAlignedRef.current
        ? Math.round(
            ((list.scrollTop - metrics.overlap) / rowStep - middle) / count,
          )
        : 0;
      const lastTop =
        (copies * count - metrics.visibleRows) * rowStep + metrics.overlap;

      target = Math.min(
        lastTop,
        Math.max(
          metrics.overlap,
          (middle + copyShift * count) * rowStep + metrics.overlap,
        ),
      );
    }

    if (Math.abs(list.scrollTop - target) < 1) {
      return;
    }

    const isFirst = !hasAlignedRef.current;

    hasAlignedRef.current = true;
    ignoreScrollUntilRef.current = performance.now() + (isFirst ? 80 : 520);
    list.scrollTo({ top: target, behavior: isFirst ? 'auto' : 'smooth' });
  }, [
    activeCardId,
    cards,
    canScroll,
    copies,
    count,
    middleOffsetRows,
    metrics.visibleRows,
    metrics.overlap,
    rowStep,
  ]);

  // When the list has come to rest, put it back in the middle copy.
  const scheduleRecentre = () => {
    if (recentreTimerRef.current !== null) {
      window.clearTimeout(recentreTimerRef.current);
    }

    recentreTimerRef.current = window.setTimeout(() => {
      const list = listRef.current;

      if (!list || isTouchingRef.current) {
        return;
      }

      const row = Math.round((list.scrollTop - metrics.overlap) / rowStep);
      const index = ((row % count) + count) % count;
      const home = (index + middleOffsetRows) * rowStep + metrics.overlap;

      if (Math.abs(list.scrollTop - home) > 1) {
        ignoreScrollUntilRef.current = performance.now() + 80;
        list.scrollTop = home;
      }
    }, 220);
  };

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
    scheduleRecentre();

    const row = Math.round((list.scrollTop - metrics.overlap) / rowStep);
    const index = ((row % count) + count) % count;
    const card = cards[index];

    if (card && card.id !== activeCardId) {
      const from = cards.findIndex((entry) => entry.id === activeCardId);
      let delta = index - from;

      // The short way round the loop.
      if (delta > count / 2) {
        delta -= count;
      } else if (delta < -count / 2) {
        delta += count;
      }

      onSelectCard(card.id, delta > 0 ? 1 : -1);
    }
  };

  useWheelNavigation(switcherRef, {
    onNext: onNextCard,
    onPrevious: onPreviousCard,
    isEnabled: cards.length > 1,
  });

  const rows = Array.from({ length: copies }, (_, copy) =>
    cards.map((card) => ({ card, copy })),
  ).flat();

  return (
    <div
      ref={switcherRef}
      className="relative"
      style={{
        // Sized by the container (not 100vw) so it can never overflow the
        // window, whatever the page zoom or scrollbar situation.
        width: `min(${CARD_FILE_MAX_WIDTH}px, 100%)`,
      }}
    >
      <CardFileTabs
        decks={decks}
        activeDeckId={activeDeckId}
        overdueDeckIds={overdueDeckIds}
        hitCounts={hitCounts}
        canCreate={canCreateDeck}
        onSelect={onSelectDeck}
        onEdit={onEditDeck}
        onCreate={onCreateDeck}
      />

      {count > 0 && (
        <div
          ref={edgesRef}
          className="relative"
          style={{ height: listHeight, zIndex: 1 }}
        >
          {/* Scrolls under a finger (and by wheel through the cards). */}
          <div
            ref={listRef}
            className="no-scrollbar relative flex flex-col overflow-y-auto"
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
            {rows.map(({ card, copy }, index) => {
              const isActive = card.id === activeCardId;
              const palette = getCardPalette(card);
              const isOverdue = Boolean(overdueIds?.has(card.id));
              // Roughness drawn from the id: it never changes between renders.
              const hash = hashOf(card.id);
              const inset = isActive ? 0 : 6 + ((hash % 7) - 3) * 0.8;
              const tilt = isActive ? 0 : (((hash >>> 4) % 9) - 4) * 0.1;

              return (
                <button
                  key={copy + ':' + card.id}
                  type="button"
                  data-card-id={card.id}
                  onClick={() => onSelectCard(card.id)}
                  aria-pressed={isActive}
                  className="engraved relative flex shrink-0 items-start border-0 px-3 text-left"
                  style={{
                    height: metrics.rowHeight,
                    width: `calc(100% - ${inset * 2}px)`,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    marginTop: index === 0 ? 0 : -metrics.overlap,
                    zIndex: rows.length - index,
                    scrollSnapAlign: 'start',
                    // Snap with the part under the card above out of sight.
                    scrollMarginTop: -metrics.overlap,
                    borderRadius: '0 0 10px 10px',
                    backgroundColor: palette.paper,
                    backgroundImage: `url(${cardboardTexture})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundBlendMode: 'multiply',
                    border: '1px solid rgba(91,76,59,0.16)',
                    borderTop: 'none',
                    boxShadow: isActive
                      ? '0 3px 6px rgba(20,17,14,0.32), inset 0 -1px 0 rgba(79,61,42,0.1)'
                      : '0 2px 3px rgba(20,17,14,0.26), inset 0 -1px 0 rgba(79,61,42,0.1)',
                    filter: isActive ? 'brightness(1.045)' : undefined,
                    transform: tilt ? `rotate(${tilt}deg)` : undefined,
                    transformOrigin: 'center top',
                  }}
                >
                  <span
                    className="relative block min-w-0 flex-1 truncate"
                    style={{
                      color: palette.ink,
                      fontFamily: "'Lora', Georgia, serif",
                      fontWeight: isActive ? 700 : 600,
                      fontSize: metrics.fontSize,
                      // The top of an edge lies under the card above: the
                      // name stands in the part that shows.
                      paddingTop: metrics.overlap,
                      lineHeight: `${metrics.rowStep}px`,
                    }}
                  >
                    {card.pinned && (
                      <span
                        className="mr-1.5"
                        style={{ color: '#B8851F' }}
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
                          boxShadow:
                            '0 0 0 1.5px rgba(255,255,255,0.85), 0 1px 2px rgba(40,12,8,0.4)',
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
      )}

      {/* Overdue: a red dot on the divider's right end, saying what it is. */}
      <OverdueBadge
        count={overdueIds?.size ?? 0}
        label="просрочено"
        className="absolute z-10"
        style={{
          right: 6,
          top: CARD_FILE_TAB_ROW_HEIGHT + CARD_FILE_DIVIDER_HEIGHT / 2 - 11,
        }}
        onPress={goToNextOverdue}
      />
    </div>
  );
};
