import React, { useRef } from 'react';

import type { VisualCard } from '../../app/cardTheme';
import { useWheelNavigation } from '../../app/useWheelNavigation';

interface DeckDotsProps {
  cards: VisualCard[];
  activeCardId: string;
  overdueIds?: ReadonlySet<string>;
  onSelectIndex: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const DOT_COUNT = 5;
/** Pixels of finger or mouse travel along the dots for one card: quick. */
const DOT_STEP_PX = 22;

/** Which cards the dots stand for: a window of five that follows the active one. */
const getDotWindow = (cardCount: number, activeIndex: number) => {
  const size = Math.min(DOT_COUNT, cardCount);
  const start = Math.min(
    Math.max(0, activeIndex - Math.floor(size / 2)),
    Math.max(0, cardCount - size),
  );

  return { start, size };
};

interface DotsGesture {
  id: number;
  y: number;
  startIndex: number;
  /** The dot that was under the pointer at the start (for a plain tap). */
  tappedIndex: number | null;
  isDragging: boolean;
}

/**
 * Page dots in a column beside the stack: where you are in the deck. Press a
 * dot to go to its card; hold and drag along the dots (mouse or finger) to
 * run through the deck, quickly; the wheel over them turns the cards too.
 */
export const DeckDots: React.FC<DeckDotsProps> = ({
  cards,
  activeCardId,
  overdueIds,
  onSelectIndex,
  onNext,
  onPrevious,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gestureRef = useRef<DotsGesture | null>(null);
  const activeIndex = Math.max(
    0,
    cards.findIndex((card) => card.id === activeCardId),
  );

  useWheelNavigation(containerRef, {
    onNext,
    onPrevious,
    isEnabled: cards.length > 1,
  });

  if (cards.length < 2) {
    return null;
  }

  const { start, size } = getDotWindow(cards.length, activeIndex);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    // The dots are their own gesture: the card scene behind must not see it.
    event.stopPropagation();

    const dot = (event.target as Element).closest<HTMLElement>(
      '[data-dot-index]',
    );

    gestureRef.current = {
      id: event.pointerId,
      y: event.clientY,
      startIndex: activeIndex,
      tappedIndex: dot ? Number(dot.dataset.dotIndex) : null,
      isDragging: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;

    if (!gesture || gesture.id !== event.pointerId) {
      return;
    }

    const dy = event.clientY - gesture.y;

    if (!gesture.isDragging && Math.abs(dy) < 5) {
      return;
    }

    gesture.isDragging = true;

    // Dragging down goes deeper into the deck, like following the dots.
    const target = Math.min(
      cards.length - 1,
      Math.max(0, gesture.startIndex + Math.trunc(dy / DOT_STEP_PX)),
    );

    if (target !== activeIndex) {
      onSelectIndex(target);
    }
  };

  const finishGesture = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;

    if (!gesture || gesture.id !== event.pointerId) {
      return;
    }

    gestureRef.current = null;

    if (!gesture.isDragging && gesture.tappedIndex !== null) {
      onSelectIndex(gesture.tappedIndex);
    }
  };

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Карточки в стопке"
      className="absolute flex flex-col items-center"
      style={{
        left: 'calc(100% + 58px)',
        top: '50%',
        transform: 'translateY(-50%)',
        width: 30,
        padding: '10px 0',
        gap: 4,
        touchAction: 'none',
        cursor: 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        zIndex: 25,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishGesture}
      onPointerCancel={finishGesture}
    >
      {Array.from({ length: size }, (_, offset) => {
        const index = start + offset;
        const card = cards[index]!;
        const isActive = index === activeIndex;
        // The ends of a window that has more deck beyond it are drawn smaller.
        const isEdgeSmall =
          (offset === 0 && start > 0) ||
          (offset === size - 1 && start + size < cards.length);
        const diameter = isEdgeSmall ? 6 : 10;
        const isOverdue = Boolean(overdueIds?.has(card.id));
        const ring = isOverdue ? '#F0907F' : 'rgba(250,244,226,0.85)';

        return (
          <span
            key={card.id}
            data-dot-index={index}
            className="flex h-[22px] w-[30px] shrink-0 items-center justify-center"
            aria-label={`Карточка ${index + 1} из ${cards.length}`}
            aria-current={isActive ? 'true' : undefined}
          >
            <span
              className="block rounded-full transition-all duration-150"
              style={{
                width: diameter,
                height: diameter,
                boxSizing: 'border-box',
                border: `2px solid ${ring}`,
                backgroundColor: isActive ? ring : 'transparent',
                boxShadow: '0 1px 2px rgba(0,0,0,0.45)',
                transform: isActive ? 'scale(1.15)' : 'scale(1)',
              }}
            />
          </span>
        );
      })}
    </div>
  );
};
