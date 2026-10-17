import React from 'react';

import cardboardTexture from '../../assets/cardboard.svg';
import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import type { DeckBack } from '../../app/deckBacks';
import { INITIAL_TASK_CARD_V2_CONFIG } from '../task-card/taskCardV2Config';

interface CardStackLayerProps {
  card: VisualCard;
  sequenceIndex: number;
  back?: DeckBack;
}

export const CardStackLayer: React.FC<CardStackLayerProps> = ({
  card,
  sequenceIndex,
  back,
}) => {
  const config = INITIAL_TASK_CARD_V2_CONFIG;
  const depth = sequenceIndex + 1;
  const x = depth * config.stackOffsetX;
  const y = depth * config.stackOffsetY;
  const rotation =
    depth * config.stackRotation * (sequenceIndex % 2 === 0 ? 1 : -0.65);
  const scale = 1 - depth * 0.012;
  const hasBack = Boolean(back?.paper);
  const cast = 'var(--shadow-stack)';

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
        boxShadow: cast,
        // A deck with a back shows it on every lower layer.
        ...(hasBack
          ? {
              ...back!.paper,
              backgroundSize: 'auto',
              backgroundBlendMode: 'normal',
              // Every back has a thin gilt edge (a dark line outside it and a
              // lit one inside), so a layer never melts into the cloth.
              border: '1.5px solid rgba(232,200,112,0.95)',
              boxShadow: `${back!.paper!.boxShadow}, inset 0 1px 0 rgba(255,244,200,0.55), 0 0 0 0.75px rgba(52,34,8,0.55), ${cast}`,
            }
          : {}),
      }}
      aria-hidden="true"
    >
      {!hasBack && (
        <>
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
        </>
      )}
    </div>
  );
};
