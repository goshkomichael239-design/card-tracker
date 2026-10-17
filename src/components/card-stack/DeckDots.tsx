import React, { useRef } from 'react';

import type { VisualCard } from '../../app/cardTheme';
import {
  STAMP_RED_DOT_BACKGROUND,
  STAMP_RED_DARK,
} from '../../app/stampRed';
import { useWheelNavigation } from '../../app/useWheelNavigation';
import { t } from '../../app/i18n';

interface DeckDotsProps {
  cards: VisualCard[];
  activeCardId: string;
  overdueIds?: ReadonlySet<string>;
  onSelectIndex: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  /** How far the rail stands from the card's right edge (px). */
  offsetX?: number;
}

/** Height of one dot's slot on the rail. */
const SLOT_PX = 22;
/** Pixels of finger or mouse travel along the dots for one card: quick. */
const DOT_STEP_PX = 22;
/** Dots further from the active one than this are not drawn. */
const REACH = 3;

const SCALE_BY_DISTANCE = [1.18, 1, 0.78, 0.5];
const OPACITY_BY_DISTANCE = [1, 1, 0.75, 0.35];
/**
 * How far the dots further from the middle are drawn back toward the stack
 * (px): the rail is the rim of a wheel sunk in the table, so its middle stands
 * out the most and its ends curve away.
 */
const ARC_BY_DISTANCE = [0, 0.8, 2.8, 5.5];

/** The brass bead of the card on the table: raised, lit from the upper left. */
const BRASS_BEAD =
  'radial-gradient(circle at 32% 28%, #fff4c8 0%, #e2b556 42%, #9a6c22 100%)';

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
  offsetX = 58,
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
      aria-label={t('Карточки в стопке')}
      className="absolute"
      style={{
        left: `calc(100% + ${offsetX}px)`,
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
      {/* The slot in the cloth the rim shows through. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          left: 6,
          top: 0,
          bottom: 0,
          width: 18,
          borderRadius: 9,
          background:
            'linear-gradient(90deg, rgba(0,14,7,0.42), rgba(0,14,7,0.22))',
          boxShadow:
            'inset 1.5px 2px 3px rgba(0,0,0,0.55), 0.5px 1px 0 rgba(255,255,255,0.1)',
        }}
      />

      {slots.map(({ card, index, offset }) => {
        const isActive = index === activeIndex;
        const distance = Math.min(Math.abs(offset), 3);
        // Full size at the middle, smaller and fainter toward the ends.
        const scale = isShort ? 1 : SCALE_BY_DISTANCE[distance]!;
        const opacity = isShort ? 1 : OPACITY_BY_DISTANCE[distance]!;
        const isOverdue = Boolean(overdueIds?.has(card.id));
        const arc = isShort ? 0 : ARC_BY_DISTANCE[distance]!;

        return (
          <span
            key={card.id}
            data-dot-index={index}
            aria-label={t('Карточка ') + (index + 1) + t(' из ') + cards.length}
            aria-current={isActive ? 'true' : undefined}
            className="absolute left-0 flex items-center justify-center"
            style={{
              top: '50%',
              width: 30,
              height: SLOT_PX,
              marginTop: -SLOT_PX / 2,
              transform:
                'translate3d(' + -arc + 'px, ' + offset * SLOT_PX + 'px, 0)',
              opacity,
              transition:
                'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms ease-out',
            }}
          >
            <span
              className="block rounded-full"
              style={{
                width: isActive ? 11 : 10,
                height: isActive ? 11 : 10,
                boxSizing: 'border-box',
                // The card on the table is a raised bead (brass, or the red
                // wax of the stamp if it is overdue); the others are holes
                // sunk in the cloth, the overdue ones with a red floor.
                background: isActive
                  ? isOverdue
                    ? STAMP_RED_DOT_BACKGROUND
                    : BRASS_BEAD
                  : isOverdue
                    ? 'radial-gradient(circle at 60% 65%, rgba(184,72,58,0.55), rgba(60,10,6,0.7) 80%)'
                    : 'radial-gradient(circle at 62% 66%, rgba(255,255,255,0.1), rgba(0,12,6,0.55) 78%)',
                boxShadow: isActive
                  ? '1.5px 2px 3px rgba(0,0,0,0.55), 0 0 7px ' +
                    (isOverdue ? 'rgba(240,144,127,0.5)' : 'rgba(255,214,120,0.5)') +
                    ', inset -1px -1px 1.5px rgba(60,30,0,0.35)'
                  : 'inset 1.3px 1.6px 2px rgba(0,0,0,0.78), 0.6px 1px 0 rgba(255,255,255,0.2)' +
                    (isOverdue ? ', 0 0 0 1px ' + STAMP_RED_DARK + '99' : ''),
                transform: 'scale(' + scale + ')',
                // A little overshoot, as a detent clicking into place.
                transition:
                  'transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1), width 160ms ease-out, height 160ms ease-out',
              }}
            />
          </span>
        );
      })}
    </div>
  );
};
