import React, { useLayoutEffect, useRef } from 'react';

import { getDeckBack } from '../../app/deckBacks';
import type { FileStyle } from '../../app/fileStyle';
import { OverdueBadge } from './OverdueBadge';
import type { Deck } from '../../app/decks';
import {
  CARD_FILE_DIVIDER_HEIGHT,
  CARD_FILE_TAB_ROW_HEIGHT,
} from './cardSwitcherConfig';

export interface CardFileTabsProps {
  decks: Deck[];
  activeDeckId: string;
  /** Decks (other than the one on the table) that have an overdue card. */
  overdueCounts: Readonly<Record<string, number>>;
  /**
   * While searching, with the hits shown on the tabs: how many cards each deck
   * has for the query. Null: the tabs do not show hits.
   */
  hitCounts: Readonly<Record<string, number>> | null;
  /** How the file is put together (see fileStyle.ts). */
  fileStyle: FileStyle;
  /** Where the tab of the deck on the table stands (for the style "box"). */
  onActiveTabRect?: (rect: { left: number; width: number } | null) => void;
  /** The colour of the box the edges lie in (the style "box"). */
  bodyColor: string;
  /** The paper and ink of the first card (the style "folder"). */
  activePaper: string;
  activeInk: string;
  /** How many cards of the deck on the table are overdue (0: no flag). */
  activeOverdueCount: number;
  /** The flag on the tab of the deck on the table was pressed. */
  onOverduePress: () => void;
  canCreate: boolean;
  onSelect: (deckId: string) => void;
  /** The tab of the deck on the table was pressed again. */
  onEdit: (deckId: string) => void;
  onCreate: () => void;
}

const ACTIVE_HEIGHT = CARD_FILE_TAB_ROW_HEIGHT;
const QUIET_HEIGHT = 28;
const GOLD_EDGE = '1px solid rgba(232,201,120,0.75)';
const TYPE_FACE = "'Playfair Display', 'Lora', Georgia, serif";

// The "edit" pencil glyph (Material, 24 x 24), tip at the lower left.
const PENCIL_PATH =
  'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z';

const EmbossedPencil: React.FC<{ ink: string }> = ({ ink }) => (
  <svg
    viewBox="0 0 24 24"
    width="13"
    height="13"
    aria-hidden="true"
    className="shrink-0"
    style={{ overflow: 'visible', marginLeft: 5 }}
  >
    <path d={PENCIL_PATH} fill="rgba(255,255,255,0.55)" transform="translate(0.7 0.7)" />
    <path d={PENCIL_PATH} fill="rgba(0,0,0,0.38)" transform="translate(-0.5 -0.5)" />
    <path d={PENCIL_PATH} fill={ink} opacity="0.62" />
  </svg>
);

/**
 * The decks' tabs and the divider they stand on: a row of tabs above the first
 * edge, one for each deck, in the back's colour with a thin gold line. The deck
 * on the table has the tallest tab with its whole name (and a pencil: pressed
 * again it opens the deck's settings); the others are narrow, names cut with an
 * ellipsis. Under them runs the divider, in the colour of the deck on the table.
 */
export const CardFileTabs: React.FC<CardFileTabsProps> = ({
  decks,
  activeDeckId,
  overdueCounts,
  hitCounts,
  activeOverdueCount,
  onOverduePress,
  fileStyle,
  onActiveTabRect,
  bodyColor,
  activePaper,
  activeInk,
  canCreate,
  onSelect,
  onEdit,
  onCreate,
}) => {
  const activeBack = getDeckBack(
    decks.find((deck) => deck.id === activeDeckId)?.backId,
  );
  const isBoxFile = fileStyle === 'box';
  const rowRef = useRef<HTMLDivElement | null>(null);

  // The silhouette of the box needs to know where the chosen tab stands.
  useLayoutEffect(() => {
    const row = rowRef.current;

    if (!onActiveTabRect) {
      return;
    }

    if (!row || !isBoxFile) {
      onActiveTabRect(null);
      return;
    }

    const report = () => {
      const tab = row.querySelector<HTMLElement>('[data-active-tab="true"]');

      onActiveTabRect(
        tab ? { left: tab.offsetLeft, width: tab.offsetWidth } : null,
      );
    };

    report();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(report);

    observer.observe(row);
    row.querySelectorAll('[data-active-tab]').forEach((tab) =>
      observer.observe(tab),
    );

    return () => observer.disconnect();
  }, [
    onActiveTabRect,
    isBoxFile,
    activeDeckId,
    decks,
    activeOverdueCount,
    hitCounts,
  ]);

  return (
    <>
      <div
        ref={rowRef}
        className="relative flex items-end gap-[3px]"
        style={{
          height: CARD_FILE_TAB_ROW_HEIGHT,
          // In the box the first tab stands clear of the box's rounded corner.
          paddingLeft: isBoxFile ? 14 : 5,
          paddingRight: isBoxFile ? 14 : 5,
        }}
      >
        {decks.map((deck) => {
          const back = getDeckBack(deck.backId);
          const isActive = deck.id === activeDeckId;
          const hits = hitCounts ? (hitCounts[deck.id] ?? 0) : null;
          const otherOverdue = isActive ? 0 : (overdueCounts[deck.id] ?? 0);
          const isDimmed = hits !== null && !isActive && hits === 0;
          const showsNumberedFlag =
            isActive && activeOverdueCount > 0 && hits === null;
          const isFlat = fileStyle === 'flat';
          // The tab of the deck on the table can take the colour of the box
          // it grows out of, or of the first card's paper.
          const tabColor =
            isActive && fileStyle === 'box'
              ? bodyColor
              : isActive && fileStyle === 'folder'
                ? activePaper
                : back.tab;
          const tabInk =
            isActive && fileStyle === 'folder' ? activeInk : back.tabInk;

          return (
            <div
              key={deck.id}
              data-active-tab={isActive ? 'true' : undefined}
              className="relative flex min-w-0"
              style={{
                flex: isActive ? '0 1 auto' : '1 1 0',
                maxWidth: isActive ? '62%' : 84,
                minWidth: isActive ? 0 : 30,
                // In the box the others stand behind its front edge.
                zIndex: isActive ? 3 : isBoxFile ? 0 : 1,
              }}
            >
            <button
              type="button"
              onClick={() => (isActive ? onEdit(deck.id) : onSelect(deck.id))}
              onTouchStart={() => undefined}
              aria-pressed={isActive}
              aria-label={`Колода «${deck.name}»${isActive ? ', настройки' : ''}${hits ? `, найдено: ${hits}` : ''}`}
              title={deck.name}
              className="relative flex min-w-0 flex-1 cursor-pointer items-center justify-center border-0 px-1.5 text-center"
              style={{
                paddingRight: showsNumberedFlag ? 16 : undefined,
                alignSelf: 'flex-end',
                height: isActive ? ACTIVE_HEIGHT : QUIET_HEIGHT,
                borderRadius: isFlat ? 0 : '9px 9px 0 0',
                // The chosen tab of the box is part of its outline: it has no
                // body of its own, the box's material shows through it.
                borderTop: isFlat || (isBoxFile && isActive) ? 0 : GOLD_EDGE,
                borderLeft: isFlat || (isBoxFile && isActive) ? 0 : GOLD_EDGE,
                borderRight: isFlat || (isBoxFile && isActive) ? 0 : GOLD_EDGE,
                backgroundColor:
                  isFlat || (isBoxFile && isActive) ? 'transparent' : tabColor,
                // The other tabs of the box keep their own colour at the top
                // and take the box's colour towards the foot: they grow out of
                // the same material.
                backgroundImage: isFlat || (isBoxFile && isActive)
                  ? 'none'
                  : isBoxFile
                    ? `linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 30%, ${bodyColor} 96%)`
                    : 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 55%, rgba(0,0,0,0.16) 100%)',
                color: isFlat
                  ? isActive
                    ? '#FFF6D6'
                    : 'rgba(255,246,214,0.62)'
                  : tabInk,
                boxShadow: isFlat
                  ? isActive
                    ? 'inset 0 -2px 0 rgba(232,201,120,0.95)'
                    : 'none'
                  : isBoxFile
                    ? isActive
                      ? 'none'
                      : 'inset 1px 1px 0 rgba(255,255,255,0.3)'
                  : isActive
                    ? 'var(--shadow-0), inset 1px 1px 0 rgba(255,255,255,0.5)'
                    : 'var(--shadow-0), inset 1px 1px 0 rgba(255,255,255,0.35)',
                filter:
                  isActive || isFlat
                    ? 'none'
                    : isBoxFile
                      ? 'brightness(0.9) saturate(0.95)'
                      : 'brightness(0.86) saturate(0.9)',
                opacity: isDimmed ? 0.5 : 1,
                transition:
                  'height 200ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms ease-out, filter 200ms ease-out',
              }}
            >
              <span
                className="block min-w-0 truncate"
                style={{
                  fontFamily: TYPE_FACE,
                  fontSize: isActive ? 13.5 : 12.5,
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                  lineHeight: 1.1,
                  textShadow: '0 1px 0 rgba(255,255,255,0.22)',
                }}
              >
                {deck.name}
              </span>

              {isActive && <EmbossedPencil ink={isFlat ? '#FFF6D6' : tabInk} />}

              {hits !== null && hits > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute"
                  style={{
                    top: -7,
                    right: -4,
                    minWidth: 18,
                    height: 18,
                    padding: '0 4px',
                    borderRadius: 9,
                    backgroundColor: '#F7F2E8',
                    border: '1px solid rgba(60,45,30,0.4)',
                    color: '#3F3932',
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: '16px',
                    textAlign: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
                  }}
                >
                  {hits}
                </span>
              )}

            </button>

              {/* The badge: a red capsule with the number in the tab's top
                  right corner. On the deck on the table it is a button (to the
                  next overdue card). */}
              {showsNumberedFlag && (
                <button
                  type="button"
                  onClick={onOverduePress}
                  onTouchStart={() => undefined}
                  aria-label={`Просрочено: ${activeOverdueCount}. К следующей просроченной`}
                  title={`Просрочено: ${activeOverdueCount}`}
                  className="absolute z-10 cursor-pointer border-0 bg-transparent p-0 active:translate-y-px"
                  style={{ right: -4, top: -8, lineHeight: 0 }}
                >
                  <OverdueBadge count={activeOverdueCount} />
                </button>
              )}
              {otherOverdue > 0 && hits === null && (
                <OverdueBadge
                  count={otherOverdue}
                  className="absolute"
                  style={{ right: -4, top: -8 }}
                />
              )}
            </div>
          );
        })}

        {canCreate && (
          <button
            type="button"
            onClick={onCreate}
            onTouchStart={() => undefined}
            aria-label="Новая колода"
            title="Новая колода"
            className="flex shrink-0 cursor-pointer items-center justify-center border-0 p-0"
            style={{
              width: 34,
              height: QUIET_HEIGHT,
              borderRadius: '9px 9px 0 0',
              borderTop: GOLD_EDGE,
              borderLeft: GOLD_EDGE,
              borderRight: GOLD_EDGE,
              backgroundColor: '#E9E1CE',
              backgroundImage:
                'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(0,0,0,0.08) 100%)',
              boxShadow: 'var(--shadow-0)',
            }}
          >
            {/* A plus drawn by hand in pencil. */}
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M12.2 5.2 L11.8 18.6 M5.4 12.3 L18.5 11.7"
                stroke="#6B5B45"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        )}
      </div>

      {/* The divider the tabs stand on: the deck's colour, gold at its edges. */}
      <div
        aria-hidden="true"
        style={{
          position: 'relative',
          zIndex: 2,
          height: CARD_FILE_DIVIDER_HEIGHT,
          marginTop: -1,
          marginLeft: 5,
          marginRight: 5,
          borderRadius: '2px 2px 4px 4px',
          backgroundColor:
            fileStyle === 'box'
              ? 'transparent'
              : fileStyle === 'folder'
                ? activePaper
                : fileStyle === 'flat'
                  ? 'rgba(232,201,120,0.5)'
                  : activeBack.tab,
          backgroundImage:
            fileStyle === 'box' ||
            fileStyle === 'flat' ||
            fileStyle === 'folder'
              ? 'none'
              : 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0.15) 100%)',
          borderBottom:
            fileStyle === 'box' || fileStyle === 'flat' || fileStyle === 'folder'
              ? 0
              : GOLD_EDGE,
          boxShadow:
            fileStyle === 'box' || fileStyle === 'flat' || fileStyle === 'folder'
              ? 'none'
              : 'var(--shadow-0)',
          transition: 'background-color 240ms ease-out',
        }}
      />
    </>
  );
};
