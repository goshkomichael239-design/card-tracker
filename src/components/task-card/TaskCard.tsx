import React from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import {
  CARD_RADIUS,
  PALETTES,
  type CardPalette,
  type VisualCard,
} from '../../app/cardTheme';
import { formatHumanDate, formatShortDate } from '../../app/dateTimeUtils';
import { CompletionCoupon } from './CompletionCoupon';
import { CountdownPanel } from './CountdownPanel';

interface TaskCardProps {
  card: VisualCard;
  onComplete: (couponBounds: DOMRect) => void;
  isStatic?: boolean;
  hideCoupon?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  card,
  onComplete,
  isStatic = false,
  hideCoupon = false
}) => {
  const palette = PALETTES[card.timeMode];

  const targetAt =
    card.timeMode === 'deadline'
      ? card.deadlineAt
      : card.timeMode === 'reminder'
        ? card.reminderAt
        : undefined;

  return (
    <div className="relative h-full w-full">
      <div
        className="pointer-events-none absolute"
        style={{
          left: 10,
          right: -13,
          top: 16,
          bottom: -17,
          borderRadius: `${CARD_RADIUS + 4}px`,
          boxShadow: '18px 27px 42px rgba(0,0,0,0.48)',
        }}
      />

      <div
        className="pointer-events-none absolute"
        style={{
          left: 7,
          right: 1,
          bottom: -8,
          height: 22,
          borderRadius: '0 0 25px 25px',
          backgroundColor: 'rgba(31,24,19,0.5)',
          boxShadow: '0 5px 8px rgba(0,0,0,0.72)',
        }}
      />

      <div
        className="pointer-events-none absolute"
        style={{
          top: 4,
          right: -4,
          bottom: -2,
          width: 28,
          borderRadius: `0 ${CARD_RADIUS}px ${CARD_RADIUS}px 0`,
          backgroundColor: '#685540',
          backgroundImage: `url(${cardboardTexture})`,
          backgroundPosition: 'right center',
          backgroundSize: 'cover',
          backgroundBlendMode: 'multiply',
        }}
      />

      <article
        className="absolute inset-0 flex flex-col overflow-hidden"
        style={{
          borderRadius: `${CARD_RADIUS}px`,
          padding: '22px 22px 20px',
          backgroundColor: palette.paper,
          backgroundImage: `
            radial-gradient(
              circle at 13% 9%,
              rgba(255,255,255,0.28) 0%,
              rgba(255,255,255,0.08) 28%,
              transparent 56%
            ),
            linear-gradient(
              138deg,
              rgba(255,255,255,0.09) 0%,
              transparent 44%,
              rgba(35,25,18,0.14) 100%
            ),
            url(${cardboardTexture})
          `,
          backgroundPosition: 'center, center, center',
          backgroundSize: '100% 100%, 100% 100%, cover',
          backgroundBlendMode: 'soft-light, multiply, multiply',
          border: '1px solid rgba(73,55,40,0.22)',
          boxShadow: `
            inset 1px 1px 1px rgba(255,255,255,0.42),
            inset -2px -2px 3px rgba(55,39,27,0.16)
          `,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: `${CARD_RADIUS}px`,
            background: `
              radial-gradient(
                ellipse at 22% 12%,
                rgba(255,255,255,0.13) 0%,
                transparent 48%
              ),
              linear-gradient(
                145deg,
                transparent 48%,
                rgba(41,29,20,0.075) 100%
              )
            `,
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.32),
              inset 0 -2px 2px rgba(50,35,24,0.1)
            `,
          }}
        />
        <div className="relative z-10 mt-1 shrink-0">
          <CardStamp text="Одна задача" palette={palette} />
        </div>

        <h2
          className="relative z-10 shrink-0 text-[1.55rem] font-bold leading-[1.18]"
          style={{
            marginTop: '24px',
            color: palette.ink,
            letterSpacing: '-0.025em',
          }}
        >
          {card.title}
        </h2>

        {targetAt && card.timeMode !== 'none' && (
          <div className="relative z-10 shrink-0" style={{ marginTop: 22 }}>
            <p
              className="text-[13px] font-semibold leading-snug"
              style={{ color: 'rgba(30,28,26,0.7)' }}
            >
              {card.timeMode === 'deadline'
                ? 'Для выполнения осталось:'
                : 'До напоминания осталось:'}
            </p>

            <div style={{ marginTop: 8 }}>
              <CountdownPanel
                targetAt={targetAt}
                mode={card.timeMode}
                completedAt={card.completedAt}
                palette={palette}
                isStatic={isStatic}
              />
            </div>

            <p
              className="text-center font-mono text-[13px] font-medium leading-relaxed tracking-[-0.015em]"
              style={{
                marginTop: 12,
                color: 'rgba(30,28,26,0.52)',
                textShadow:
                  '0 1px 0 rgba(255,255,255,0.42), 0 -1px 0 rgba(52,38,28,0.16)',
              }}
            >
              {formatHumanDate(targetAt)}
            </p>
          </div>
        )}

        <div className="flex-1" />

        {!hideCoupon && (
          <CompletionCoupon
            completedAt={card.completedAt}
            palette={palette}
            onComplete={onComplete}
          />
        )}

        <div
          className="relative z-10 flex items-center justify-between border-t pt-4"
          style={{ borderColor: 'rgba(0,0,0,0.08)' }}
        >
          <span
            className="font-mono text-[9px] uppercase tracking-[0.14em]"
            style={{ color: 'rgba(30,28,26,0.34)' }}
          >
            TASK
          </span>

          <span
            className="font-mono text-[9px] uppercase tracking-[0.14em]"
            style={{ color: 'rgba(30,28,26,0.34)' }}
          >
            {formatShortDate(card.createdAt)}
          </span>
        </div>
      </article>
    </div>
  );
};

interface CardStampProps {
  text: string;
  palette: CardPalette;
}

const CardStamp: React.FC<CardStampProps> = ({ text, palette }) => {
  return (
    <span
      className="inline-flex min-w-[112px] shrink-0 items-center justify-center whitespace-nowrap rounded-[9px] px-[18px] py-[9px] font-mono text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{
        width: 'max-content',
        minHeight: '36px',
        color: 'rgba(255,255,255,0.94)',
        backgroundColor: palette.accent,
        boxShadow:
          'inset 2px 2px 5px rgba(0,0,0,0.42), inset -1px -1px 1px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.18)',
        textShadow: '0 1px 1px rgba(0,0,0,0.28)',
      }}
    >
      {text}
    </span>
  );
};
