import React, { useEffect, useState } from 'react';

import type { CardPalette } from '../../app/cardTheme';

interface CardActionsFaceProps {
  title: string;
  kindLabel: string;
  palette: CardPalette;
  onEdit: () => void;
  onDelete: () => void;
}

const CONFIRM_TIMEOUT_MS = 3_500;

const drawDelay = (ms: number): React.CSSProperties =>
  ({ ['--draw-delay' as string]: `${ms}ms` }) as React.CSSProperties;

/**
 * The card "turns into itself" with its actions pressed into the paper: two
 * words, no buttons around them. Delete needs a second press and rearms by
 * itself.
 */
export const CardActionsFace: React.FC<CardActionsFaceProps> = ({
  title,
  kindLabel,
  palette,
  onEdit,
  onDelete,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isConfirming) {
      return;
    }

    const timer = window.setTimeout(
      () => setIsConfirming(false),
      CONFIRM_TIMEOUT_MS,
    );

    return () => window.clearTimeout(timer);
  }, [isConfirming]);

  // The slots light up in this card's own second accent.
  const glowStyle = {
    ['--etched-glow' as string]: palette.glow,
  } as React.CSSProperties;

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span
          className="rounded-full px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
          style={{
            color: palette.accentDark,
            backgroundColor: `${palette.accent}1d`,
          }}
        >
          {kindLabel}
        </span>
      </div>

      <p
        className="draw-in mt-6 shrink-0 truncate font-semibold leading-[1.15]"
        style={{
          ...drawDelay(120),
          fontSize: 20,
          color: 'rgba(40,35,29,0.62)',
          letterSpacing: '-0.015em',
        }}
      >
        {title}
      </p>

      {/* The two slots sit around the card's middle, a little above centre, so
          they read as the card's content and not as a list under the title. */}
      <div
        className="absolute left-0 right-0 flex flex-col gap-3"
        style={{ top: '43%', transform: 'translateY(-50%)' }}
      >
        <button
          type="button"
          onClick={onEdit}
          // iOS only applies :active when the element has a touch listener.
          onTouchStart={() => undefined}
          className="etched-action draw-in"
          style={{ ...drawDelay(200), ...glowStyle }}
        >
          <span className="etched-action__text">Редактировать</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (isConfirming) {
              onDelete();
              return;
            }

            setIsConfirming(true);
          }}
          onTouchStart={() => undefined}
          className={`etched-action draw-in${isConfirming ? ' etched-action--armed' : ''}`}
          // While armed the warm "are you sure" glow from the CSS takes over.
          style={{
            ...drawDelay(290),
            ...(isConfirming ? undefined : glowStyle),
          }}
        >
          <span className="etched-action__text">
            {isConfirming ? 'Точно удалить?' : 'Удалить'}
          </span>
        </button>
      </div>

      <p
        className="draw-in absolute bottom-0 left-0 right-0 font-mono text-[8px] uppercase tracking-[0.15em]"
        style={{ ...drawDelay(380), color: 'rgba(0,0,0,0.32)' }}
      >
        Уголок вернёт карточку обратно
      </p>
    </div>
  );
};
