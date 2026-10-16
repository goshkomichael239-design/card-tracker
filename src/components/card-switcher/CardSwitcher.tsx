import React, { useEffect, useRef, useState } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import { getDeckBack } from '../../app/deckBacks';
import { useFileStyle } from '../../app/fileStyle';
import { buildSilhouettePath } from '../../app/fileSilhouette';
import {
  CARD_FILE_TAB_ROW_HEIGHT,
} from './cardSwitcherConfig';
import type { Deck } from '../../app/decks';
import {
  CARD_FILE_MAX_WIDTH,
  getEdgesHeight,
  getSwitcherMetrics,
} from './cardSwitcherConfig';
import { CardFileTabs } from './CardFileTabs';
import { useWheelNavigation } from '../../app/useWheelNavigation';
import { haptic } from '../../app/haptics';
import { formatOverdueShort } from '../../app/timeOps';
import { STAMP_RED_DARK } from '../../app/stampRed';
import { t } from '../../app/i18n';

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
  /** Overdue cards per deck (for the badges on the tabs). */
  overdueCounts: Readonly<Record<string, number>>;
  /** The time the list is drawn at (for how long a card is overdue). */
  clockNow?: number;
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
// On a phone the file runs the whole width of the screen, on the cloth.
const PHONE_EDGE_INSET = 3;
// The chosen edge reaches this far over the edges above and below it.
const CHOSEN_OVERLAP = 2;
// The rounding of an edge, all four corners.
const TILE_RADIUS = 10;

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
  overdueCounts,
  clockNow,
  hitCounts,
  canCreateDeck,
  onSelectDeck,
  onEditDeck,
  onCreateDeck,
}) => {
  const metrics = getSwitcherMetrics(isPhone, viewportHeight);
  const fileStyle = useFileStyle();
  const activeBack = getDeckBack(
    decks.find((deck) => deck.id === activeDeckId)?.backId,
  );
  const activeCard = cards.find((card) => card.id === activeCardId);
  const activePalette = activeCard ? getCardPalette(activeCard) : null;
  // The box the edges lie in: the deck's back (or, for a deck with plain
  // paper, a warm cardboard), or dark leather for every deck.
  // The leather box is a plain body behind the edges; the "box" is one piece
  // with the chosen tab (see fileSilhouette.ts).
  const isBox = fileStyle === 'leather';
  const isSilhouette = fileStyle === 'box';
  const [tabRect, setTabRect] = useState<{ left: number; width: number } | null>(
    null,
  );
  const [fileSize, setFileSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const bodyColor =
    (activeBack.paper?.backgroundColor as string | undefined) ?? '#cfc2a4';
  const boxStyle: React.CSSProperties =
    fileStyle === 'leather'
      ? {
          backgroundColor: '#2b2018',
          backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.18)), repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 6px)',
        }
      : {
          ...(activeBack.paper ?? {}),
          backgroundColor: bodyColor,
          boxShadow: undefined,
        };
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
      { duration: 420, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
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

    let target = metrics.overlap;

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

  // The size of the whole file, for the silhouette of the box.
  useEffect(() => {
    const element = switcherRef.current;

    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const measure = () =>
      setFileSize({
        width: element.offsetWidth,
        height: element.offsetHeight,
      });

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

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
        width: isPhone ? '100%' : `min(${CARD_FILE_MAX_WIDTH}px, 100%)`,
      }}
    >
      {isSilhouette && tabRect && fileSize.width > 0 && (
        <FileSilhouette
          path={buildSilhouettePath({
            width: fileSize.width,
            bottom: fileSize.height + 7,
            boxTop: CARD_FILE_TAB_ROW_HEIGHT - 1,
            tabTop: 0,
            tabLeft: tabRect.left,
            tabRight: tabRect.left + tabRect.width,
          })}
          material={boxStyle}
          width={fileSize.width}
          height={fileSize.height + 7}
        />
      )}

      {isBox && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            left: 0,
            right: 0,
            top: CARD_FILE_TAB_ROW_HEIGHT - 1,
            bottom: -7,
            borderRadius: '0 12px 12px 12px',
            border: '1.5px solid rgba(232,201,120,0.9)',
            boxShadow:
              'var(--shadow-1), inset 1px 1px 0 rgba(255,244,200,0.35)',
            ...boxStyle,
          }}
        />
      )}

      <CardFileTabs
        fileStyle={fileStyle}
        onActiveTabRect={setTabRect}
        bodyColor={bodyColor}
        activePaper={activePalette?.paper ?? '#F7F2E8'}
        activeInk={activePalette?.ink ?? '#3F3932'}
        decks={decks}
        activeDeckId={activeDeckId}
        overdueCounts={overdueCounts}
        hitCounts={hitCounts}
        activeOverdueCount={overdueIds?.size ?? 0}
        onOverduePress={goToNextOverdue}
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
              scrollSnapType: 'y mandatory',
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
              // The lettering stays where it is when the chosen edge grows.
              const textTop =
                metrics.overlap + (isActive ? CHOSEN_OVERLAP : 0);
              const edgeInset = isPhone ? PHONE_EDGE_INSET : EDGE_INSET;

              // The edge is a tile of one step's height with rounded corners
              // all round. Above it lies a band (the overlap) that is cut
              // off: under the corners of the tile above there is the cloth
              // and the tile's shadow, never another card's paper.
              return (
                <div
                  key={copy + ':' + card.id}
                  className="relative shrink-0"
                  style={{
                    height: metrics.rowHeight,
                    width: `calc(100% - ${edgeInset * 2}px)`,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    marginTop: index === 0 ? 0 : -metrics.overlap,
                    // The chosen card lies in front of the rest.
                    zIndex: isActive ? rows.length + 1 : rows.length - index,
                    scrollSnapAlign: 'start',
                    scrollMarginTop: -metrics.overlap,
                  }}
                >
                  {/* Its shadow, on a layer of its own (the paper is clipped
                      and would take its shadow with it). */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0"
                    style={{
                      top: metrics.overlap - (isActive ? CHOSEN_OVERLAP : 0),
                      bottom: isActive ? -CHOSEN_OVERLAP : 0,
                      borderRadius: TILE_RADIUS,
                      boxShadow: isActive
                        ? 'var(--shadow-1)'
                        : 'var(--shadow-0)',
                    }}
                  />

                  <button
                    type="button"
                    data-card-id={card.id}
                    onClick={() => onSelectCard(card.id)}
                    aria-pressed={isActive}
                    className="engraved absolute inset-x-0 flex items-start border-0 px-3 text-left"
                    style={{
                      // The chosen edge is two pixels taller at both ends: it
                      // lies over the edges next to it.
                      top: isActive ? -CHOSEN_OVERLAP : 0,
                      bottom: isActive ? -CHOSEN_OVERLAP : 0,
                      clipPath: `inset(${metrics.overlap}px 0 0 0 round ${TILE_RADIUS}px)`,
                      backgroundColor: palette.paper,
                      // From the top: light falling on the paper, a soft
                      // darkening towards the lower edge, the board's grain.
                      backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.08) 38%, rgba(70,48,28,0.12) 100%), linear-gradient(100deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 42%, rgba(60,40,24,0.07) 100%), url(${cardboardTexture})`,
                      backgroundSize: '100% 100%, 100% 100%, cover',
                      backgroundPosition: 'center',
                      backgroundBlendMode: 'normal, normal, multiply',
                      // The pale rim of the board's thickness at the bottom
                      // and a fine line round the paper.
                      boxShadow:
                        'inset 0 0 0 1px rgba(91,76,59,0.2), inset 0 -2px 0 rgba(255,255,255,0.55), inset 0 -3px 0 rgba(79,61,42,0.12), inset 0 1px 0 rgba(255,255,255,0.45)',
                      filter: isActive
                        ? 'brightness(1.1) saturate(1.05)'
                        : undefined,
                    }}
                  >
                    <span
                      className="relative block min-w-0 flex-1 truncate"
                      style={{
                        color: palette.ink,
                        fontFamily: "'Lora', Georgia, serif",
                        fontWeight: isActive ? 700 : 600,
                        letterSpacing: '0.008em',
                        fontSize: metrics.fontSize,
                        // The cut-off band is above the name.
                        paddingTop: textTop,
                        lineHeight: `${metrics.rowStep}px`,
                      }}
                    >
                      {getCardDisplayLabel(card)}
                    </span>

                    {/* The right end: the star, then how long it has been overdue (red), so
                        the dates stand in one column at the right edge. */}
                    {card.pinned && (
                      <span
                        className="shrink-0"
                        style={{
                          color: '#B8851F',
                          paddingTop: textTop,
                          paddingLeft: 7,
                          fontSize: metrics.fontSize - 1,
                          lineHeight: `${metrics.rowStep}px`,
                        }}
                        role="img"
                        aria-label={t('Закреплена')}
                      >
                        ★
                      </span>
                    )}
                    {isOverdue && (
                      <span
                        className="shrink-0 whitespace-nowrap"
                        style={{
                          color: STAMP_RED_DARK,
                          paddingTop: textTop,
                          paddingLeft: 8,
                          fontFamily: "'Lora', Georgia, serif",
                          fontWeight: 600,
                          fontSize: metrics.fontSize - 2,
                          lineHeight: `${metrics.rowStep}px`,
                        }}
                      >
                        {formatOverdueShort(card, clockNow)}
                      </span>
                    )}
                  </button>

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

interface FileSilhouetteProps {
  path: string;
  material: React.CSSProperties;
  width: number;
  height: number;
}

/**
 * The box of the card file with the chosen deck's tab, as one piece: the back's
 * material cut to the outline, a lit upper edge and a thin gilt line round it,
 * and its shadow following the outline.
 */
const FileSilhouette: React.FC<FileSilhouetteProps> = ({
  path,
  material,
  width,
  height,
}) => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute left-0 top-0"
    style={{
      width,
      height,
      zIndex: 1,
      filter:
        'drop-shadow(1px 2px 2px rgba(28,18,10,0.28)) drop-shadow(5px 10px 12px rgba(28,18,10,0.26))',
    }}
  >
    <div
      className="absolute inset-0"
      style={{
        ...material,
        clipPath: `path('${path}')`,
      }}
    />
    <svg
      className="absolute inset-0 overflow-visible"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={path}
        fill="none"
        stroke="rgba(232,200,112,0.95)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d={path}
        fill="none"
        stroke="rgba(255,244,200,0.35)"
        strokeWidth="1"
        transform="translate(1.2 1.2)"
        style={{ mixBlendMode: 'screen' }}
      />
    </svg>
  </div>
);
