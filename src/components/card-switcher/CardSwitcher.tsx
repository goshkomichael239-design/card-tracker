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

// Every edge is as wide as the others and stands exactly under the one
// above; this much of the file's width is left free at each side, so the
// shadows are not cut by the list's own edge.
const EDGE_INSET = 5;

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
                    width: `calc(100% - ${EDGE_INSET * 2}px)`,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    marginTop: index === 0 ? 0 : -metrics.overlap,
                    // The chosen card lies in front of all the others; of
                    // the rest each is under the one above it.
                    zIndex: isActive ? rows.length + 1 : rows.length - index,
                    scrollSnapAlign: 'start',
                    // Snap with the part under the card above out of sight.
                    scrollMarginTop: -metrics.overlap,
                    // Rounded at the bottom for all; the chosen card, in
                    // front, at the top too. The others' upper corners are
                    // square and lie under the card above, so nothing shows
                    // through the rounding of its lower corners.
                    borderRadius: isActive ? 11 : '0 0 11px 11px',
                    backgroundColor: palette.paper,
                    // From the top: light falling on the paper, a soft
                    // darkening towards the lower edge, the board's grain.
                    backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.08) 38%, rgba(70,48,28,0.12) 100%), linear-gradient(100deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 42%, rgba(60,40,24,0.07) 100%), url(${cardboardTexture})`,
                    backgroundSize: '100% 100%, 100% 100%, cover',
                    backgroundPosition: 'center',
                    backgroundBlendMode: 'normal, normal, multiply',
                    border: '1px solid rgba(91,76,59,0.2)',
                    borderTop: isActive
                      ? '1px solid rgba(91,76,59,0.2)'
                      : 'none',
                    // The cut edge of a real card: a pale rim of the board's
                    // thickness along the bottom, then the shadow it casts
                    // on the card below (tight, then a soft one).
                    boxShadow: isActive
                      ? 'inset 0 -2px 0 rgba(255,255,255,0.62), inset 0 -3px 0 rgba(79,61,42,0.14), inset 0 1px 0 rgba(255,255,255,0.55), 0 3px 4px -1px rgba(20,17,14,0.4), 0 8px 12px -4px rgba(20,17,14,0.3)'
                      : 'inset 0 -2px 0 rgba(255,255,255,0.55), inset 0 -3px 0 rgba(79,61,42,0.12), inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 4px -1px rgba(20,17,14,0.36), 0 6px 9px -4px rgba(20,17,14,0.24)',
                    filter: isActive ? 'brightness(1.05) saturate(1.04)' : undefined,
                  }}
                >
                  {/* The card's colour as a thin stripe on its left. */}
                  <span
                    aria-hidden="true"
                    className="absolute"
                    style={{
                      left: 5,
                      top: metrics.overlap + 5,
                      bottom: 6,
                      width: 3,
                      borderRadius: 2,
                      backgroundColor: palette.accent,
                      opacity: isActive ? 0.9 : 0.6,
                      boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.12)',
                    }}
                  />
                  <span
                    className="relative block min-w-0 flex-1 truncate"
                    style={{
                      color: palette.ink,
                      fontFamily: "'Lora', Georgia, serif",
                      fontWeight: isActive ? 700 : 600,
                      letterSpacing: '0.008em',
                      paddingLeft: 6,
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
