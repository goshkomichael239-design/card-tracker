import React from 'react';

import { getDeckBack } from '../../app/deckBacks';
import type { Deck } from '../../app/decks';

interface DeckTabsProps {
  decks: Deck[];
  activeDeckId: string;
  /** Decks (other than the one on the table) that have an overdue card. */
  overdueDeckIds: ReadonlySet<string>;
  canCreate: boolean;
  onSelect: (deckId: string) => void;
  /** The tab of the deck on the table was pressed again. */
  onEdit: (deckId: string) => void;
  onCreate: () => void;
}

const TAB_WIDTH = 46;
const TAB_HEIGHT = 48;
const TAB_GAP = 6;
const FIRST_TAB_LEFT = 18;
// How far a tab stands out above the top edge of the stack.
const RISE_ACTIVE = 35;
const RISE_QUIET = 23;

/**
 * The decks' tabs: coloured dividers standing out of the stack's top edge, one
 * for each deck, in the deck's back colour. The deck on the table stands
 * higher; pressing another brings it to the table, pressing the standing one
 * opens its settings. Drawn in the card's own units, behind the front card.
 */
export const DeckTabs: React.FC<DeckTabsProps> = ({
  decks,
  activeDeckId,
  overdueDeckIds,
  canCreate,
  onSelect,
  onEdit,
  onCreate,
}) => (
  <div
    className="pointer-events-none absolute left-0 top-0"
    style={{ zIndex: 12, width: '100%', height: 0 }}
  >
    {decks.map((deck, index) => {
      const back = getDeckBack(deck.backId);
      const isActive = deck.id === activeDeckId;
      const hasOverdue = !isActive && overdueDeckIds.has(deck.id);

      return (
        <button
          key={deck.id}
          type="button"
          onClick={() => (isActive ? onEdit(deck.id) : onSelect(deck.id))}
          onTouchStart={() => undefined}
          aria-pressed={isActive}
          aria-label={`Колода «${deck.name}»${isActive ? ', настройки' : ''}`}
          title={deck.name}
          className="pointer-events-auto absolute cursor-pointer border-0 p-0"
          style={{
            left: FIRST_TAB_LEFT + index * (TAB_WIDTH + TAB_GAP),
            top: -(isActive ? RISE_ACTIVE : RISE_QUIET),
            width: TAB_WIDTH,
            height: TAB_HEIGHT,
            borderRadius: '11px 11px 0 0',
            backgroundColor: back.tab,
            backgroundImage:
              'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 55%, rgba(0,0,0,0.18) 100%)',
            boxShadow: isActive
              ? '0 -2px 5px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.45)'
              : '0 -1px 3px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.3)',
            filter: isActive ? 'none' : 'brightness(0.86) saturate(0.9)',
            transition:
              'top 220ms cubic-bezier(0.2, 0.8, 0.2, 1), filter 200ms ease-out',
          }}
        >
          <span
            className="block text-center"
            style={{
              marginTop: 6,
              fontFamily: "'Playfair Display', 'Lora', Georgia, serif",
              fontSize: 20,
              fontWeight: 800,
              lineHeight: '24px',
              color: back.tabInk,
              textShadow: '0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            {deck.name.trim().charAt(0).toLocaleUpperCase('ru-RU')}
          </span>

          {hasOverdue && (
            <span
              aria-label="Есть просроченное"
              className="absolute"
              style={{
                top: 4,
                right: 4,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle at 32% 28%, #E0705F 0%, #B8483A 55%, #8F3025 100%)',
                boxShadow: '0 1px 2px rgba(40,12,8,0.5)',
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
        className="pointer-events-auto absolute cursor-pointer p-0"
        style={{
          left: FIRST_TAB_LEFT + decks.length * (TAB_WIDTH + TAB_GAP),
          top: -RISE_QUIET,
          width: 36,
          height: TAB_HEIGHT,
          borderRadius: '11px 11px 0 0',
          border: '1.5px dashed rgba(255,255,255,0.55)',
          borderBottom: 'none',
          backgroundColor: 'rgba(0,20,10,0.22)',
          color: 'rgba(255,255,255,0.8)',
          fontSize: 20,
          fontWeight: 600,
          lineHeight: '24px',
          paddingTop: 5,
        }}
      >
        +
      </button>
    )}
  </div>
);
