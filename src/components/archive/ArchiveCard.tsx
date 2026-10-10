import React from 'react';

import type { VisualCard } from '../../app/cardTheme';
import { getCardScale, useViewportSize } from '../../app/viewportScale';
import { INITIAL_TASK_CARD_V2_CONFIG } from '../task-card/taskCardV2Config';
import { TaskCard } from '../task-card/TaskCard';
import { CardStack } from '../card-stack/CardStack';

interface ArchiveCardProps {
  cards: VisualCard[];
  activeCardId: string;
}

// Room kept for the neighbouring stack that peeks out to the right and below.
const ARCHIVE_SIDE_OVERHANG = 44;

/** Read-only archive presentation using the same V2 card renderer and stack language. */
export const ArchiveCard: React.FC<ArchiveCardProps> = ({ cards, activeCardId }) => {
  const { width: viewportWidth } = useViewportSize();
  const activeCard = cards.find((card) => card.id === activeCardId) ?? cards[0];
  if (!activeCard) return null;

  const { width, height } = INITIAL_TASK_CARD_V2_CONFIG;
  // The archive scrolls vertically, so only the width limits the scale here.
  const scale = getCardScale(
    viewportWidth - ARCHIVE_SIDE_OVERHANG * 2,
    Number.POSITIVE_INFINITY,
    width,
    height,
  );

  return (
    <div
      className="relative shrink-0"
      style={{
        width: width * scale,
        height: height * scale,
        touchAction: 'pan-y',
      }}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <CardStack cards={cards} activeCardId={activeCard.id} />
        <div className="pointer-events-none absolute inset-0 z-20">
          <TaskCard card={activeCard} onComplete={() => undefined} isStatic />
        </div>
      </div>
    </div>
  );
};
