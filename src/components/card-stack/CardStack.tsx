import React, { useMemo, useState } from 'react';

import type { VisualCard } from '../../app/cardTheme';
import { CardStackDebugPanel } from './CardStackDebugPanel';
import { CardStackLayer } from './CardStackLayer';
import {
  INITIAL_CARD_STACK_CONFIG,
  type CardStackConfig,
} from './cardStackConfig';

interface CardStackProps {
  cards: VisualCard[];
  activeCardId: string;
}

const MAX_LOWER_LAYERS = 6;

export const CardStack: React.FC<CardStackProps> = ({
  cards,
  activeCardId,
}) => {
  const [config, setConfig] = useState<CardStackConfig>(() => ({
    ...INITIAL_CARD_STACK_CONFIG,
  }));
  const activeIndex = Math.max(
    0,
    cards.findIndex((card) => card.id === activeCardId),
  );
  const layerCount = Math.min(
    cards.length - 1,
    MAX_LOWER_LAYERS,
    Math.max(0, Math.round(config.visibleLayers)),
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
            layerCount={layerCount}
            config={config}
          />
        ))}
      </div>

      {import.meta.env.DEV && (
        <CardStackDebugPanel config={config} onChange={setConfig} />
      )}
    </>
  );
};
