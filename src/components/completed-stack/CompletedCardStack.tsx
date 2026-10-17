import React, { useEffect, useMemo, useState } from 'react';

import cardboardTexture from '../../assets/cardboard.svg';
import cardBackTexture from '../../assets/card_back.png';
import { CARD_RADIUS } from '../../app/cardTheme';
import { CompletedStackDebugPanel } from './CompletedStackDebugPanel';
import {
  COMPLETED_STACK_MAX_LAYERS,
  INITIAL_COMPLETED_STACK_CONFIG,
  type CompletedStackConfig,
} from './completedStackConfig';
import { t } from '../../app/i18n';

const SHOW_COMPLETED_STACK_DEBUG = false;

interface CompletedCardStackProps {
  completedTodayCount: number;
}

interface CompletedLayerOffset {
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

const getLayerOffsets = (
  config: CompletedStackConfig,
  layerCount: number,
): CompletedLayerOffset[] =>
  Array.from({ length: layerCount }, (_, index) => {
    const isLast = index === layerCount - 1;
    const isPrevious = index === layerCount - 2;
    const variationX = Math.sin(index * 1.5) * 0.8;
    const variationRotation = Math.sin(index * 0.9) * 0.3;
    let x: number;
    let rotate: number;

    if (layerCount === 1) {
      x = config.baseX + config.tailX + variationX;
      rotate = config.tailRotation + variationRotation;
    } else if (layerCount === 2) {
      if (isPrevious) {
        x = config.baseX + config.previousTailX + variationX;
        rotate = config.previousTailRotation + variationRotation;
      } else {
        x = config.baseX + config.tailX + variationX;
        rotate = config.tailRotation + variationRotation;
      }
    } else {
      const compactX = (layerCount - 2) * config.offsetX;

      if (isLast) {
        x = config.baseX + compactX + config.tailX + variationX;
        rotate = config.tailRotation + variationRotation;
      } else if (isPrevious) {
        x =
          config.baseX + compactX + config.previousTailX + variationX;
        rotate = config.previousTailRotation + variationRotation;
      } else {
        x = config.baseX + (index + 1) * config.offsetX + variationX;
        rotate =
          (index + 1) * config.rotationStep + variationRotation;
      }
    }

    const tailY = isLast
      ? config.tailY
      : isPrevious
        ? config.tailY * 0.5
        : 0;

    return {
      x,
      y:
        config.baseY +
        (index + 1) * config.offsetY +
        Math.cos(index * 2.1) * 0.5 +
        tailY,
      rotate,
      scale: config.scale - index * config.scaleStep,
    };
  });

export const CompletedCardStack: React.FC<CompletedCardStackProps> = ({
  completedTodayCount,
}) => {
  const [config, setConfig] = useState<CompletedStackConfig>(() => ({
    ...INITIAL_COMPLETED_STACK_CONFIG,
  }));
  const [devCompletedCount, setDevCompletedCount] = useState<number | null>(
    null,
  );
  const effectiveCompletedCount =
    import.meta.env.DEV && devCompletedCount !== null
      ? devCompletedCount
      : completedTodayCount;
  const layerCount = Math.max(
    0,
    Math.min(COMPLETED_STACK_MAX_LAYERS, effectiveCompletedCount),
  );
  const offsets = useMemo(
    () => getLayerOffsets(config, layerCount),
    [config, layerCount],
  );
  useEffect(() => {
    const image = new Image();
    image.src = cardBackTexture;
    void image.decode?.().catch(() => undefined);
  }, []);

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 9 }}
        aria-hidden="true"
      >
        {layerCount > 0 && offsets.map((offset, index) => {
          const isAccent =
            index === layerCount - 1 || index === layerCount - 2;
          const shadowScale = isAccent ? 1 : 0.5;
          const shadowYScale = isAccent ? 1 : 1 / 3;
          const shadowBlurScale = isAccent ? 1 : 1 / 3;
          const shadowOpacityScale = isAccent ? 1 : 5 / 6;

          return (
            <div
              key={`completed-card-back-${index}`}
              className="absolute inset-0 overflow-hidden"
              style={{
                borderRadius: `${CARD_RADIUS}px`,
                backgroundImage: `
                  url(${cardBackTexture}),
                  url(${cardboardTexture})
                `,
                backgroundSize: 'cover, cover',
                backgroundPosition: 'center, center',
                backgroundBlendMode: 'normal, multiply',
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${offset.rotate}deg) scale(${offset.scale})`,
                transformOrigin: 'bottom left',
                zIndex: COMPLETED_STACK_MAX_LAYERS - index,
                boxShadow: `
                  -1px 0 2px rgba(0,0,0,0.4),
                  ${config.shadowX * shadowScale}px ${config.shadowY * shadowYScale}px ${config.shadowBlur * shadowBlurScale}px rgba(0,0,0,${config.shadowOpacity * shadowOpacityScale})
                `,
              }}
            />
          );
        })}
      </div>

      {import.meta.env.DEV &&
        (SHOW_COMPLETED_STACK_DEBUG ? (
          <CompletedStackDebugPanel config={config} onChange={setConfig} />
        ) : (
          <div className="fixed right-3 top-3 z-[100] flex gap-2">
            <button
              type="button"
              onClick={() => setDevCompletedCount(COMPLETED_STACK_MAX_LAYERS)}
              className="rounded-md border border-white/15 bg-black/75 px-3 py-2 font-mono text-[12.5px] text-white/80 shadow-lg"
            >{t('Заполнить стопку')}</button>
            <button
              type="button"
              onClick={() => setDevCompletedCount(1)}
              className="rounded-md border border-white/15 bg-black/75 px-3 py-2 font-mono text-[12.5px] text-white/80 shadow-lg"
            >{t('Оставить одну')}</button>
          </div>
        ))}
    </>
  );
};
