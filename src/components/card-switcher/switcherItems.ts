import type { VisualCard } from '../../app/cardTheme';
import type { DueBucket } from '../../app/timeOps';

export type DeckFilter = 'all' | DueBucket;
/** A card's place in time; null is "no date" (the rest of the deck). */
export type DeckGroup = DueBucket | null;

export const MAX_VISIBLE_ROWS = 4;
export const DIVIDER_HEIGHT = 28;

export type SwitcherItem =
  | { type: 'divider'; group: DeckGroup }
  | { type: 'card'; card: VisualCard };

/** Which cards are on show: the window around the active one. */
export const getSwitcherWindow = (
  cards: VisualCard[],
  activeCardId: string,
): VisualCard[] => {
  const activeIndex = Math.max(
    0,
    cards.findIndex((card) => card.id === activeCardId),
  );
  const start = Math.min(
    Math.max(0, activeIndex - (MAX_VISIBLE_ROWS - 1)),
    Math.max(0, cards.length - MAX_VISIBLE_ROWS),
  );

  return cards.slice(start, start + MAX_VISIBLE_ROWS);
};

/**
 * The rows of the panel: the visible cards with a divider before each group
 * that starts (and before the first card, so the group is always named).
 * Without `groupOf` the panel is a plain list.
 */
export const buildSwitcherItems = (
  cards: VisualCard[],
  activeCardId: string,
  groupOf?: (card: VisualCard) => DeckGroup,
): SwitcherItem[] => {
  const items: SwitcherItem[] = [];
  let previous: DeckGroup | undefined;

  for (const card of getSwitcherWindow(cards, activeCardId)) {
    if (groupOf) {
      const group = groupOf(card);

      if (group !== previous) {
        items.push({ type: 'divider', group });
        previous = group;
      }
    }

    items.push({ type: 'card', card });
  }

  return items;
};

export const GROUP_STYLE: Record<
  'overdue' | 'today' | 'soon' | 'rest',
  { label: string; ink: string; mark: string }
> = {
  overdue: { label: 'Просрочено', ink: '#8F3025', mark: '#B8483A' },
  today: { label: 'Сегодня', ink: '#5a4520', mark: '#C9A24B' },
  soon: { label: 'Скоро', ink: '#3f4f5c', mark: '#6C8799' },
  rest: { label: 'Без срока', ink: 'rgba(70,52,28,0.7)', mark: 'transparent' },
};

export const groupStyle = (group: DeckGroup) => GROUP_STYLE[group ?? 'rest'];
