import React, { useEffect, useState } from 'react';

import { PALETTES, type CardPalette } from '../../app/cardTheme';
import { CouponButton } from './CouponButton';

interface CardActionsFaceProps {
  title: string;
  kindLabel: string;
  palette: CardPalette;
  paperTint: string;
  onEdit: () => void;
  onDelete: () => void;
}

const CONFIRM_TIMEOUT_MS = 3_500;

/**
 * The card "turns into itself" with its actions printed on it: the same sheet,
 * two perforated pads. Delete needs a second press, which rearms by itself.
 */
export const CardActionsFace: React.FC<CardActionsFaceProps> = ({
  title,
  kindLabel,
  palette,
  paperTint,
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

  const dangerInk = PALETTES.none.accentDark;

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
        className="mt-6 shrink-0 truncate font-semibold leading-[1.15]"
        style={{
          fontSize: 20,
          color: 'rgba(40,35,29,0.62)',
          letterSpacing: '-0.015em',
        }}
      >
        {title}
      </p>

      <div
        className="mt-5 shrink-0 border-t pt-6"
        style={{ borderColor: 'rgba(69,57,44,0.13)' }}
      >
        <div className="flex flex-col gap-4">
          <CouponButton
            label="Редактировать"
            color={palette.accentDark}
            paperTint={paperTint}
            height={64}
            fontSize={13}
            onClick={onEdit}
          />
          <CouponButton
            label={isConfirming ? 'Точно удалить?' : 'Удалить'}
            color={isConfirming ? dangerInk : 'rgba(40,35,29,0.7)'}
            paperTint={paperTint}
            height={64}
            fontSize={13}
            filled={isConfirming}
            onClick={() => {
              if (isConfirming) {
                onDelete();
                return;
              }

              setIsConfirming(true);
            }}
          />
        </div>
      </div>

      <p
        className="absolute bottom-0 left-0 right-0 font-mono text-[8px] uppercase tracking-[0.15em]"
        style={{ color: 'rgba(0,0,0,0.32)' }}
      >
        Уголок вернёт карточку обратно
      </p>
    </div>
  );
};
