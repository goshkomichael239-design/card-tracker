import React from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import {
  CARD_RADIUS,
  PALETTES,
  type VisualCard,
} from '../../app/cardTheme';
import type { CardStackConfig } from './cardStackConfig';

interface CardStackLayerProps {
  card: VisualCard;
  sequenceIndex: number;
  layerCount: number;
  config: CardStackConfig;
}

export const CardStackLayer: React.FC<CardStackLayerProps> = ({
  card,
  sequenceIndex,
  layerCount,
  config,
}) => {
  const palette = PALETTES[card.timeMode];
  const isNextPreview = sequenceIndex === 0;
  const depth = Math.max(1, layerCount - sequenceIndex);
  const x = isNextPreview
    ? config.nextPreviewX
    : depth * config.layerOffsetX;
  const y = isNextPreview
    ? config.nextPreviewY + config.nextPreviewReveal
    : depth * (config.layerOffsetY + config.visibleEdge);
  const rotation = isNextPreview
    ? config.nextPreviewRotation
    : (depth % 2 === 0 ? -1 : 1) * depth * config.rotationStep;
  const scale = 1 - depth * config.scaleStep;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        zIndex: isNextPreview ? 1 : sequenceIndex + 1,
        borderRadius: `${CARD_RADIUS}px`,
        transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: 'center center',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        backgroundColor: palette.paper,
        backgroundImage: `
          linear-gradient(
            138deg,
            rgba(255,255,255,0.08) 0%,
            transparent 46%,
            rgba(35,25,18,0.12) 100%
          ),
          url(${cardboardTexture})
        `,
        backgroundPosition: 'center, center',
        backgroundSize: '100% 100%, cover',
        backgroundBlendMode: 'multiply, multiply',
        border: '1px solid rgba(73,55,40,0.22)',
        boxShadow: `${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px rgba(0,0,0,${config.shadowOpacity})`,
      }}
      aria-hidden="true"
    >
      {isNextPreview && (
        <span
          className="absolute bottom-[5px] left-[18px] right-[18px] truncate font-mono text-[7px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: palette.ink, opacity: 0.5 }}
        >
          {card.title}
        </span>
      )}
    </div>
  );
};
