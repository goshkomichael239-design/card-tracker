import React, { useRef } from 'react';

import type { VisualCard } from '../../app/cardTheme';
import { STAMP_RED_GLOW } from '../../app/stampRed';
import { useWheelNavigation } from '../../app/useWheelNavigation';

interface DeckDotsProps {
  cards: VisualCard[];
  activeCardId: string;
  overdueIds?: ReadonlySet<string>;
  onSelectIndex: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
}

/** Height of one dot's slot on the rail. */
const SLOT_PX = 22;
/** Pixels of finger or mouse travel along the dots for one card: quick. */
const DOT_STEP_PX = 22;
/** Dots further from the active one than this are not drawn. */
const REACH = 3;

const SCALE_BY_DISTANCE = [1.18, 1, 0.78, 0.5];
const OPACITY_BY_DISTANCE = [1, 1, 0.75, 0.35];

const RAIL_MASK =
  'linear-gradient(180deg, transparent 0, #000 22%, #000 78%, transparent 100%)';

interface DotsGesture {
  id: number;
  y: number;
  startIndex: number;
  /** The dot that was under the pointer at the start (for a plain tap). */
  tappedIndex: number | null;
  isDragging: boolean;
}

/**
 * Page dots in a column beside the stack: where you are in the deck.
 *
 * The dots sit on a rail that glides under a fixed centre as the active card
 * changes: those near the middle are full size, those toward the ends shrink
 * and fade, so nothing jumps. Press a dot to go to its card; hold and drag
 * along the dots (mouse or finger) to run through the deck, quickly; the wheel
 * over them turns the cards too.
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

  // With few cards the rail stands still, centred, and only the mark moves.
  // Otherwise it is a loop: past the last dot come the first ones again.
  const count = cards.length;
  const isShort = count < REACH * 2 + 1;
  const slots = isShort
    ? cards.map((card, index) => ({ card, index, offset: index - (count - 1) / 2 }))
    : Array.from({ length: REACH * 2 + 1 }, (_, position) => {
        const offset = position - REACH;
        const index = (((activeIndex + offset) % count) + count) % count;

        return { card: cards[index]!, index, offset };
      });
  const height = (REACH * 2 + 1) * SLOT_PX;

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

    // Dragging down goes deeper into the deck, like following the dots, and
    // round the loop when it runs out.
    const target =
      (((gesture.startIndex + Math.trunc(dy / DOT_STEP_PX)) % cards.length) +
        cards.length) %
      cards.length;

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
      className="absolute"
      style={{
        left: 'calc(100% + 58px)',
        top: '50%',
        width: 30,
        height,
        transform: 'translateY(-50%)',
        touchAction: 'none',
        cursor: 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        zIndex: 25,
        // The ends of the rail fade out instead of being cut.
        WebkitMaskImage: RAIL_MASK,
        maskImage: RAIL_MASK,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishGesture}
      onPointerCancel={finishGesture}
    >
      {slots.map(({ card, index, offset }) => {
        const isActive = index === activeIndex;
        const distance = Math.min(Math.abs(offset), 3);
        // Full size at the middle, smaller and fainter toward the ends.
        const scale = isShort ? 1 : SCALE_BY_DISTANCE[distance]!;
        const opacity = isShort ? 1 : OPACITY_BY_DISTANCE[distance]!;
        const isOverdue = Boolean(overdueIds?.has(card.id));
        const ring = isOverdue ? STAMP_RED_GLOW : 'rgba(250,244,226,0.9)';

        return (
          <span
            key={card.id}
            data-dot-index={index}
            aria-label={'Карточка ' + (index + 1) + ' из ' + cards.length}
            aria-current={isActive ? 'true' : undefined}
            className="absolute left-0 flex items-center justify-center"
            style={{
              top: '50%',
              width: 30,
              height: SLOT_PX,
              marginTop: -SLOT_PX / 2,
              transform: 'translate3d(0, ' + offset * SLOT_PX + 'px, 0)',
              opacity,
              transition:
                'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms ease-out',
            }}
          >
            <span
              className="block rounded-full"
              style={{
                width: 10,
                height: 10,
                boxSizing: 'border-box',
                border: '2px solid ' + ring,
                backgroundColor: isActive ? ring : 'transparent',
                boxShadow: '0 1px 2px rgba(0,0,0,0.45)',
                transform: 'scale(' + scale + ')',
                transition:
                  'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), background-color 160ms ease-out',
              }}
            />
          </span>
        );
      })}
    </div>
  );
};
