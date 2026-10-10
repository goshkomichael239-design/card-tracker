import React, { useEffect } from 'react';

import cardboardTexture from '../assets/cardboard.avif';
import { CouponPerforation } from './task-card/CouponPerforation';

interface UndoTicketProps {
  message: string;
  onUndo: () => void;
  /** Called once the ticket has run out; the parent then removes it. */
  onExpire: () => void;
  durationMs?: number;
  style?: React.CSSProperties;
}

/**
 * A small perforated paper ticket that slides up after a destructive action
 * and offers to take it back. A strip along its bottom edge burns down while
 * the offer lasts. Give it a new `key` for every action so the time restarts.
 */
export const UndoTicket: React.FC<UndoTicketProps> = ({
  message,
  onUndo,
  onExpire,
  durationMs = 6_000,
  style,
}) => {
  useEffect(() => {
    const timer = window.setTimeout(onExpire, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onExpire]);

  return (
    <div
      role="status"
      className="ticket-in absolute left-1/2 z-40 -translate-x-1/2"
      style={style}
    >
      <div
        className="engraved relative flex max-w-[calc(100vw-32px)] items-center gap-3 overflow-hidden rounded-[10px] py-2.5 pl-4 pr-2.5"
        style={{
          backgroundColor: '#F7F2E8',
          backgroundImage: `url(${cardboardTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'multiply',
          boxShadow:
            '0 10px 22px rgba(0,0,0,0.38), 0 2px 4px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        <CouponPerforation />

        <span
          className="relative whitespace-nowrap text-[14px] font-semibold"
          style={{ color: '#3F3932' }}
        >
          {message}
        </span>

        <button
          type="button"
          onClick={onUndo}
          onTouchStart={() => undefined}
          className="pill-action relative"
          style={
            {
              padding: '9px 15px',
              ['--pill-bg' as string]: 'rgba(205,83,52,0.12)',
              ['--pill-ink' as string]: '#8F3025',
              ['--pill-glow' as string]: '#FFC2A6',
            } as React.CSSProperties
          }
        >
          Вернуть
        </button>

        <span
          aria-hidden="true"
          className="ticket-countdown absolute bottom-0 left-0 right-0 h-[3px]"
          style={{
            backgroundColor: 'rgba(143,48,37,0.45)',
            animationDuration: `${durationMs}ms`,
          }}
        />
      </div>
    </div>
  );
};
