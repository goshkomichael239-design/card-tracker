import React from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import { INITIAL_TASK_CARD_V2_CONFIG } from '../task-card/taskCardV2Config';

interface CardStackLayerProps {
  card: VisualCard;
  sequenceIndex: number;
}

export const CardStackLayer: React.FC<CardStackLayerProps> = ({
  card,
  sequenceIndex,
}) => {
  const config = INITIAL_TASK_CARD_V2_CONFIG;
  const depth = sequenceIndex + 1;
  const x = depth * config.stackOffsetX;
  const y = depth * config.stackOffsetY;
  const rotation =
    depth * config.stackRotation * (sequenceIndex % 2 === 0 ? 1 : -0.65);
  const scale = 1 - depth * 0.012;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        zIndex: 10 - sequenceIndex,
        borderRadius: `${config.borderRadius}px`,
        transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: 'center center',
        backgroundColor: getCardPalette(card).paper,
        backgroundImage: `url(${cardboardTexture})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundBlendMode: 'multiply',
        border: '1px solid rgba(91,76,59,0.16)',
        boxShadow: `${config.shadowX * 0.55}px ${config.shadowY * 0.6}px ${config.shadowBlur * 0.6}px rgba(20,17,14,${config.shadowOpacity * 0.58})`,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${cardboardTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mixBlendMode: 'multiply',
          opacity: config.paperTextureOpacity,
        }}
      />
      <span className="engraved absolute left-5 top-6 truncate font-mono text-[10.5px] uppercase tracking-[0.12em] text-black/20">
        {card.title}
      </span>
    </div>
  );
};
