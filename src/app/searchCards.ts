import type { VisualCard } from './cardTheme';

/** Lower case, "ё" read as "е", spaces squeezed: how texts are compared. */
export const normalizeSearchText = (text: string): string =>
  text.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();

const haystackOf = (card: VisualCard): string =>
  normalizeSearchText(
    [
      card.title,
      ...(card.list?.items.map((item) => item.text) ?? []),
    ].join(' '),
  );

/**
 * The cards a query finds: every word of the query must be in the card's
 * title or in one of a list's items. An empty query finds all of them.
 */
export const searchCards = (
  cards: VisualCard[],
  query: string,
): VisualCard[] => {
  const words = normalizeSearchText(query).split(' ').filter(Boolean);

  if (words.length === 0) {
    return cards;
  }

  return cards.filter((card) => {
    const haystack = haystackOf(card);

    return words.every((word) => haystack.includes(word));
  });
};
