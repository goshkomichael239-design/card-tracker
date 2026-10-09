import React from 'react';

import type { VisualCard } from '../../app/cardTheme';
import { INITIAL_TASK_CARD_V2_CONFIG } from '../task-card/taskCardV2Config';
import { TaskCard } from '../task-card/TaskCard';
import { CardStack } from '../card-stack/CardStack';

interface ArchiveCardProps {
  cards: VisualCard[];
  activeCardId: string;
}

/** Read-only archive presentation using the same V2 card renderer and stack language. */
export const ArchiveCard: React.FC<ArchiveCardProps> = ({ cards, activeCardId }) => {
  const activeCard = cards.find((card) => card.id === activeCardId) ?? cards[0];
  if (!activeCard) return null;

  return (
    <div
      className="relative shrink-0"
      style={{
        width: `min(${INITIAL_TASK_CARD_V2_CONFIG.width}px, 88vw)`,
        aspectRatio: `${INITIAL_TASK_CARD_V2_CONFIG.width} / ${INITIAL_TASK_CARD_V2_CONFIG.height}`,
        touchAction: 'pan-y',
      }}
    >
      <CardStack cards={cards} activeCardId={activeCard.id} />
      <div className="pointer-events-none absolute inset-0 z-20">
        <TaskCard card={activeCard} onComplete={() => undefined} isStatic />
      </div>
    </div>
  );
};
