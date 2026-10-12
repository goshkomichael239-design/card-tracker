import React from 'react';

import { getDeckBack } from '../../app/deckBacks';
import type { Deck } from '../../app/decks';
import {
  CARD_FILE_DIVIDER_HEIGHT,
  CARD_FILE_TAB_ROW_HEIGHT,
} from './cardSwitcherConfig';

export interface CardFileTabsProps {
  decks: Deck[];
  activeDeckId: string;
  /** Decks (other than the one on the table) that have an overdue card. */
  overdueDeckIds: ReadonlySet<string>;
  /**
   * While searching, with the hits shown on the tabs: how many cards each deck
   * has for the query. Null: the tabs do not show hits.
   */
  hitCounts: Readonly<Record<string, number>> | null;
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
  overdueDeckIds,
  hitCounts,
  canCreate,
  onSelect,
  onEdit,
  onCreate,
}) => {
  const activeBack = getDeckBack(
    decks.find((deck) => deck.id === activeDeckId)?.backId,
  );

  return (
    <>
      <div
        className="relative flex items-end gap-[3px] px-1.5"
        style={{ height: CARD_FILE_TAB_ROW_HEIGHT }}
      >
        {decks.map((deck) => {
          const back = getDeckBack(deck.backId);
          const isActive = deck.id === activeDeckId;
          const hits = hitCounts ? (hitCounts[deck.id] ?? 0) : null;
          const hasOverdue = !isActive && overdueDeckIds.has(deck.id);
          const isDimmed = hits !== null && !isActive && hits === 0;

          return (
            <button
              key={deck.id}
              type="button"
              onClick={() => (isActive ? onEdit(deck.id) : onSelect(deck.id))}
              onTouchStart={() => undefined}
              aria-pressed={isActive}
              aria-label={`Колода «${deck.name}»${isActive ? ', настройки' : ''}${hits ? `, найдено: ${hits}` : ''}`}
              title={deck.name}
              className="relative flex min-w-0 cursor-pointer items-center justify-center border-0 px-1.5 text-center"
              style={{
                flex: isActive ? '0 1 auto' : '1 1 0',
                maxWidth: isActive ? '62%' : 84,
                minWidth: isActive ? 0 : 30,
                height: isActive ? ACTIVE_HEIGHT : QUIET_HEIGHT,
                borderRadius: '9px 9px 0 0',
                borderTop: GOLD_EDGE,
                borderLeft: GOLD_EDGE,
                borderRight: GOLD_EDGE,
                backgroundColor: back.tab,
                backgroundImage:
                  'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 55%, rgba(0,0,0,0.16) 100%)',
                color: back.tabInk,
                boxShadow: isActive
                  ? '0 -2px 5px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.45)'
                  : '0 -1px 3px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.3)',
                filter: isActive ? 'none' : 'brightness(0.86) saturate(0.9)',
                opacity: isDimmed ? 0.5 : 1,
                zIndex: isActive ? 3 : 1,
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

              {isActive && <EmbossedPencil ink={back.tabInk} />}

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

              {hasOverdue && hits === null && (
                <span
                  aria-label="Есть просроченное"
                  className="absolute"
                  style={{
                    top: 3,
                    right: 3,
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle at 32% 28%, #E0705F 0%, #B8483A 55%, #8F3025 100%)',
                    boxShadow: '0 0 0 1.5px rgba(255,255,255,0.8)',
                  }}
                />
              )}
            </button>
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
              boxShadow: '0 -1px 3px rgba(0,0,0,0.2)',
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
          backgroundColor: activeBack.tab,
          backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0.15) 100%)',
          borderBottom: GOLD_EDGE,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          transition: 'background-color 260ms ease-out',
        }}
      />
    </>
  );
};
