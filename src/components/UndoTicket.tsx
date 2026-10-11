import React, { useEffect } from 'react';

interface UndoTicketProps {
  message: string;
  onUndo: () => void;
  /** Called once the ticket has run out; the parent then removes it. */
  onExpire: () => void;
  durationMs?: number;
  style?: React.CSSProperties;
}

/**
 * The "done / take back" line: white lettering pressed into the cloth between
 * the cards and the archive bar, centred on the screen. A thin line under it
 * burns down while the offer lasts. Give it a new `key` for every action so
 * the time restarts.
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
      className="ticket-in pointer-events-none absolute left-1/2 z-40 flex -translate-x-1/2 items-center"
      style={{
        // Never wider than the space between the basket and the other corner.
        maxWidth: 'calc(100vw - 150px)',
        ...style,
      }}
    >
      <div className="pointer-events-auto relative flex items-center justify-center gap-3">
        <span className="embossed-line truncate">{message}</span>

        <button
          type="button"
          onClick={onUndo}
          onTouchStart={() => undefined}
          className="embossed-line embossed-action shrink-0"
        >
          <span aria-hidden="true" className="mr-1.5 text-[15px]">
            ↶
          </span>
          Вернуть
        </button>

        <span
          aria-hidden="true"
          className="ticket-countdown absolute -bottom-2 left-1 right-1 h-px"
          style={{
            backgroundColor: 'rgba(255,214,120,0.5)',
            animationDuration: `${durationMs}ms`,
          }}
        />
      </div>
    </div>
  );
};
