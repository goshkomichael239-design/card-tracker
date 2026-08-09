import React, { useMemo, useRef, useState } from 'react';

import moleskineTexture from '../../assets/Moleskine.avif';
import type { VisualCard } from '../../app/cardTheme';
import { CardSwitcherDebugPanel } from './CardSwitcherDebugPanel';
import {
  INITIAL_CARD_SWITCHER_CONFIG,
  type CardSwitcherConfig,
} from './cardSwitcherConfig';

interface CardSwitcherProps {
  cards: VisualCard[];
  activeCardId: string;
  onSelectCard: (cardId: string) => void;
}

const MAX_VISIBLE_ROWS = 4;
const WHEEL_THRESHOLD = 36;
const WHEEL_COOLDOWN_MS = 260;

export const CardSwitcher: React.FC<CardSwitcherProps> = ({
  cards,
  activeCardId,
  onSelectCard,
}) => {
  const [config, setConfig] = useState<CardSwitcherConfig>(() => ({
    ...INITIAL_CARD_SWITCHER_CONFIG,
  }));
  const wheelAccumulatorRef = useRef(0);
  const wheelCooldownUntilRef = useRef(0);

  const activeIndex = Math.max(
    0,
    cards.findIndex((card) => card.id === activeCardId),
  );
  const windowStart = Math.min(
    Math.max(0, activeIndex - (MAX_VISIBLE_ROWS - 1)),
    Math.max(0, cards.length - MAX_VISIBLE_ROWS),
  );
  const visibleCards = useMemo(
    () => cards.slice(windowStart, windowStart + MAX_VISIBLE_ROWS),
    [cards, windowStart],
  );

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const now = Date.now();
    if (now < wheelCooldownUntilRef.current) {
      wheelAccumulatorRef.current = 0;
      return;
    }

    const normalizedDelta =
      event.deltaMode === 1
        ? event.deltaY * 16
        : event.deltaMode === 2
          ? event.deltaY * window.innerHeight
          : event.deltaY;
    wheelAccumulatorRef.current += normalizedDelta;

    if (Math.abs(wheelAccumulatorRef.current) < WHEEL_THRESHOLD) {
      return;
    }

    const direction = wheelAccumulatorRef.current > 0 ? 1 : -1;
    const nextIndex = Math.min(
      cards.length - 1,
      Math.max(0, activeIndex + direction),
    );
    wheelAccumulatorRef.current = 0;
    wheelCooldownUntilRef.current = now + WHEEL_COOLDOWN_MS;

    if (nextIndex !== activeIndex) {
      onSelectCard(cards[nextIndex].id);
    }
  };

  return (
    <>
      <div
        className="relative"
        style={{ width: config.width, height: config.height }}
        onWheel={handleWheel}
      >
        <div
          className="relative h-full w-full overflow-hidden"
          style={{ borderRadius: config.borderRadius }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url(${moleskineTexture})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${config.backgroundSize}px auto`,
              backgroundPosition: `${config.backgroundX}px ${config.backgroundY}px`,
              opacity: config.textureOpacity,
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              paddingLeft: config.paddingLeft,
              paddingRight: config.paddingRight,
              paddingTop: config.paddingTop,
              paddingBottom: config.paddingBottom,
            }}
          >
            <div className="flex flex-col" style={{ gap: config.rowGap }}>
              {visibleCards.map((card) => {
                const isActive = card.id === activeCardId;

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => onSelectCard(card.id)}
                    className="relative block w-full border-0 bg-transparent p-0 text-left"
                    style={{ height: config.rowHeight }}
                    aria-pressed={isActive}
                  >
                    {isActive && (
                      <span
                        className="pointer-events-none absolute left-1/2 top-1/2"
                        style={{
                          width: config.activeWidth,
                          height: config.activeHeight,
                          borderRadius: config.activeRadius,
                          backgroundColor: `rgba(46,42,36,${config.activeOpacity})`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    )}
                    <span
                      className="relative z-10 block w-full truncate font-mono font-semibold"
                      style={{
                        color: 'rgba(30,28,26,0.78)',
                        fontSize: config.fontSize,
                        lineHeight: `${config.rowHeight}px`,
                        transform: `translateX(${config.textX}px)`,
                      }}
                    >
                      {card.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className="absolute top-1/2 flex -translate-y-1/2 flex-col"
          style={{ left: config.dotsX, gap: config.dotGap }}
        >
          {cards.map((card) => {
            const isActive = card.id === activeCardId;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelectCard(card.id)}
                className="shrink-0 rounded-full border-0 p-0"
                style={{
                  width: config.dotSize,
                  height: config.dotSize,
                  backgroundColor: isActive
                    ? 'rgba(238,224,192,0.96)'
                    : 'rgba(238,224,192,0.34)',
                  boxShadow: isActive
                    ? '0 0 0 1px rgba(25,20,16,0.42)'
                    : 'none',
                }}
                aria-label={`Выбрать карточку ${card.title}`}
                aria-pressed={isActive}
              />
            );
          })}
        </div>
      </div>

      {import.meta.env.DEV && (
        <CardSwitcherDebugPanel config={config} onChange={setConfig} />
      )}
    </>
  );
};
