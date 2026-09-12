import React from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { PALETTES, type VisualCard } from '../../app/cardTheme';
import { formatHumanDate, formatShortDate } from '../../app/dateTimeUtils';
import { CompletionCoupon } from './CompletionCoupon';
import { CountdownPanel } from './CountdownPanel';
import { INITIAL_TASK_CARD_V2_CONFIG } from './taskCardV2Config';

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
  hideCoupon = false,
}) => {
  const palette = PALETTES[card.timeMode];
  const config = INITIAL_TASK_CARD_V2_CONFIG;
  const targetAt =
    card.timeMode === 'deadline'
      ? card.deadlineAt
      : card.timeMode === 'reminder'
        ? card.reminderAt
        : undefined;
  const timeLabel = card.timeMode === 'deadline' ? 'Срок' : 'Напоминание';

  return (
    <article
      className="absolute inset-0 flex flex-col overflow-hidden border"
      style={{
        borderRadius: config.borderRadius,
        padding: config.contentPadding,
        backgroundColor: config.paperTint,
        borderColor: 'rgba(91,76,59,0.16)',
        boxShadow: `${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px rgba(20,17,14,${config.shadowOpacity}), inset 0 1px 0 rgba(255,255,255,0.88), inset 0 -1px 2px rgba(79,61,42,0.08)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url(${cardboardTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mixBlendMode: 'multiply',
          opacity: config.paperTextureOpacity,
        }}
      />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{
              color: palette.accentDark,
              backgroundColor: `${palette.accent}1d`,
            }}
          >
            Одна задача
          </span>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
            style={{
              color: palette.accentDark,
              backgroundColor: `${palette.accent}18`,
            }}
            aria-hidden="true"
          >
            ◔
          </span>
        </div>

        <h2
          className="shrink-0 font-semibold leading-[1.08]"
          style={{
            marginTop: config.titleGap,
            fontSize: config.titleSize,
            color: '#28231D',
            letterSpacing: '-0.025em',
          }}
        >
          {card.title}
        </h2>

        {targetAt ? (
          <div
            className="shrink-0 border-t pt-4"
            style={{
              marginTop: config.infoGap,
              borderColor: 'rgba(69,57,44,0.13)',
            }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6B6258]">
              {timeLabel}
            </p>
            <div className="mt-2">
              <CountdownPanel
                targetAt={targetAt}
                mode={card.timeMode === 'deadline' ? 'deadline' : 'reminder'}
                completedAt={card.completedAt}
                palette={palette}
                isStatic={isStatic}
              />
            </div>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-[#776E63]">
              {formatHumanDate(targetAt)}
            </p>
          </div>
        ) : (
          <p
            className="shrink-0 border-t pt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[#776E63]"
            style={{
              marginTop: config.infoGap,
              borderColor: 'rgba(69,57,44,0.13)',
            }}
          >
            Без срока
          </p>
        )}

        {(!hideCoupon || card.completedAt) && (
          <div
            className="absolute left-0 right-0"
            style={{
              bottom: config.couponBottom,
              height: config.couponHeight,
            }}
          >
            <CompletionCoupon
              completedAt={card.completedAt}
              palette={palette}
              onComplete={onComplete}
              height={config.couponHeight}
              paperTint={config.paperTint}
            />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.15em] text-black/30">
          <span>Task</span>
          <span>{formatShortDate(card.createdAt)}</span>
        </div>
      </div>
    </article>
  );
};
