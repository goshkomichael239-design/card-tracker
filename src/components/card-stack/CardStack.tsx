import React, { useMemo } from 'react';

import type { VisualCard } from '../../app/cardTheme';
import { CardStackLayer } from './CardStackLayer';

interface CardStackProps {
  cards: VisualCard[];
  activeCardId: string;
}

const MAX_LOWER_LAYERS = 4;

export const CardStack: React.FC<CardStackProps> = ({
  cards,
  activeCardId,
}) => {
  const activeIndex = Math.max(
    0,
    cards.findIndex((card) => card.id === activeCardId),
  );
  const layerCount = Math.max(
    0,
    Math.min(
      cards.length - 1,
      MAX_LOWER_LAYERS,
    ),
  );
  const stackCards = useMemo(
    () =>
      Array.from({ length: layerCount }, (_, index) => {
        const cardIndex = (activeIndex + index + 1) % cards.length;
        return cards[cardIndex];
      }),
    [activeIndex, cards, layerCount],
  );

  return (
    <>
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 14 }}>
        {stackCards.map((card, sequenceIndex) => (
          <CardStackLayer
            key={card.id}
            card={card}
            sequenceIndex={sequenceIndex}
          />
        ))}
      </div>
    </>
  );
};
